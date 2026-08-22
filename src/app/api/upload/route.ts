import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["ADMIN", "EVENT_MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image upload isn't configured yet. Add a Vercel Blob store and set BLOB_READ_WRITE_TOKEN." },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const isFileLike = file !== null && typeof file === "object" && "arrayBuffer" in file && "type" in file && "size" in file;
  if (!isFileLike) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  const uploaded = file as File;
  if (!ALLOWED_TYPES.includes(uploaded.type)) {
    return NextResponse.json({ error: "Unsupported file type. Use JPG, PNG, WEBP, or GIF." }, { status: 400 });
  }
  if (uploaded.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large. Max size is 8MB." }, { status: 400 });
  }

  const blob = await put(`events/${Date.now()}-${uploaded.name}`, uploaded, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url });
}
