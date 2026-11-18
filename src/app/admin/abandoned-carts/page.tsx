import { redirect } from "next/navigation";

// Abandoned carts now live under Customers. Kept as a redirect so old
// bookmarks still work.
export default function AdminAbandonedCartsPage() {
  redirect("/admin/customers?view=abandoned");
}
