// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {
  Tournament,
  TournamentParams,
  TournamentFormat,
  InvalidMaxPlayers,
  MaxPlayersNotPowerOfTwo,
  StartDateInPast,
  InvalidDateRange,
  ZeroJudgeAddress,
  RegistrationClosed,
  AlreadyRegistered,
  TournamentFull,
  IncorrectEntryFee,
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

  function _params() internal pure returns (TournamentParams memory) {
    return TournamentParams({
      format: TournamentFormat.SingleElimination,
      maxPlayers: 8,
      entryFee: 1 ether,
      startDate: START,
      endDate: END,
      judges: new address[](0)
    });
  }

  function test_InitializeStoresConfig() public {
    Tournament t = _clone();
    address[] memory judges = new address[](2);
    judges[0] = makeAddr("judge1");
    judges[1] = makeAddr("judge2");
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
    assertEq(got.length, 2);
    assertEq(got[0], judges[0]);
    assertEq(got[1], judges[1]);
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
    assertEq(judges_.length, 0);
  }

  function test_InitializeEmitsEvent() public {
    Tournament t = _clone();
    vm.expectEmit(true, false, false, true, address(t));
    emit TournamentInitialized(
      organizer, TournamentFormat.SingleElimination, 8, 1 ether, 0, START, END
    );
    t.initialize(organizer, _params());
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

  function test_ZeroEntryFeeAndEmptyJudgesSucceed() public {
    Tournament t = _clone();
    TournamentParams memory p = _params();
    p.entryFee = 0;
    t.initialize(organizer, p);
    assertEq(t.entryFee(), 0);
    assertEq(t.getJudges().length, 0);
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
    address[] memory judges = new address[](2);
    judges[0] = makeAddr("judge1");
    judges[1] = address(0);
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
    t.initialize(
      organizer,
      TournamentParams({
        format: TournamentFormat.SingleElimination,
        maxPlayers: maxPlayers,
        entryFee: entryFee,
        startDate: START,
        endDate: END,
        judges: new address[](0)
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
