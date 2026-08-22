import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { formatShortDate } from "@/lib/format";
import { displayStatusLabels, displayStatusColor, isBookable, type DisplayStatus } from "@/lib/event-status";

export interface EventCardData {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  coverImage: string;
  startAt: Date;
  endAt: Date;
  timezone: string;
  format: string;
  venueName: string | null;
  city: string | null;
  lowestPrice: number;
  isFree: boolean;
  displayStatus: DisplayStatus;
  categoryName: string;
}

export default function EventCard({ data }: { data: EventCardData }) {
  const bookable = isBookable(data.displayStatus);
  return (
    <Link
      href={`/events/${data.slug}`}
      className="group flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
        <Image
          src={data.coverImage}
          alt={data.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge color={displayStatusColor[data.displayStatus]}>{displayStatusLabels[data.displayStatus]}</Badge>
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-white/95 text-gray-800 text-xs font-semibold px-2 py-1 rounded-full">{data.categoryName}</span>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs font-semibold text-brand mb-1">
          {formatShortDate(data.startAt, data.timezone)}
          {data.startAt.toDateString() !== data.endAt.toDateString() && ` – ${formatShortDate(data.endAt, data.timezone)}`}
        </p>
        <h3 className="font-bold text-gray-900 leading-snug mb-1 line-clamp-2">{data.name}</h3>
        <p className="text-sm text-gray-500 mb-2">
          {data.format === "ONLINE" ? "Online event" : `${data.venueName ?? ""}${data.city ? `, ${data.city}` : ""}`}
        </p>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-1">{data.shortDescription}</p>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="font-bold text-gray-900">{data.isFree ? "Free" : `From ${formatMoney(data.lowestPrice)}`}</span>
          <span className={`text-sm font-semibold ${bookable ? "text-brand" : "text-gray-400"}`}>
            {bookable ? "Book Tickets →" : "View Event →"}
          </span>
        </div>
      </div>
    </Link>
  );
}
