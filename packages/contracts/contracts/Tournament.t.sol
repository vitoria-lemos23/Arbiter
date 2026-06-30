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
  ZeroJudgeAddress
} from "./Tournament.sol";

contract TournamentTest is Test {
  // Mirror of Tournament's event for vm.expectEmit matching.
  event TournamentInitialized(
    address indexed organizer,
    TournamentFormat format,
    uint32 maxPlayers,
    uint256 entryFee,
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
      organizer, TournamentFormat.SingleElimination, 8, 1 ether, START, END
    );
    t.initialize(organizer, _params());
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
