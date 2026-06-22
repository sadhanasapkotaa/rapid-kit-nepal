import { getCurrentProfile } from "@/lib/auth";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  // Unauthenticated: only /admin/login is reachable (the proxy guards the rest),
  // so render children bare without the admin chrome.
  if (!profile) {
    return <div className="min-h-screen bg-muted">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-muted">
      <AdminNav role={profile.role} email={profile.email} />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
