import { getUpload } from "@/lib/services/providers";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = Number(id);
  const upload = Number.isInteger(n) && n > 0 ? await getUpload(n) : undefined;
  if (!upload) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(upload.data), {
    headers: { "Content-Type": upload.mime, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
