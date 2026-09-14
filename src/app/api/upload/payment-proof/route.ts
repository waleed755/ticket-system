import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"];

// Public (unauthenticated) endpoint — guest checkout has no session, so this
// mirrors the trust model already used by /checkout/[bookingId]/pay: the
// bookingId itself (an unguessable cuid) is the bearer credential. Only a
// booking still awaiting payment may attach a proof image.
export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Payment proof upload isn't configured yet. Add a Vercel Blob store and set BLOB_READ_WRITE_TOKEN." },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const bookingId = formData.get("bookingId");
  if (typeof bookingId !== "string" || !bookingId) {
    return NextResponse.json({ error: "Missing booking reference." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.status !== "PENDING_PAYMENT") {
    return NextResponse.json({ error: "This booking is not awaiting payment." }, { status: 400 });
  }

  const file = formData.get("file");
  const isFileLike = file !== null && typeof file === "object" && "arrayBuffer" in file && "type" in file && "size" in file;
  if (!isFileLike) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  const uploaded = file as File;
  if (!ALLOWED_TYPES.includes(uploaded.type)) {
    return NextResponse.json({ error: "Unsupported file type. Use JPG or PNG." }, { status: 400 });
  }
  if (uploaded.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large. Max size is 8MB." }, { status: 400 });
  }

  const blob = await put(`payment-proofs/${bookingId}/${Date.now()}-${uploaded.name}`, uploaded, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url });
}
