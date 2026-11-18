import { redirect } from "next/navigation";

// Pending (unpaid) orders now live in the main Orders view under the
// "Pending" status filter. Kept as a redirect so old bookmarks still work.
export default function AdminPendingPage() {
  redirect("/admin/orders?status=pending");
}
