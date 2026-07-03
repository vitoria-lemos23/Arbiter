// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Tournament, TournamentParams, TournamentFormat} from "./Tournament.sol";

error ZeroImplementation();
error IndexOutOfBounds(uint256 index, uint256 length);

/// @title TournamentFactory
/// @notice Permissionless entry point that deploys per-tournament EIP-1167
///         clones of a single {Tournament} implementation and keeps an
///         enumerable registry of every tournament created.
contract TournamentFactory {
  /// @notice The Tournament logic contract every clone delegates to.
  address public immutable implementation;

  address[] private _tournaments; // every clone, in creation order
  mapping(address => address[]) private _byOrganizer;

  /// @notice Canonical off-chain signal for indexers/web app. Carries the full
  ///         creation params plus the deposited `prize` so an indexer can fill
  ///         every column from this single event — no second subscription and no
  ///         extra RPC read. Judges are omitted (unbounded); read via
  ///         {Tournament.getJudges}. Only the first three args are `indexed`.
  event TournamentCreated(
    address indexed tournament,
    address indexed organizer,
    uint256 indexed index,
    TournamentFormat format,
    uint32 maxPlayers,
    uint256 entryFee,
    uint256 prize,
    uint64 startDate,
    uint64 endDate
  );

  /// @param implementation_ The deployed Tournament logic contract.
  constructor(address implementation_) {
    if (implementation_ == address(0)) {
      revert ZeroImplementation();
    }
    implementation = implementation_;
  }

  /// @notice Deploy and initialize a new tournament; caller becomes organizer.
  /// @dev Organizer is derived from `msg.sender` (not a parameter) to prevent
  ///      spoofing. The clone is deployed at a deterministic (CREATE2) address so
  ///      it can be derived off-chain before mining, then initialized atomically
  ///      with the forwarded `msg.value` as its prize — so it can never be left
  ///      uninitialized for a third party to claim. Reusing a `salt` reverts
  ///      (CREATE2 collision) via {Clones.cloneDeterministic}.
  /// @param params Creation parameters; validated inside {Tournament.initialize}.
  /// @param salt Caller-supplied entropy fixing the clone's CREATE2 address.
  /// @return tournament The address of the newly created clone.
  function createTournament(TournamentParams calldata params, bytes32 salt)
    external
    payable
    returns (address tournament)
  {
    tournament = Clones.cloneDeterministic(implementation, salt);
    Tournament(tournament).initialize{value: msg.value}(msg.sender, params);

    uint256 index = _tournaments.length;
    _tournaments.push(tournament);
    _byOrganizer[msg.sender].push(tournament);

    emit TournamentCreated(
      tournament,
      msg.sender,
      index,
      params.format,
      params.maxPlayers,
      params.entryFee,
      msg.value,
      params.startDate,
      params.endDate
    );
  }

  /// @notice The CREATE2 address a clone created with `salt` would occupy.
  /// @dev Canonical on-chain derivation. The frontend derives the same address
  ///      client-side (viem) to avoid a pre-sign RPC read; this view exists as
  ///      the source of truth the contract tests assert against.
  function predictTournamentAddress(bytes32 salt)
    external
    view
    returns (address)
  {
    return Clones.predictDeterministicAddress(implementation, salt);
  }

  /// @notice Total number of tournaments ever created.
  function tournamentCount() external view returns (uint256) {
    return _tournaments.length;
  }

  /// @notice Tournament address at a registry index (creation order, stable).
  function tournamentAt(uint256 index) external view returns (address) {
    if (index >= _tournaments.length) {
      revert IndexOutOfBounds(index, _tournaments.length);
    }
    return _tournaments[index];
  }

  /// @notice Paginated slice of the registry, to avoid unbounded returns.
  /// @dev Clamps `limit` to the tail past `offset`; returns an empty array when
  ///      `offset >= count`.
  function getTournaments(uint256 offset, uint256 limit)
    external
    view
    returns (address[] memory)
  {
    uint256 count = _tournaments.length;
    if (offset >= count) {
      return new address[](0);
    }
    uint256 end = offset + limit;
    if (end > count) {
      end = count;
    }
    address[] memory page = new address[](end - offset);
    for (uint256 i = offset; i < end; i++) {
      page[i - offset] = _tournaments[i];
    }
    return page;
  }

  /// @notice Every tournament created by `organizer`, in creation order.
  function tournamentsOf(address organizer)
    external
    view
    returns (address[] memory)
  {
    return _byOrganizer[organizer];
  }
}
