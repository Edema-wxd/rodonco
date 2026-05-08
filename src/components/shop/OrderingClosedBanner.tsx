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
      className="sticky top-[4.5rem] z-40 w-full border-y border-accent/30 bg-accent/10 mb-6"
    >
      <div className="mx-auto max-w-7xl px-4 py-2.5 text-center text-sm font-medium text-accent sm:px-6">
        Ordering is closed.
        {formattedNextDelivery && (
          <>
            {" "}
            <span className="text-accent/80">
            Next delivery: {formattedNextDelivery}.
            </span>
          </>
        )}
      </div>
    </div>
  );
}
