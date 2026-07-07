import { beforeEach, describe, expect, it, vi } from "vitest";
import { imageUploadSchema, MAX_IMAGE_BYTES } from "./schema/image";

/** In-memory stand-in for the `images` table exercised via the Drizzle chain. */
const fake = vi.hoisted(() => {
  class FakeImageDb {
    store: Array<{ id: string; data: Buffer; mimeType: string }> = [];
    private op = "";
    private pending: { data: Buffer; mimeType: string } | null = null;
    private result: unknown = [];

    insert() {
      this.op = "insert";
      return this;
    }
    values(row: { data: Buffer; mimeType: string }) {
      this.pending = row;
      return this;
    }
    returning() {
      if (!this.pending) throw new Error("returning() called before values()");
      const row = { id: `img-${this.store.length + 1}`, ...this.pending };
      this.store.push(row);
      this.result = [{ id: row.id }];
      return this;
    }
    select() {
      this.op = "select";
      return this;
    }
    from() {
      return this;
    }
    where() {
      return this;
    }
    limit() {
      return this;
    }
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable fake for the Drizzle query chain
    then(resolve: (v: unknown) => void, reject: (e: unknown) => void) {
      const out =
        this.op === "select"
          ? this.store.map((r) => ({ data: r.data, mimeType: r.mimeType }))
          : this.result;
      return Promise.resolve(out).then(resolve, reject);
    }
  }
  return { db: new FakeImageDb() };
});

vi.mock("@arbiter/db", () => ({
  db: fake.db,
  images: { id: {}, data: {}, mimeType: {} },
}));
vi.mock("drizzle-orm", () => ({ eq: () => ({}) }));

const { storeImage, getImage } = await import("./server/images");

beforeEach(() => {
  fake.db.store = [];
});

describe("imageUploadSchema", () => {
  it("accepts an allowed mime within the size limit", () => {
    const result = imageUploadSchema.safeParse({
      mimeType: "image/png",
      sizeBytes: 1024,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a disallowed mime type", () => {
    const result = imageUploadSchema.safeParse({
      mimeType: "image/gif",
      sizeBytes: 1024,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a file larger than 2 MB", () => {
    const result = imageUploadSchema.safeParse({
      mimeType: "image/png",
      sizeBytes: MAX_IMAGE_BYTES + 1,
    });
    expect(result.success).toBe(false);
  });
});

describe("storeImage + getImage", () => {
  it("reads back identical bytes", async () => {
    const data = Buffer.from([1, 2, 3, 4, 250, 0, 128]);
    const { id } = await storeImage({ data, mimeType: "image/png" });
    const read = await getImage(id);

    expect(read?.mimeType).toBe("image/png");
    expect(read && Buffer.compare(read.data, data)).toBe(0);
  });
});
