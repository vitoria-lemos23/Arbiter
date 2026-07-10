// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @dev Bracket format. Only single-elimination exists today; new variants must
///      be appended (never reordered) so stored enum indices stay stable.
enum TournamentFormat {
  SingleElimination // index 0; only supported format for now
}

/// @dev Per-match lifecycle (#007). Values are append-only so stored indices
///      stay stable and the indexer can map them by number.
enum MatchStatus {
  Pending, // 0: one or both player slots still TBD; not votable
  Active, // 1: both players set, judges may vote
  Completed // 2: winner decided by majority vote
}

/// @dev Tournament lifecycle (#007). Registration -> Active (bracket generated)
///      -> Completed (final resolved, prize paid). Append-only.
enum TournamentStatus {
  Registration, // 0: default after initialize; accepting players
  Active, // 1: bracket generated, matches in progress
  Completed // 2: final match resolved, prize paid, fees withdrawable
}

/// @dev Creation parameters shared between the factory entry point and the
///      clone's initializer. `entryFee` is stored but NOT collected in this spec.
struct TournamentParams {
  TournamentFormat format;
  uint32 maxPlayers; // bracket capacity; must be >= 2 and a power of two
  uint256 entryFee; // wei; 0 allowed (free tournament)
  uint64 startDate; // unix seconds; must be in the future
  uint64 endDate; // unix seconds; must be > startDate
  address[] judges; // voting panel; must be non-empty and odd-sized (#007)
}

/// @dev One node of the single-elimination binary tree. `winner`/`status`/
///      `voteCount` are driven by the #007 voting engine. Per-match vote detail
///      lives in the `_votes`/`_votesFor` mappings (Solidity forbids mappings
///      inside array-stored structs).
struct Match {
  address playerA; // address(0) => TBD (internal node, filled on advancement)
  address playerB;
  address winner;  // address(0) => unresolved
  MatchStatus status; // Pending -> Active -> Completed
  uint8 voteCount; // total judge votes cast on this match
}

error InvalidMaxPlayers(uint32 provided);
error MaxPlayersNotPowerOfTwo(uint32 provided);
error StartDateInPast(uint64 startDate, uint64 nowTs);
error InvalidDateRange(uint64 startDate, uint64 endDate);
error ZeroJudgeAddress(uint256 index);
error RegistrationClosed(uint64 nowTs, uint64 startDate);
error AlreadyRegistered(address player);
error TournamentFull(uint32 maxPlayers);
error IncorrectEntryFee(uint256 provided, uint256 required);
error EmptyJudgeArray();
error OddJudgeCountRequired(uint256 provided);
error NotJudge(address caller);
error MatchNotActive(uint256 matchIndex, MatchStatus current);
error AlreadyVoted(uint256 matchIndex, address judge);
error InvalidVoteTarget(uint256 matchIndex, address player);
error InvalidMatchIndex(uint256 matchIndex, uint256 matchCount);
error TournamentNotCompleted(TournamentStatus current);
error NotOrganizer(address caller);
error NoFeesToWithdraw();
error PrizeTransferFailed(address champion, uint256 amount);
error FeeTransferFailed(address organizer, uint256 amount);

/// @title Tournament
/// @notice Per-tournament configuration holder, deployed as an EIP-1167 clone of
///         a single locked implementation. Each clone owns its own storage and
///         ETH balance; this spec covers configuration/retrieval only.
contract Tournament is Initializable, ReentrancyGuard {
  address public organizer;
  TournamentFormat public format;
  uint32 public maxPlayers;
  uint256 public entryFee;
  /// @notice Prize pot deposited by the organizer at creation, held by this
  ///         clone as ETH (`msg.value`). Pushed to the champion when the final
  ///         match resolves (#007).
  uint256 public prize;
  uint64 public startDate;
  uint64 public endDate;
  /// @notice Tournament lifecycle latch (#007). Registration -> Active -> Completed.
  TournamentStatus public status;
  address[] private _judges;
  /// @notice O(1) judge-membership check for `castVote` authorization; mirrors
  ///         `_judges` (populated in {_storeJudges}).
  mapping(address => bool) public isJudge;
  /// @dev matchIndex => judge => player voted for (address(0) => not voted).
  mapping(uint256 => mapping(address => address)) private _votes;
  /// @dev matchIndex => player => vote count for that player in that match.
  mapping(uint256 => mapping(address => uint8)) private _votesFor;
  /// @notice O(1) membership check; also gates duplicate registration.
  mapping(address => bool) public isRegistered;
  /// @dev Enumerable roster in registration order; its index is the player's
  ///      `position` (the future bracket seed). Length is the single source of
  ///      truth for {participantCount} — no separate counter.
  address[] private _participants;

  Match[] private _matches;         // heap-indexed; index 0 = final; length maxPlayers-1
  bool public bracketGenerated;     // one-shot latch; true once the field fills
  uint64 public bracketGeneratedAt; // block timestamp of generation

  /// @notice Emitted once, from the register() that fills the final slot.
  /// @param playerCount maxPlayers (the full field size, == N).
  /// @param seeding     Players in standard bracket-slot order (length N); the
  ///                    indexer derives every match (round 1 + TBD ancestors).
  event BracketGenerated(uint32 playerCount, address[] seeding);

  /// @notice Emitted once, from {initialize}. Judges are omitted to bound log
  ///         cost; read the full list via {getJudges}.
  event TournamentInitialized(
    address indexed organizer,
    TournamentFormat format,
    uint32 maxPlayers,
    uint256 entryFee,
    uint256 prize,
    uint64 startDate,
    uint64 endDate
  );

  /// @notice Emitted on every successful {register} call. `position` is the
  ///         0-based registration order, recorded as the future bracket seed.
  event PlayerRegistered(
    address indexed player,
    uint32 indexed position,
    uint256 entryFeePaid
  );

  /// @notice Emitted on every accepted {castVote}. Fully public, real-time.
  event VoteCast(
    uint256 indexed matchIndex,
    address indexed judge,
    address indexed votedFor
  );

  /// @notice Emitted when a match reaches a majority and its winner is set.
  event MatchResolved(
    uint256 indexed matchIndex,
    address indexed winner,
    uint8 votesForWinner,
    uint8 totalVotes
  );

  /// @notice Emitted when a match becomes votable (both player slots filled):
  ///         round-1 leaves at generation, internal nodes on advancement.
  event MatchActivated(uint256 indexed matchIndex);

  /// @notice Emitted once when the final match (index 0) resolves.
  event TournamentCompleted(address indexed champion);

  /// @notice Emitted once per judge during {initialize}. Both params are indexed
  ///         so the ponder indexer can build a per-judge tournament list (the
  ///         "tournaments I judge" query) efficiently, mirroring how
  ///         {PlayerRegistered} backs the per-player list (#008).
  event JudgeAssigned(address indexed tournament, address indexed judge);

  /// @notice Emitted when the prize is pushed to the champion.
  event PrizeClaimed(address indexed champion, uint256 amount);

  /// @notice Emitted when the organizer withdraws accumulated entry fees.
  event FeesWithdrawn(address indexed organizer, uint256 amount);

  /// @dev Locks the implementation so it can never be initialized directly;
  ///      only clones (which start uninitialized) may call {initialize}.
  constructor() {
    _disableInitializers();
  }

  /// @notice One-time configuration of a freshly cloned tournament.
  /// @dev Called by the factory immediately after cloning, forwarding the
  ///      organizer's `msg.value` as the prize pot. The `initializer` modifier
  ///      reverts on any second call. `organizer_` is supplied by the factory
  ///      (it derives it from `msg.sender`), not by the organizer, to prevent
  ///      spoofing. `payable` so the clone can hold the deposited prize.
  /// @param organizer_ The tournament owner; the factory's caller.
  /// @param params Validated-on-entry creation parameters.
  function initialize(address organizer_, TournamentParams calldata params)
    external
    payable
    initializer
  {
    _validate(params);

    organizer = organizer_;
    format = params.format;
    maxPlayers = params.maxPlayers;
    entryFee = params.entryFee;
    prize = msg.value;
    startDate = params.startDate;
    endDate = params.endDate;
    _storeJudges(params.judges);

    emit TournamentInitialized(
      organizer_,
      params.format,
      params.maxPlayers,
      params.entryFee,
      msg.value,
      params.startDate,
      params.endDate
    );
  }

  /// @notice Self-register the caller into the tournament, paying the entry fee.
  /// @dev Only `msg.sender` is ever enrolled (self-only, permissionless).
  ///      Registration is final in this version (no withdrawal) and open until
  ///      `startDate`. The fee is held by this clone; no external calls are
  ///      made, so no reentrancy guard is required.
  /// Example: tournament.register{value: entryFee}();
  function register() external payable {
    if (block.timestamp >= startDate) {
      revert RegistrationClosed(uint64(block.timestamp), startDate);
    }
    if (isRegistered[msg.sender]) {
      revert AlreadyRegistered(msg.sender);
    }
    if (_participants.length >= maxPlayers) {
      revert TournamentFull(maxPlayers);
    }
    if (msg.value != entryFee) {
      revert IncorrectEntryFee(msg.value, entryFee);
    }

    uint32 position = uint32(_participants.length);
    isRegistered[msg.sender] = true;
    _participants.push(msg.sender);

    emit PlayerRegistered(msg.sender, position, msg.value);

    if (_participants.length == maxPlayers) {
      _generateBracket();
    }
  }

  /// @dev Seeds round-1 leaves via standard bracket seeding and reserves internal
  ///      nodes as TBD. Reachable exactly once, when the field first fills
  ///      (register() reverts TournamentFull afterwards), so no re-entry guard.
  function _generateBracket() private {
    bracketGenerated = true;
    bracketGeneratedAt = uint64(block.timestamp);
    // The bracket generating is the tournament's start trigger (#007).
    status = TournamentStatus.Active;

    uint32 n = maxPlayers;
    // 1. Pre-size the tree: n-1 matches, all Pending/TBD.
    for (uint256 i = 0; i < n - 1; i++) {
      _matches.push(
        Match(address(0), address(0), address(0), MatchStatus.Pending, 0)
      );
    }
    // 2. Compute standard bracket-slot order (seeds) and fill the leaves
    //    [n/2 - 1 .. n - 2] with the seeded player pairs.
    address[] memory seeding = _seedLeaves(); // length n, players in slot order
    for (uint256 k = 0; k < n / 2; k++) {
      Match storage leaf = _matches[n / 2 - 1 + k];
      leaf.playerA = seeding[2 * k];
      leaf.playerB = seeding[2 * k + 1];
    }
    // Emit generation first so the indexer inserts the match rows before the
    // MatchActivated updates below arrive (same tx, ascending log index).
    emit BracketGenerated(n, seeding);

    // 3. Round-1 leaves are immediately votable (both players are known).
    for (uint256 i = n / 2 - 1; i <= n - 2; i++) {
      _matches[i].status = MatchStatus.Active;
      emit MatchActivated(i);
    }
  }

  function _seedLeaves() private view returns (address[] memory) {
    uint32 n = maxPlayers;
    uint32[] memory slots = new uint32[](1);
    slots[0] = 1;

    uint256 currentLen = 1;
    while (currentLen < n) {
      uint32 m = uint32(2 * currentLen + 1);
      uint32[] memory newSlots = new uint32[](currentLen * 2);
      for (uint256 i = 0; i < currentLen; i++) {
        newSlots[2 * i] = slots[i];
        newSlots[2 * i + 1] = m - slots[i];
      }
      slots = newSlots;
      currentLen *= 2;
    }

    address[] memory seeding = new address[](n);
    for (uint256 i = 0; i < n; i++) {
      // Seed `s` corresponds to _participants[s - 1]
      seeding[i] = _participants[slots[i] - 1];
    }
    return seeding;
  }

  /// @notice Cast an immutable vote for one player of an active match.
  /// @dev The full engine runs inline: on a strict majority the match resolves,
  ///      the winner advances into the parent (auto-activating it when both
  ///      slots fill), and the final match triggers tournament completion +
  ///      prize payout. `nonReentrant` guards the prize push in the final case.
  /// Example: tournament.castVote(3, playerA);
  /// @param matchIndex Heap index of the match (0 = final).
  /// @param player The player being voted for; must be playerA or playerB.
  function castVote(uint256 matchIndex, address player) external nonReentrant {
    if (matchIndex >= _matches.length) {
      revert InvalidMatchIndex(matchIndex, _matches.length);
    }
    Match storage m = _matches[matchIndex];
    if (m.status != MatchStatus.Active) {
      revert MatchNotActive(matchIndex, m.status);
    }
    if (!isJudge[msg.sender]) {
      revert NotJudge(msg.sender);
    }
    if (_votes[matchIndex][msg.sender] != address(0)) {
      revert AlreadyVoted(matchIndex, msg.sender);
    }
    if (player != m.playerA && player != m.playerB) {
      revert InvalidVoteTarget(matchIndex, player);
    }

    _votes[matchIndex][msg.sender] = player;
    uint8 tally = ++_votesFor[matchIndex][player];
    m.voteCount += 1;
    emit VoteCast(matchIndex, msg.sender, player);

    // Strict majority: more than half the panel. `* 2 > count` avoids the
    // rounding of integer division; the odd-count rule makes ties impossible.
    if (uint256(tally) * 2 > _judges.length) {
      _resolveMatch(matchIndex, player, tally);
    }
  }

  /// @dev Records the winner, advances the bracket, and completes the tournament
  ///      when the final resolves. Pure heap arithmetic — no loops, no pointers.
  function _resolveMatch(uint256 i, address w, uint8 votesForWinner) private {
    Match storage m = _matches[i];
    m.winner = w;
    m.status = MatchStatus.Completed;
    emit MatchResolved(i, w, votesForWinner, m.voteCount);

    if (i == 0) {
      _completeTournament(w);
      return;
    }

    uint256 parentIndex = (i - 1) / 2;
    Match storage parent = _matches[parentIndex];
    // Left child (odd index) feeds playerA; right child (even) feeds playerB.
    if (i % 2 == 1) {
      parent.playerA = w;
    } else {
      parent.playerB = w;
    }
    if (parent.playerA != address(0) && parent.playerB != address(0)) {
      parent.status = MatchStatus.Active;
      emit MatchActivated(parentIndex);
    }
  }

  /// @dev Marks completion and pushes the prize to the champion. Follows
  ///      checks-effects-interactions (status set before the external call) and
  ///      is only reachable from the `nonReentrant` {castVote}.
  function _completeTournament(address champion_) private {
    status = TournamentStatus.Completed;
    emit TournamentCompleted(champion_);

    uint256 amount = prize;
    if (amount > 0) {
      (bool ok, ) = champion_.call{value: amount}("");
      if (!ok) {
        revert PrizeTransferFailed(champion_, amount);
      }
    }
    emit PrizeClaimed(champion_, amount);
  }

  /// @notice Organizer withdraws accumulated entry fees after completion.
  /// @dev The prize was already pushed to the champion, so the remaining
  ///      balance is exactly the collected entry fees. One-shot (balance -> 0).
  function withdrawFees() external nonReentrant {
    if (msg.sender != organizer) {
      revert NotOrganizer(msg.sender);
    }
    if (status != TournamentStatus.Completed) {
      revert TournamentNotCompleted(status);
    }
    uint256 amount = address(this).balance;
    if (amount == 0) {
      revert NoFeesToWithdraw();
    }
    (bool ok, ) = organizer.call{value: amount}("");
    if (!ok) {
      revert FeeTransferFailed(organizer, amount);
    }
    emit FeesWithdrawn(organizer, amount);
  }

  /// @notice Who a judge voted for in a match (address(0) => not voted).
  function getVote(uint256 matchIndex, address judge)
    external
    view
    returns (address)
  {
    return _votes[matchIndex][judge];
  }

  /// @notice Vote tally for a player in a match.
  function getVotesFor(uint256 matchIndex, address player)
    external
    view
    returns (uint8)
  {
    return _votesFor[matchIndex][player];
  }

  /// @notice The tournament champion (final match winner); address(0) until the
  ///         final resolves or before the bracket exists.
  function champion() external view returns (address) {
    if (_matches.length == 0) {
      return address(0);
    }
    return _matches[0].winner;
  }

  function matchCount() external view returns (uint256) {
    return _matches.length;
  }

  function getMatches(uint256 offset, uint256 limit)
    external
    view
    returns (Match[] memory)
  {
    uint256 count = _matches.length;
    if (offset >= count) {
      return new Match[](0);
    }
    uint256 end = offset + limit;
    if (end > count) {
      end = count;
    }
    Match[] memory page = new Match[](end - offset);
    for (uint256 i = offset; i < end; i++) {
      page[i - offset] = _matches[i];
    }
    return page;
  }

  /// @notice Number of registered players (roster length).
  function participantCount() external view returns (uint256) {
    return _participants.length;
  }

  /// @notice Paginated slice of the roster, in registration order.
  /// @dev Clamps `limit` to the tail past `offset`; returns an empty array when
  ///      `offset >= count`. Mirrors {TournamentFactory.getTournaments}.
  function getParticipants(uint256 offset, uint256 limit)
    external
    view
    returns (address[] memory)
  {
    uint256 count = _participants.length;
    if (offset >= count) {
      return new address[](0);
    }
    uint256 end = offset + limit;
    if (end > count) {
      end = count;
    }
    address[] memory page = new address[](end - offset);
    for (uint256 i = offset; i < end; i++) {
      page[i - offset] = _participants[i];
    }
    return page;
  }

  /// @notice Full judge list (the auto-generated array getter returns one element).
  function getJudges() external view returns (address[] memory) {
    return _judges;
  }

  /// @notice All configuration in a single call, for cheap off-chain reads.
  function details()
    external
    view
    returns (
      address organizer_,
      TournamentFormat format_,
      uint32 maxPlayers_,
      uint256 entryFee_,
      uint64 startDate_,
      uint64 endDate_,
      address[] memory judges_
    )
  {
    return (
      organizer,
      format,
      maxPlayers,
      entryFee,
      startDate,
      endDate,
      _judges
    );
  }

  /// @dev Reverts with the offending value if any scalar parameter is invalid.
  function _validate(TournamentParams calldata params) private view {
    if (params.maxPlayers < 2) {
      revert InvalidMaxPlayers(params.maxPlayers);
    }
    // Single-elimination has no byes only when capacity is a power of two.
    if (params.maxPlayers & (params.maxPlayers - 1) != 0) {
      revert MaxPlayersNotPowerOfTwo(params.maxPlayers);
    }
    if (params.startDate <= block.timestamp) {
      revert StartDateInPast(params.startDate, uint64(block.timestamp));
    }
    if (params.endDate <= params.startDate) {
      revert InvalidDateRange(params.startDate, params.endDate);
    }
  }

  /// @dev Copies judges into storage, rejecting any zero address with its index.
  ///      Requires a non-empty, odd-sized panel so a strict majority is always
  ///      achievable without a tiebreaker (#007 business rule 2).
  function _storeJudges(address[] calldata judges) private {
    if (judges.length == 0) {
      revert EmptyJudgeArray();
    }
    if (judges.length % 2 == 0) {
      revert OddJudgeCountRequired(judges.length);
    }
    for (uint256 i = 0; i < judges.length; i++) {
      if (judges[i] == address(0)) {
        revert ZeroJudgeAddress(i);
      }
      _judges.push(judges[i]);
      isJudge[judges[i]] = true;
      // Indexed per-judge so ponder can build the "tournaments I judge" list
      // without scanning every tournament's getJudges() (#008).
      emit JudgeAssigned(address(this), judges[i]);
    }
  }
}
