// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Tournament, TournamentParams} from "./Tournament.sol";

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

  /// @notice Canonical off-chain signal for indexers/web app.
  event TournamentCreated(
    address indexed tournament,
    address indexed organizer,
    uint256 indexed index
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
  ///      spoofing. The clone is initialized atomically so it can never be left
  ///      uninitialized for a third party to claim.
  /// @param params Creation parameters; validated inside {Tournament.initialize}.
  /// @return tournament The address of the newly created clone.
  function createTournament(TournamentParams calldata params)
    external
    returns (address tournament)
  {
    tournament = Clones.clone(implementation);
    Tournament(tournament).initialize(msg.sender, params);

    uint256 index = _tournaments.length;
    _tournaments.push(tournament);
    _byOrganizer[msg.sender].push(tournament);

    emit TournamentCreated(tournament, msg.sender, index);
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
