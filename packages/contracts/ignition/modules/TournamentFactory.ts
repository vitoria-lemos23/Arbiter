import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Deploy the Tournament logic contract once, then a factory that clones it.
// The implementation's constructor calls _disableInitializers(), so it can
// never be initialized directly — only the factory's clones can.
export default buildModule("TournamentFactoryModule", (m) => {
  const implementation = m.contract("Tournament");
  const factory = m.contract("TournamentFactory", [implementation]);

  return { implementation, factory };
});
