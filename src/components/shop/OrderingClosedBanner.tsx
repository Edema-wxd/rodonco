export type OrderingClosedBannerProps = {
  isOpen: boolean;
  cutoffMessage?: string | null;
  nextDeliveryDate?: string | null;
};

function formatNextDeliveryDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function OrderingClosedBanner({
  isOpen,
  nextDeliveryDate,
}: OrderingClosedBannerProps) {
  if (isOpen) return null;

  const formattedNextDelivery = nextDeliveryDate ? formatNextDeliveryDate(nextDeliveryDate) : null;

  return (
    <div
      role="alert"
      className="sticky top-16 z-40 w-full border border-amber-200 bg-amber-50 text-amber-800"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 text-center text-sm font-medium">
        Ordering is closed
        {formattedNextDelivery ? `.` : null}
        {formattedNextDelivery ? ` Next delivery: ${formattedNextDelivery}` : null}
      </div>
    </div>
  );
}
