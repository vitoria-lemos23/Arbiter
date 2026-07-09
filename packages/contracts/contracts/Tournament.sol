// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/// @dev Bracket format. Only single-elimination exists today; new variants must
///      be appended (never reordered) so stored enum indices stay stable.
enum TournamentFormat {
  SingleElimination // index 0; only supported format for now
}

/// @dev Creation parameters shared between the factory entry point and the
///      clone's initializer. `entryFee` is stored but NOT collected in this spec.
struct TournamentParams {
  TournamentFormat format;
  uint32 maxPlayers; // bracket capacity; must be >= 2 and a power of two
  uint256 entryFee; // wei; 0 allowed (free tournament)
  uint64 startDate; // unix seconds; must be in the future
  uint64 endDate; // unix seconds; must be > startDate
  address[] judges; // stored for later judging logic; may be empty
}

/// @dev One node of the single-elimination binary tree. `winner` is reserved
///      for spec #007 (result reporting) and is always address(0) here.
struct Match {
  address playerA; // address(0) => TBD (internal node, filled by #007)
  address playerB;
  address winner;  // address(0) => unresolved
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

/// @title Tournament
/// @notice Per-tournament configuration holder, deployed as an EIP-1167 clone of
///         a single locked implementation. Each clone owns its own storage and
///         ETH balance; this spec covers configuration/retrieval only.
contract Tournament is Initializable {
  address public organizer;
  TournamentFormat public format;
  uint32 public maxPlayers;
  uint256 public entryFee;
  /// @notice Prize pot deposited by the organizer at creation, held by this
  ///         clone as ETH (`msg.value`). Distribution/claiming is out of scope.
  uint256 public prize;
  uint64 public startDate;
  uint64 public endDate;
  address[] private _judges;
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

    uint32 n = maxPlayers;
    // 1. Pre-size the tree: n-1 matches, all TBD.
    for (uint256 i = 0; i < n - 1; i++) {
      _matches.push(Match(address(0), address(0), address(0)));
    }
    // 2. Compute standard bracket-slot order (seeds) and fill the leaves
    //    [n/2 - 1 .. n - 2] with the seeded player pairs.
    address[] memory seeding = _seedLeaves(); // length n, players in slot order
    for (uint256 k = 0; k < n / 2; k++) {
      Match storage leaf = _matches[n / 2 - 1 + k];
      leaf.playerA = seeding[2 * k];
      leaf.playerB = seeding[2 * k + 1];
    }
    emit BracketGenerated(n, seeding);
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
  function _storeJudges(address[] calldata judges) private {
    for (uint256 i = 0; i < judges.length; i++) {
      if (judges[i] == address(0)) {
        revert ZeroJudgeAddress(i);
      }
      _judges.push(judges[i]);
    }
  }
}
