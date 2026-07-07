import { getImage } from "@/features/images/server/images";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/images/:id — stream the stored bytes with the original content type
 * and an immutable long cache (ids are opaque + content-addressed by row, so
 * bytes never change under an id). 404 when the id is unknown or malformed.
 *
 * `params` is a Promise in Next 16 and must be awaited.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return new Response("Not found", { status: 404 });

  const image = await getImage(id);
  if (!image) return new Response("Not found", { status: 404 });

  // `Buffer` is a `Uint8Array`; wrap as a plain view to satisfy BodyInit typing.
  return new Response(new Uint8Array(image.data), {
    status: 200,
    headers: {
      "Content-Type": image.mimeType,
      "Content-Length": String(image.data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      // Bytes are validated on upload, but never let a browser re-interpret them.
      "X-Content-Type-Options": "nosniff",
    },
  });
}
