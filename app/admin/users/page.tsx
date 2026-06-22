import { requireAdmin } from "@/lib/auth";
import { UsersManager } from "./UsersManager";

export default async function AdminUsersPage() {
  const me = await requireAdmin();
  return <UsersManager currentUserId={me.id} />;
}
