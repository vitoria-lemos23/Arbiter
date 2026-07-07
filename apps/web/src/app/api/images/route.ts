import { NextResponse } from "next/server";
import { validateImageBytes } from "@/features/images/lib/validateImageBytes";
import { storeImage } from "@/features/images/server/images";

/**
 * POST /api/images — upload a tournament cover (multipart/form-data, field
 * `file`). Binary bodies need a Route Handler (Server Actions can't stream
 * bytes). Unauthenticated in this iteration. Returns `{ id, url }`.
 *
 * Constraints are enforced on the actual bytes, not the client-declared
 * headers: the buffer length is re-checked against the size limit and the MIME
 * type is sniffed from the magic bytes (a spoofed `Content-Type` is rejected),
 * so what gets stored and later served always matches its real content.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const data = Buffer.from(await file.arrayBuffer());
  const validation = validateImageBytes(data);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { id } = await storeImage({ data, mimeType: validation.mimeType });
  return NextResponse.json({ id, url: `/api/images/${id}` }, { status: 201 });
}
