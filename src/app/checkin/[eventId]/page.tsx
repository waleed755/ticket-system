import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CheckinScanner from "./scanner";

export const dynamic = "force-dynamic";

export default async function CheckinEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  return (
    <div>
      <Link href="/checkin" className="text-xs text-gray-400 mb-2 block">← Change event</Link>
      <h1 className="text-lg font-bold mb-4">{event.name}</h1>
      <CheckinScanner eventId={eventId} />
    </div>
  );
}
