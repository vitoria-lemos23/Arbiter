import { NextResponse } from "next/server";
import { imageUploadSchema } from "@/features/images/schema/image";
import { storeImage } from "@/features/images/server/images";

/**
 * POST /api/images — upload a tournament cover (multipart/form-data, field
 * `file`). Binary bodies need a Route Handler (Server Actions can't stream
 * bytes). Unauthenticated in this iteration; the metadata write that references
 * the returned URL is the signed step. Returns `{ id, url }`.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const parsed = imageUploadSchema.safeParse({
    mimeType: file.type,
    sizeBytes: file.size,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid image" },
      { status: 400 },
    );
  }

  const data = Buffer.from(await file.arrayBuffer());
  const { id } = await storeImage({ data, mimeType: parsed.data.mimeType });
  return NextResponse.json({ id, url: `/api/images/${id}` }, { status: 201 });
}
