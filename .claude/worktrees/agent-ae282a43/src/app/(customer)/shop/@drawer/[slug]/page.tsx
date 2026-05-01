export default async function DrawerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div>
      <p>Product drawer for: {slug}</p>
    </div>
  );
}
