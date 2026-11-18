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

