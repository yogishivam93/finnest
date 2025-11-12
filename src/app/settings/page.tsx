// src/app/settings/page.tsx
import SettingsForm from "@/components/SettingsForm";
import RequireAuth from "@/components/RequireAuth";

export default function SettingsPage() {
  return (
    <RequireAuth>
      <main className="p-6">
        <SettingsForm />
      </main>
    </RequireAuth>
  );
}
