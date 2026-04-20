export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Order Confirmation</h1>
      <p className="mt-2 text-gray-600">Reference: {ref}</p>
    </div>
  );
}
