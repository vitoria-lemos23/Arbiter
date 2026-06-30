// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {Tournament, TournamentParams, TournamentFormat} from "./Tournament.sol";
import {
  TournamentFactory,
  ZeroImplementation,
  IndexOutOfBounds
} from "./TournamentFactory.sol";

contract TournamentFactoryTest is Test {
  uint64 constant NOW_TS = 1000;
  uint64 constant START = 2000;
  uint64 constant END = 3000;

  Tournament impl;
  TournamentFactory factory;
  address alice = makeAddr("alice");
  address bob = makeAddr("bob");

  function setUp() public {
    impl = new Tournament();
    factory = new TournamentFactory(address(impl));
    vm.warp(NOW_TS);
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

  function test_RevertWhenZeroImplementation() public {
    vm.expectRevert(ZeroImplementation.selector);
    new TournamentFactory(address(0));
  }

  function test_ImplementationIsExposed() public view {
    assertEq(factory.implementation(), address(impl));
  }

  function test_CreateSetsOrganizerToCaller() public {
    vm.prank(bob);
    address t = factory.createTournament(_params());

    assertEq(Tournament(t).organizer(), bob);
    assertEq(factory.tournamentCount(), 1);
    assertEq(factory.tournamentAt(0), t);
  }

  function test_CreateEmitsEvent() public {
    vm.prank(alice);
    vm.expectEmit(false, true, true, false);
    // tournament address is unknown ahead of time; only check organizer + index
    emit TournamentFactory.TournamentCreated(address(0), alice, 0);
    factory.createTournament(_params());
  }

  function test_CreatesIsolatedClones() public {
    vm.prank(alice);
    address a = factory.createTournament(_params());
    vm.prank(bob);
    address b = factory.createTournament(_params());

    assertTrue(a != b);
    assertEq(Tournament(a).organizer(), alice);
    assertEq(Tournament(b).organizer(), bob);
  }

  function test_TournamentsOfTracksPerOrganizer() public {
    vm.prank(alice);
    address a1 = factory.createTournament(_params());
    vm.prank(alice);
    address a2 = factory.createTournament(_params());
    vm.prank(bob);
    factory.createTournament(_params());

    address[] memory aliceTournaments = factory.tournamentsOf(alice);
    assertEq(aliceTournaments.length, 2);
    assertEq(aliceTournaments[0], a1);
    assertEq(aliceTournaments[1], a2);
    assertEq(factory.tournamentsOf(bob).length, 1);
  }

  function test_RevertWhenIndexOutOfBounds() public {
    vm.expectRevert(
      abi.encodeWithSelector(IndexOutOfBounds.selector, uint256(0), uint256(0))
    );
    factory.tournamentAt(0);
  }

  function test_GetTournamentsPagination() public {
    address[] memory created = new address[](3);
    for (uint256 i = 0; i < 3; i++) {
      vm.prank(alice);
      created[i] = factory.createTournament(_params());
    }

    address[] memory firstTwo = factory.getTournaments(0, 2);
    assertEq(firstTwo.length, 2);
    assertEq(firstTwo[0], created[0]);
    assertEq(firstTwo[1], created[1]);

    // limit clamps to the available tail
    address[] memory tail = factory.getTournaments(2, 10);
    assertEq(tail.length, 1);
    assertEq(tail[0], created[2]);

    // offset past the end yields an empty array
    assertEq(factory.getTournaments(3, 5).length, 0);
  }
}
