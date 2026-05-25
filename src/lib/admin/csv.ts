export type CsvOrderItem = { product_name: string; quantity: number };

export type CsvOrderRow = {
  reference: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_address: string;
  week_of: string;
  items: CsvOrderItem[];
  total_ngn: number;
};

const CSV_HEADER =
  "Reference,Customer Name,Phone,Email,Delivery Address,Week Of,Items,Total NGN";

function csvEscape(value: string, forceQuotes = false): string {
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replaceAll('"', '""');
  return needsQuotes || forceQuotes ? `"${escaped}"` : escaped;
}

export type CsvAbandonedCartItem = { productName: string; quantity: number };

export type CsvAbandonedCartRow = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_address: string;
  items: CsvAbandonedCartItem[];
  subtotal_ngn: number;
  created_at: string;
  contacted_at: string | null;
};

const ABANDONED_CARTS_CSV_HEADER =
  "Customer Name,Phone,Email,Delivery Address,Items,Subtotal NGN,Created At,Contacted At";

export function serializeAbandonedCartsCsv(rows: CsvAbandonedCartRow[]): string {
  const lines = rows.map((r) => {
    const items = r.items.map((i) => `${i.productName} x${i.quantity}`).join("; ");
    return [
      csvEscape(r.customer_name),
      csvEscape(r.customer_phone),
      csvEscape(r.customer_email),
      csvEscape(r.delivery_address),
      csvEscape(items, true),
      String(r.subtotal_ngn),
      csvEscape(r.created_at),
      csvEscape(r.contacted_at ?? ""),
    ].join(",");
  });

  return [ABANDONED_CARTS_CSV_HEADER, ...lines].join("\n");
}

export function serializeOrdersCsv(rows: CsvOrderRow[]): string {
  const lines = rows.map((r) => {
    const items = r.items.map((i) => `${i.product_name} x${i.quantity}`).join("; ");
    return [
      csvEscape(r.reference),
      csvEscape(r.customer_name),
      csvEscape(r.customer_phone),
      csvEscape(r.customer_email),
      csvEscape(r.delivery_address),
      csvEscape(r.week_of),
      csvEscape(items, true),
      String(r.total_ngn),
    ].join(",");
  });

  return [CSV_HEADER, ...lines].join("\n");
}

