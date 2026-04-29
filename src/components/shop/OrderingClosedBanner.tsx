import type { ReactNode } from "react";

export type OrderingClosedBannerProps = {
  isOpen: boolean;
  cutoffMessage?: string | null;
  nextDeliveryDate?: string | null;
};

function DefaultMessage({ cutoffMessage }: { cutoffMessage?: string | null }): ReactNode {
  return (
    <>
      <p className="text-sm font-semibold text-yellow-900">Ordering is currently closed</p>
      <p className="mt-1 text-sm text-yellow-800">
        {cutoffMessage ?? "Please check back during the ordering window."}
      </p>
    </>
  );
}

export function OrderingClosedBanner({
  isOpen,
  cutoffMessage,
  nextDeliveryDate,
}: OrderingClosedBannerProps) {
  if (isOpen) return null;

  return (
    <div className="sticky top-16 z-40 w-full border-b border-yellow-200 bg-yellow-50/95">
      <div className="mx-auto max-w-7xl px-4 py-3 text-center">
        <DefaultMessage cutoffMessage={cutoffMessage} />
        {nextDeliveryDate ? (
          <p className="mt-1 text-xs text-yellow-900/80">Next delivery: {nextDeliveryDate}</p>
        ) : null}
      </div>
    </div>
  );
}
