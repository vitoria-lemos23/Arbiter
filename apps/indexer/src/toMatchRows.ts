export interface BracketGeneratedEvent {
  args: {
    playerCount: number;
    seeding: readonly `0x${string}`[];
  };
  log: { address: `0x${string}` };
  block: { number: bigint; timestamp: bigint };
  transaction: { hash: `0x${string}` };
}

function unixToDate(seconds: bigint): Date {
  return new Date(Number(seconds) * 1000);
}

export function toMatchRows(event: BracketGeneratedEvent) {
  const tournament = event.log.address.toLowerCase() as `0x${string}`;
  const n = event.args.playerCount;
  const seeding = event.args.seeding;

  const numMatches = n - 1;
  const totalRounds = Math.log2(n);
  const rows = [];

  for (let i = 0; i < numMatches; i++) {
    const level = Math.floor(Math.log2(i + 1));
    const round = totalRounds - level;

    // Round 1 (leaves) are indices [n/2 - 1 .. n - 2]
    const isLeaf = i >= n / 2 - 1;

    let playerA: `0x${string}` | null = null;
    let playerB: `0x${string}` | null = null;
    let seedA: number | null = null;
    let seedB: number | null = null;

    if (isLeaf) {
      // k is the leaf index 0 .. n/2 - 1
      const k = i - (n / 2 - 1);

      // In Solidity, standard seeding paired: slots[2k] vs slots[2k+1].
      // The `seeding` array contains the players in slot order.
      // So playerA is seeding[2k], playerB is seeding[2k+1].
      playerA = seeding[2 * k].toLowerCase() as `0x${string}`;
      playerB = seeding[2 * k + 1].toLowerCase() as `0x${string}`;

      // The event doesn't pass seeds, but we can reconstruct them from the
      // standard seeding algorithm, or we can just let the indexer query them?
      // Wait, the spec says "round-1 nodes get both players from the seeding array... with seeds".
      // Let's implement the standard seeding algorithm here to compute the seeds.
      const seeds = generateStandardSeeding(n);
      seedA = seeds[2 * k];
      seedB = seeds[2 * k + 1];
    }

    rows.push({
      id: `${tournament}-${i}`,
      tournament,
      matchIndex: i,
      round,
      playerA,
      playerB,
      seedA,
      seedB,
      winner: null,
      // Round-1 leaves are auto-activated at generation (#007); internal nodes
      // stay Pending until both children resolve. Mirrors MatchStatus: the
      // contract also emits MatchActivated for each leaf, but seeding the
      // status here keeps the row correct regardless of handler ordering.
      status: isLeaf ? 1 : 0,
      blockNumber: event.block.number,
      txHash: event.transaction.hash,
      generatedAt: unixToDate(event.block.timestamp),
    });
  }

  return rows;
}

function generateStandardSeeding(n: number): number[] {
  let slots = [1];
  while (slots.length < n) {
    const nextSlots = [];
    const m = 2 * slots.length + 1;
    for (const s of slots) {
      nextSlots.push(s, m - s);
    }
    slots = nextSlots;
  }
  return slots;
}
