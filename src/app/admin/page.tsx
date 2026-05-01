import { auth } from "@/auth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { redirect } from "next/navigation";

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user) redirect("/admin/orders");
  return <AdminLogin />;
}
