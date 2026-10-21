export default function PlaceholderPage({ title, description }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="rounded-2xl border border-dashed border-sand-200 bg-white p-10 text-center">
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}
