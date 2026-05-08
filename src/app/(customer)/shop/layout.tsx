import { ShopDrawerController } from "@/components/shop/ShopDrawerController";

export default function ShopLayout({
  children,
  drawer,
}: {
  children: React.ReactNode;
  drawer: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ShopDrawerController />
      {drawer}
    </>
  );
}
