const ngn = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export function formatNgn(amount: number | string | null | undefined): string {
  const value = Number(amount ?? 0);
  return ngn.format(Number.isFinite(value) ? value : 0);
}

