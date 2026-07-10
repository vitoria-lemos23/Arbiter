// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {
  Tournament,
  TournamentParams,
  TournamentFormat,
  MatchStatus,
  TournamentStatus,
  InvalidMaxPlayers,
  MaxPlayersNotPowerOfTwo,
  StartDateInPast,
  InvalidDateRange,
  ZeroJudgeAddress,
  RegistrationClosed,
  AlreadyRegistered,
  TournamentFull,
  IncorrectEntryFee,
  EmptyJudgeArray,
  OddJudgeCountRequired,
  NotJudge,
  MatchNotActive,
  AlreadyVoted,
  InvalidVoteTarget,
  InvalidMatchIndex,
  TournamentNotCompleted,
  NotOrganizer,
  NoFeesToWithdraw,
  Match
} from "./Tournament.sol";

contract TournamentTest is Test {
  // Mirror of Tournament's event for vm.expectEmit matching.
  event TournamentInitialized(
    address indexed organizer,
    TournamentFormat format,
    uint32 maxPlayers,
    uint256 entryFee,
    uint256 prize,
    uint64 startDate,
    uint64 endDate
  );

  // Mirror of Tournament's per-judge event (#008).
  event JudgeAssigned(address indexed tournament, address indexed judge);

  uint64 constant NOW_TS = 1000;
  uint64 constant START = 2000;
  uint64 constant END = 3000;

  Tournament impl;
  address organizer = makeAddr("organizer");

  function setUp() public {
    impl = new Tournament();
    vm.warp(NOW_TS);
  }

  function _clone() internal returns (Tournament) {
    return Tournament(Clones.clone(address(impl)));
  }

  /// @dev Default params carry a single judge (odd panel size is enforced at
  ///      init, #007); tests that exercise the panel override `judges`.
  function _params() internal pure returns (TournamentParams memory) {
    address[] memory judges = new address[](1);
    judges[0] = address(0xBEEF);
    return TournamentParams({
      format: TournamentFormat.SingleElimination,
      maxPlayers: 8,
      entryFee: 1 ether,
      startDate: START,
      endDate: END,
      judges: judges
    });
  }

  function test_InitializeStoresConfig() public {
    Tournament t = _clone();
    address[] memory judges = new address[](3);
    judges[0] = makeAddr("judge1");
    judges[1] = makeAddr("judge2");
    judges[2] = makeAddr("judge3");
    TournamentParams memory p = _params();
    p.judges = judges;

    t.initialize(organizer, p);

    assertEq(t.organizer(), organizer);
    assertEq(uint256(t.format()), uint256(TournamentFormat.SingleElimination));
    assertEq(t.maxPlayers(), 8);
    assertEq(t.entryFee(), 1 ether);
    assertEq(t.startDate(), START);
    assertEq(t.endDate(), END);

    address[] memory got = t.getJudges();
    assertEq(got.length, 3);
    assertEq(got[0], judges[0]);
    assertEq(got[1], judges[1]);
    assertEq(got[2], judges[2]);
    assertTrue(t.isJudge(judges[0]));
    assertTrue(t.isJudge(judges[2]));
  }

  function test_DetailsReturnsEverything() public {
    Tournament t = _clone();
    t.initialize(organizer, _params());

    (
      address organizer_,
      TournamentFormat format_,
      uint32 maxPlayers_,
      uint256 entryFee_,
      uint64 startDate_,
      uint64 endDate_,
      address[] memory judges_
    ) = t.details();

    assertEq(organizer_, organizer);
    assertEq(uint256(format_), uint256(TournamentFormat.SingleElimination));
    assertEq(maxPlayers_, 8);
    assertEq(entryFee_, 1 ether);
    assertEq(startDate_, START);
    assertEq(endDate_, END);
    assertEq(judges_.length, 1);
  }

  function test_InitializeEmitsEvent() public {
    Tournament t = _clone();
    vm.expectEmit(true, false, false, true, address(t));
    emit TournamentInitialized(
      organizer, TournamentFormat.SingleElimination, 8, 1 ether, 0, START, END
    );
    t.initialize(organizer, _params());
  }

  /// @dev #008 relies on one indexed JudgeAssigned per judge to build the
  ///      per-judge tournament list; assert the ordered, per-judge emission.
  function test_InitializeEmitsJudgeAssignedPerJudge() public {
    Tournament t = _clone();
    address[] memory judges = new address[](3);
    judges[0] = makeAddr("judge1");
    judges[1] = makeAddr("judge2");
    judges[2] = makeAddr("judge3");
    TournamentParams memory p = _params();
    p.judges = judges;

    for (uint256 i = 0; i < judges.length; i++) {
      // Both topics indexed (tournament, judge); no data to check.
      vm.expectEmit(true, true, false, false, address(t));
      emit JudgeAssigned(address(t), judges[i]);
    }
    t.initialize(organizer, p);
  }

  /// @dev Exactly one JudgeAssigned per judge — no duplicates, no extras.
  function test_InitializeEmitsExactlyOneJudgeAssignedPerJudge() public {
    Tournament t = _clone();
    address[] memory judges = new address[](5);
    for (uint256 i = 0; i < judges.length; i++) {
      judges[i] = address(uint160(0x2000 + i));
    }
    TournamentParams memory p = _params();
    p.judges = judges;

    vm.recordLogs();
    t.initialize(organizer, p);
    Vm.Log[] memory logs = vm.getRecordedLogs();

    bytes32 sig = keccak256("JudgeAssigned(address,address)");
    uint256 assigned = 0;
    for (uint256 i = 0; i < logs.length; i++) {
      if (logs[i].topics[0] == sig) assigned++;
    }
    assertEq(assigned, judges.length);
  }

  /// @dev The empty-panel path reverts before storing/emitting; no judge is
  ///      indexed for a tournament that never initialises.
  function test_InitializeEmitsNoJudgeAssignedWhenJudgesEmpty() public {
    Tournament t = _clone();
    TournamentParams memory p = _params();
    p.judges = new address[](0);

    vm.recordLogs();
    vm.expectRevert(abi.encodeWithSelector(EmptyJudgeArray.selector));
    t.initialize(organizer, p);

    // Logs from a reverted call are discarded by the EVM.
    assertEq(vm.getRecordedLogs().length, 0);
  }

  function test_InitializeStoresPrizeFromValue() public {
    Tournament t = _clone();
    vm.deal(address(this), 5 ether);
    vm.expectEmit(true, false, false, true, address(t));
    emit TournamentInitialized(
      organizer, TournamentFormat.SingleElimination, 8, 1 ether, 3 ether, START, END
    );
    t.initialize{value: 3 ether}(organizer, _params());

    assertEq(t.prize(), 3 ether);
    assertEq(address(t).balance, 3 ether);
  }

  function test_ZeroPrizeSucceeds() public {
    Tournament t = _clone();
    t.initialize(organizer, _params());
    assertEq(t.prize(), 0);
    assertEq(address(t).balance, 0);
  }

  function test_ZeroEntryFeeSucceeds() public {
    Tournament t = _clone();
    TournamentParams memory p = _params();
    p.entryFee = 0;
    t.initialize(organizer, p);
    assertEq(t.entryFee(), 0);
    assertEq(t.getJudges().length, 1);
  }

  function test_RevertWhenEmptyJudgeArray() public {
    Tournament t = _clone();
    TournamentParams memory p = _params();
    p.judges = new address[](0);
    vm.expectRevert(abi.encodeWithSelector(EmptyJudgeArray.selector));
    t.initialize(organizer, p);
  }

  function test_RevertWhenEvenJudgeCount() public {
    Tournament t = _clone();
    address[] memory judges = new address[](2);
    judges[0] = makeAddr("judge1");
    judges[1] = makeAddr("judge2");
    TournamentParams memory p = _params();
    p.judges = judges;
    vm.expectRevert(
      abi.encodeWithSelector(OddJudgeCountRequired.selector, uint256(2))
    );
    t.initialize(organizer, p);
  }

  function test_OddJudgeCountsSucceed() public {
    uint256[3] memory counts = [uint256(1), 3, 5];
    for (uint256 c = 0; c < counts.length; c++) {
      Tournament t = _clone();
      address[] memory judges = new address[](counts[c]);
      for (uint256 i = 0; i < counts[c]; i++) {
        judges[i] = address(uint160(0x1000 + i + c * 10));
      }
      TournamentParams memory p = _params();
      p.judges = judges;
      t.initialize(organizer, p);
      assertEq(t.getJudges().length, counts[c]);
    }
  }

  function test_PowersOfTwoSucceed() public {
    uint32[3] memory sizes = [uint32(2), 4, 8];
    for (uint256 i = 0; i < sizes.length; i++) {
      Tournament t = _clone();
      TournamentParams memory p = _params();
      p.maxPlayers = sizes[i];
      t.initialize(organizer, p);
      assertEq(t.maxPlayers(), sizes[i]);
    }
  }

  function test_RevertWhenMaxPlayersZero() public {
    Tournament t = _clone();
    TournamentParams memory p = _params();
    p.maxPlayers = 0;
    vm.expectRevert(abi.encodeWithSelector(InvalidMaxPlayers.selector, uint32(0)));
    t.initialize(organizer, p);
  }

  function test_RevertWhenMaxPlayersOne() public {
    Tournament t = _clone();
    TournamentParams memory p = _params();
    p.maxPlayers = 1;
    vm.expectRevert(abi.encodeWithSelector(InvalidMaxPlayers.selector, uint32(1)));
    t.initialize(organizer, p);
  }

  function test_RevertWhenMaxPlayersNotPowerOfTwo() public {
    uint32[3] memory sizes = [uint32(3), 6, 10];
    for (uint256 i = 0; i < sizes.length; i++) {
      Tournament t = _clone();
      TournamentParams memory p = _params();
      p.maxPlayers = sizes[i];
      vm.expectRevert(
        abi.encodeWithSelector(MaxPlayersNotPowerOfTwo.selector, sizes[i])
      );
      t.initialize(organizer, p);
    }
  }

  function test_RevertWhenStartDateInPast() public {
    Tournament t = _clone();
    TournamentParams memory p = _params();
    p.startDate = NOW_TS; // not strictly in the future
    p.endDate = NOW_TS + 1;
    vm.expectRevert(
      abi.encodeWithSelector(StartDateInPast.selector, NOW_TS, NOW_TS)
    );
    t.initialize(organizer, p);
  }

  function test_RevertWhenEndBeforeStart() public {
    Tournament t = _clone();
    TournamentParams memory p = _params();
    p.endDate = p.startDate;
    vm.expectRevert(
      abi.encodeWithSelector(InvalidDateRange.selector, START, START)
    );
    t.initialize(organizer, p);
  }

  function test_RevertWhenZeroJudgeAddress() public {
    Tournament t = _clone();
    address[] memory judges = new address[](3);
    judges[0] = makeAddr("judge1");
    judges[1] = address(0);
    judges[2] = makeAddr("judge3");
    TournamentParams memory p = _params();
    p.judges = judges;
    vm.expectRevert(abi.encodeWithSelector(ZeroJudgeAddress.selector, uint256(1)));
    t.initialize(organizer, p);
  }

  function test_RevertWhenInitializedTwice() public {
    Tournament t = _clone();
    t.initialize(organizer, _params());
    vm.expectRevert(); // OZ InvalidInitialization()
    t.initialize(organizer, _params());
  }

  function test_RevertWhenInitializingImplementationDirectly() public {
    vm.expectRevert(); // _disableInitializers() locks the implementation
    impl.initialize(organizer, _params());
  }
}

contract TournamentRegisterTest is Test {
  // Mirror of Tournament's event for vm.expectEmit matching.
  event PlayerRegistered(
    address indexed player, uint32 indexed position, uint256 entryFeePaid
  );

  uint64 constant NOW_TS = 1000;
  uint64 constant START = 2000;
  uint64 constant END = 3000;
  uint256 constant FEE = 1 ether;

  Tournament impl;
  address organizer = makeAddr("organizer");

  function setUp() public {
    impl = new Tournament();
    vm.warp(NOW_TS);
  }

  /// @dev A clone initialized with `entryFee` and `maxPlayers` (defaults elsewhere).
  function _tournament(uint256 entryFee, uint32 maxPlayers)
    internal
    returns (Tournament)
  {
    Tournament t = Tournament(Clones.clone(address(impl)));
    address[] memory judges = new address[](1);
    judges[0] = address(0xBEEF);
    t.initialize(
      organizer,
      TournamentParams({
        format: TournamentFormat.SingleElimination,
        maxPlayers: maxPlayers,
        entryFee: entryFee,
        startDate: START,
        endDate: END,
        judges: judges
      })
    );
    return t;
  }

  function _player(string memory name) internal returns (address) {
    address player = makeAddr(name);
    vm.deal(player, 10 ether);
    return player;
  }

  function test_RegisterMarksAndAppendsAndEmits() public {
    Tournament t = _tournament(FEE, 8);
    address alice = _player("alice");

    vm.expectEmit(true, true, false, true, address(t));
    emit PlayerRegistered(alice, 0, FEE);
    vm.prank(alice);
    t.register{value: FEE}();

    assertTrue(t.isRegistered(alice));
    assertEq(t.participantCount(), 1);
    assertEq(t.getParticipants(0, 10)[0], alice);
  }

  function test_RegisterRecordsPositionsInOrder() public {
    Tournament t = _tournament(FEE, 8);
    address alice = _player("alice");
    address bob = _player("bob");

    vm.prank(alice);
    t.register{value: FEE}();

    vm.expectEmit(true, true, false, true, address(t));
    emit PlayerRegistered(bob, 1, FEE);
    vm.prank(bob);
    t.register{value: FEE}();

    address[] memory roster = t.getParticipants(0, 10);
    assertEq(roster.length, 2);
    assertEq(roster[0], alice);
    assertEq(roster[1], bob);
  }

  function test_RegisterCollectsFeeIntoContract() public {
    Tournament t = _tournament(FEE, 8);
    address alice = _player("alice");

    vm.prank(alice);
    t.register{value: FEE}();

    assertEq(address(t).balance, FEE);
    assertEq(alice.balance, 9 ether);
  }

  function test_FreeTournamentRegistersWithZeroValue() public {
    Tournament t = _tournament(0, 8);
    address alice = _player("alice");

    vm.prank(alice);
    t.register();

    assertTrue(t.isRegistered(alice));
    assertEq(address(t).balance, 0);
  }

  function test_RevertWhenFeeTooLow() public {
    Tournament t = _tournament(FEE, 8);
    address alice = _player("alice");

    vm.expectRevert(
      abi.encodeWithSelector(IncorrectEntryFee.selector, FEE - 1, FEE)
    );
    vm.prank(alice);
    t.register{value: FEE - 1}();
  }

  function test_RevertWhenFeeTooHigh() public {
    Tournament t = _tournament(FEE, 8);
    address alice = _player("alice");

    vm.expectRevert(
      abi.encodeWithSelector(IncorrectEntryFee.selector, FEE + 1, FEE)
    );
    vm.prank(alice);
    t.register{value: FEE + 1}();
  }

  function test_RevertWhenPayingForFreeTournament() public {
    Tournament t = _tournament(0, 8);
    address alice = _player("alice");

    vm.expectRevert(
      abi.encodeWithSelector(IncorrectEntryFee.selector, uint256(1), uint256(0))
    );
    vm.prank(alice);
    t.register{value: 1}();
  }

  function test_RevertWhenRegistrationClosed() public {
    Tournament t = _tournament(FEE, 8);
    address alice = _player("alice");

    vm.warp(START); // boundary: exactly startDate is already closed
    vm.expectRevert(
      abi.encodeWithSelector(RegistrationClosed.selector, START, START)
    );
    vm.prank(alice);
    t.register{value: FEE}();
  }

  function test_RevertWhenFull() public {
    Tournament t = _tournament(FEE, 2);
    vm.prank(_player("p1"));
    t.register{value: FEE}();
    vm.prank(_player("p2"));
    t.register{value: FEE}();

    address late = _player("late");
    vm.expectRevert(
      abi.encodeWithSelector(TournamentFull.selector, uint32(2))
    );
    vm.prank(late);
    t.register{value: FEE}();
  }

  function test_RevertWhenAlreadyRegistered() public {
    Tournament t = _tournament(FEE, 8);
    address alice = _player("alice");

    vm.prank(alice);
    t.register{value: FEE}();

    vm.expectRevert(
      abi.encodeWithSelector(AlreadyRegistered.selector, alice)
    );
    vm.prank(alice);
    t.register{value: FEE}();
  }

  function test_GetParticipantsPaginatesAndClamps() public {
    Tournament t = _tournament(FEE, 4);
    address[3] memory players =
      [_player("p1"), _player("p2"), _player("p3")];
    for (uint256 i = 0; i < players.length; i++) {
      vm.prank(players[i]);
      t.register{value: FEE}();
    }

    address[] memory firstTwo = t.getParticipants(0, 2);
    assertEq(firstTwo.length, 2);
    assertEq(firstTwo[0], players[0]);
    assertEq(firstTwo[1], players[1]);

    // limit clamps to the available tail
    address[] memory tail = t.getParticipants(2, 10);
    assertEq(tail.length, 1);
    assertEq(tail[0], players[2]);

    // offset past the end yields an empty array
    assertEq(t.getParticipants(3, 5).length, 0);
  }

  function test_ParticipantCountTracksRegistrations() public {
    Tournament t = _tournament(FEE, 8);
    assertEq(t.participantCount(), 0);
    vm.prank(_player("p1"));
    t.register{value: FEE}();
    assertEq(t.participantCount(), 1);
    vm.prank(_player("p2"));
    t.register{value: FEE}();
    assertEq(t.participantCount(), 2);
  }

  // Bracket Generation Tests
  event BracketGenerated(uint32 playerCount, address[] seeding);

  function test_BracketAutoGeneratesOnFill() public {
    uint32 n = 4;
    Tournament t = _tournament(FEE, n);
    
    assertFalse(t.bracketGenerated());
    assertEq(t.matchCount(), 0);

    for (uint32 i = 1; i < n; i++) {
      vm.prank(_player(string(abi.encodePacked("p", i))));
      t.register{value: FEE}();
      assertFalse(t.bracketGenerated());
      assertEq(t.matchCount(), 0);
    }

    // Register final player
    address lastPlayer = _player("p4");
    
    // Expect the BracketGenerated event
    // The seeded order for 4 players is [p1, p4, p2, p3] because standard seeding for 4 is [1, 4, 2, 3]
    address[] memory expectedSeeding = new address[](4);
    expectedSeeding[0] = t.getParticipants(0, 4)[0]; // p1
    expectedSeeding[1] = lastPlayer; // p4
    expectedSeeding[2] = t.getParticipants(0, 4)[1]; // p2
    expectedSeeding[3] = t.getParticipants(0, 4)[2]; // p3
    
    vm.expectEmit(false, false, false, true, address(t));
    emit BracketGenerated(n, expectedSeeding);

    vm.prank(lastPlayer);
    t.register{value: FEE}();

    assertTrue(t.bracketGenerated());
    assertEq(t.bracketGeneratedAt(), block.timestamp);
    assertEq(t.matchCount(), n - 1);
  }

  function test_BracketShapeAndSeeding() public {
    uint32 n = 8;
    Tournament t = _tournament(FEE, n);
    address[] memory players = new address[](n);
    for (uint32 i = 0; i < n; i++) {
      players[i] = _player(string(abi.encodePacked("p", i)));
      vm.prank(players[i]);
      t.register{value: FEE}();
    }

    assertTrue(t.bracketGenerated());
    assertEq(t.matchCount(), n - 1);

    // Get all matches
    Match[] memory matches = t.getMatches(0, n - 1);
    assertEq(matches.length, 7);

    // First 3 matches (internal nodes) should be TBD
    for (uint256 i = 0; i < 3; i++) {
      assertEq(matches[i].playerA, address(0));
      assertEq(matches[i].playerB, address(0));
      assertEq(matches[i].winner, address(0));
    }

    // Seeding for N=8 is [1, 8, 4, 5, 2, 7, 3, 6]
    // Leaves are indices [3..6]
    assertEq(matches[3].playerA, players[0]); // seed 1
    assertEq(matches[3].playerB, players[7]); // seed 8
    
    assertEq(matches[4].playerA, players[3]); // seed 4
    assertEq(matches[4].playerB, players[4]); // seed 5
    
    assertEq(matches[5].playerA, players[1]); // seed 2
    assertEq(matches[5].playerB, players[6]); // seed 7
    
    assertEq(matches[6].playerA, players[2]); // seed 3
    assertEq(matches[6].playerB, players[5]); // seed 6
  }

  function test_GetMatchesPaginatesAndClamps() public {
    uint32 n = 4;
    Tournament t = _tournament(FEE, n);
    for (uint32 i = 0; i < n; i++) {
      vm.prank(_player(string(abi.encodePacked("p", i))));
      t.register{value: FEE}();
    }

    Match[] memory allMatches = t.getMatches(0, 10);
    assertEq(allMatches.length, 3);

    Match[] memory paged = t.getMatches(1, 1);
    assertEq(paged.length, 1);
    assertEq(paged[0].playerA, allMatches[1].playerA);
    assertEq(paged[0].playerB, allMatches[1].playerB);

    Match[] memory pastEnd = t.getMatches(3, 2);
    assertEq(pastEnd.length, 0);
  }

  function test_NoOverRunAfterBracketGen() public {
    uint32 n = 2;
    Tournament t = _tournament(FEE, n);
    vm.prank(_player("p1"));
    t.register{value: FEE}();
    vm.prank(_player("p2"));
    t.register{value: FEE}();

    assertTrue(t.bracketGenerated());

    vm.expectRevert(
      abi.encodeWithSelector(TournamentFull.selector, n)
    );
    vm.prank(_player("p3"));
    t.register{value: FEE}();
  }
}

/// @dev Exercises the #007 voting engine: casting, auto-resolution by majority,
///      bracket advancement, tournament completion + prize push, and fee
///      withdrawal. Seeding for N=4 pairs leaf match 1 = [p0, p3] and leaf
///      match 2 = [p1, p2]; the final is index 0.
contract TournamentVoteTest is Test {
  event VoteCast(
    uint256 indexed matchIndex, address indexed judge, address indexed votedFor
  );
  event MatchResolved(
    uint256 indexed matchIndex,
    address indexed winner,
    uint8 votesForWinner,
    uint8 totalVotes
  );
  event MatchActivated(uint256 indexed matchIndex);
  event TournamentCompleted(address indexed champion);
  event PrizeClaimed(address indexed champion, uint256 amount);
  event FeesWithdrawn(address indexed organizer, uint256 amount);

  uint64 constant NOW_TS = 1000;
  uint64 constant START = 2000;
  uint64 constant END = 3000;
  uint256 constant FEE = 1 ether;
  uint256 constant PRIZE = 5 ether;

  Tournament impl;
  address organizer = makeAddr("organizer");
  address[] judges;

  function setUp() public {
    impl = new Tournament();
    vm.warp(NOW_TS);
    judges.push(makeAddr("judge1"));
    judges.push(makeAddr("judge2"));
    judges.push(makeAddr("judge3"));
  }

  function _create(uint32 maxPlayers, address[] memory js)
    internal
    returns (Tournament)
  {
    Tournament t = Tournament(Clones.clone(address(impl)));
    vm.deal(address(this), PRIZE);
    t.initialize{value: PRIZE}(
      organizer,
      TournamentParams({
        format: TournamentFormat.SingleElimination,
        maxPlayers: maxPlayers,
        entryFee: FEE,
        startDate: START,
        endDate: END,
        judges: js
      })
    );
    return t;
  }

  function _player(string memory name) internal returns (address) {
    address p = makeAddr(name);
    vm.deal(p, 10 ether);
    return p;
  }

  /// @dev Registers p0..p{n-1}; returns the roster in registration order.
  function _fill(Tournament t, uint32 n) internal returns (address[] memory) {
    address[] memory players = new address[](n);
    for (uint32 i = 0; i < n; i++) {
      players[i] = _player(string(abi.encodePacked("player", i)));
      vm.prank(players[i]);
      t.register{value: FEE}();
    }
    return players;
  }

  /// @dev Casts `count` judge votes (judges[0..count-1]) for `player` on match.
  function _vote(Tournament t, uint256 mi, address player, uint256 count)
    internal
  {
    for (uint256 j = 0; j < count; j++) {
      vm.prank(judges[j]);
      t.castVote(mi, player);
    }
  }

  function _status(Tournament t, uint256 mi)
    internal
    view
    returns (MatchStatus)
  {
    return t.getMatches(mi, 1)[0].status;
  }

  function test_RoundOneMatchesActiveAndTournamentActive() public {
    Tournament t = _create(4, judges);
    _fill(t, 4);

    assertEq(uint256(t.status()), uint256(TournamentStatus.Active));
    assertEq(uint256(_status(t, 0)), uint256(MatchStatus.Pending));
    assertEq(uint256(_status(t, 1)), uint256(MatchStatus.Active));
    assertEq(uint256(_status(t, 2)), uint256(MatchStatus.Active));
  }

  function test_RevertWhenNotJudge() public {
    Tournament t = _create(4, judges);
    address[] memory players = _fill(t, 4);
    address intruder = _player("intruder");

    vm.expectRevert(abi.encodeWithSelector(NotJudge.selector, intruder));
    vm.prank(intruder);
    t.castVote(1, players[0]);
  }

  function test_RevertWhenMatchNotActive() public {
    Tournament t = _create(4, judges);
    address[] memory players = _fill(t, 4);

    // Match 0 (the final) is still Pending — no players placed yet.
    vm.expectRevert(
      abi.encodeWithSelector(
        MatchNotActive.selector, uint256(0), MatchStatus.Pending
      )
    );
    vm.prank(judges[0]);
    t.castVote(0, players[0]);
  }

  function test_RevertWhenAlreadyVoted() public {
    Tournament t = _create(4, judges);
    address[] memory players = _fill(t, 4);

    vm.prank(judges[0]);
    t.castVote(1, players[0]);

    vm.expectRevert(
      abi.encodeWithSelector(AlreadyVoted.selector, uint256(1), judges[0])
    );
    vm.prank(judges[0]);
    t.castVote(1, players[0]);
  }

  function test_RevertWhenInvalidVoteTarget() public {
    Tournament t = _create(4, judges);
    address[] memory players = _fill(t, 4);

    // players[1] belongs to match 2, not match 1.
    vm.expectRevert(
      abi.encodeWithSelector(InvalidVoteTarget.selector, uint256(1), players[1])
    );
    vm.prank(judges[0]);
    t.castVote(1, players[1]);
  }

  function test_RevertWhenInvalidMatchIndex() public {
    Tournament t = _create(4, judges);
    address[] memory players = _fill(t, 4);

    vm.expectRevert(
      abi.encodeWithSelector(
        InvalidMatchIndex.selector, uint256(3), uint256(3)
      )
    );
    vm.prank(judges[0]);
    t.castVote(3, players[0]);
  }

  function test_VoteStoresAndEmits() public {
    Tournament t = _create(4, judges);
    address[] memory players = _fill(t, 4);

    vm.expectEmit(true, true, true, false, address(t));
    emit VoteCast(1, judges[0], players[0]);
    vm.prank(judges[0]);
    t.castVote(1, players[0]);

    assertEq(t.getVote(1, judges[0]), players[0]);
    assertEq(t.getVotesFor(1, players[0]), 1);
    assertEq(t.getMatches(1, 1)[0].voteCount, 1);
    // One vote of three is not yet a majority.
    assertEq(uint256(_status(t, 1)), uint256(MatchStatus.Active));
  }

  function test_AutoResolveWithMajorityOfThree() public {
    Tournament t = _create(4, judges);
    address[] memory players = _fill(t, 4);

    vm.prank(judges[0]);
    t.castVote(1, players[0]);

    vm.expectEmit(true, true, false, true, address(t));
    emit MatchResolved(1, players[0], 2, 2);
    vm.prank(judges[1]);
    t.castVote(1, players[0]);

    assertEq(uint256(_status(t, 1)), uint256(MatchStatus.Completed));
    assertEq(t.getMatches(1, 1)[0].winner, players[0]);
  }

  function test_AdvancesWinnerToParentSlots() public {
    Tournament t = _create(4, judges);
    address[] memory players = _fill(t, 4);

    // Match 1 (odd, left child) -> parent 0 playerA.
    _vote(t, 1, players[0], 2);
    assertEq(t.getMatches(0, 1)[0].playerA, players[0]);
    assertEq(uint256(_status(t, 0)), uint256(MatchStatus.Pending));

    // Match 2 (even, right child) -> parent 0 playerB; both slots filled now.
    vm.prank(judges[0]);
    t.castVote(2, players[1]);
    vm.expectEmit(true, false, false, false, address(t));
    emit MatchActivated(0);
    vm.prank(judges[1]);
    t.castVote(2, players[1]);

    assertEq(t.getMatches(0, 1)[0].playerB, players[1]);
    assertEq(uint256(_status(t, 0)), uint256(MatchStatus.Active));
  }

  function test_SingleJudgeResolvesImmediately() public {
    address[] memory solo = new address[](1);
    solo[0] = judges[0];
    Tournament t = _create(2, solo);
    address[] memory players = _fill(t, 2);

    // N=2: the only match (index 0) is both a leaf and the final.
    vm.prank(judges[0]);
    t.castVote(0, players[0]);
    assertEq(uint256(t.status()), uint256(TournamentStatus.Completed));
    assertEq(t.champion(), players[0]);
  }

  function test_FiveJudgesNeedThree() public {
    address[] memory five = new address[](5);
    for (uint256 i = 0; i < 5; i++) {
      five[i] = makeAddr(string(abi.encodePacked("j5-", i)));
    }
    Tournament t = _create(2, five);
    address[] memory players = _fill(t, 2);

    for (uint256 i = 0; i < 2; i++) {
      vm.prank(five[i]);
      t.castVote(0, players[0]);
    }
    assertEq(uint256(_status(t, 0)), uint256(MatchStatus.Active)); // 2/5

    vm.prank(five[2]);
    t.castVote(0, players[0]); // 3/5 -> majority
    assertEq(uint256(_status(t, 0)), uint256(MatchStatus.Completed));
  }

  function test_FullFourPlayerFlowPaysChampionAndFees() public {
    Tournament t = _create(4, judges);
    address[] memory players = _fill(t, 4);
    assertEq(address(t).balance, PRIZE + 4 * FEE);

    _vote(t, 1, players[0], 2); // p0 beats p3
    _vote(t, 2, players[1], 2); // p1 beats p2

    // Final: p0 vs p1. The resolving vote completes the tournament + pays out.
    vm.prank(judges[0]);
    t.castVote(0, players[0]);
    vm.expectEmit(true, false, false, false, address(t));
    emit TournamentCompleted(players[0]);
    vm.expectEmit(true, false, false, true, address(t));
    emit PrizeClaimed(players[0], PRIZE);
    vm.prank(judges[1]);
    t.castVote(0, players[0]);

    assertEq(uint256(t.status()), uint256(TournamentStatus.Completed));
    assertEq(t.champion(), players[0]);
    // p0: 10 - 1 (fee) + 5 (prize) = 14 ether.
    assertEq(players[0].balance, 14 ether);
    // Only the entry fees remain in the contract.
    assertEq(address(t).balance, 4 * FEE);

    // Organizer withdraws the accumulated fees.
    uint256 before = organizer.balance;
    vm.expectEmit(true, false, false, true, address(t));
    emit FeesWithdrawn(organizer, 4 * FEE);
    vm.prank(organizer);
    t.withdrawFees();
    assertEq(organizer.balance, before + 4 * FEE);
    assertEq(address(t).balance, 0);
  }

  function test_RevertWhenWithdrawByNonOrganizer() public {
    Tournament t = _create(2, _soloPanel());
    address[] memory players = _fill(t, 2);
    vm.prank(judges[0]);
    t.castVote(0, players[0]); // completes

    vm.expectRevert(
      abi.encodeWithSelector(NotOrganizer.selector, players[0])
    );
    vm.prank(players[0]);
    t.withdrawFees();
  }

  function test_RevertWhenWithdrawBeforeCompletion() public {
    Tournament t = _create(4, judges);
    _fill(t, 4);

    vm.expectRevert(
      abi.encodeWithSelector(
        TournamentNotCompleted.selector, TournamentStatus.Active
      )
    );
    vm.prank(organizer);
    t.withdrawFees();
  }

  function test_RevertWhenWithdrawTwice() public {
    Tournament t = _create(2, _soloPanel());
    address[] memory players = _fill(t, 2);
    vm.prank(judges[0]);
    t.castVote(0, players[0]); // completes, prize paid

    vm.prank(organizer);
    t.withdrawFees(); // drains fees

    vm.expectRevert(abi.encodeWithSelector(NoFeesToWithdraw.selector));
    vm.prank(organizer);
    t.withdrawFees();
  }

  function _soloPanel() internal view returns (address[] memory) {
    address[] memory solo = new address[](1);
    solo[0] = judges[0];
    return solo;
  }
}
