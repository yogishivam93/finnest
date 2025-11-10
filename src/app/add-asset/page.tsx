import AddAssetForm from "@/components/AddAssetForm";

export const metadata = {
  title: "Add Asset • FinNest",
};

export default function AddAssetPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Add Asset</h1>
      </div>
      <AddAssetForm />
    </div>
  );
}
