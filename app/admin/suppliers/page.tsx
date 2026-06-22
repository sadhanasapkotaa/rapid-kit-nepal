import { requireUser } from "@/lib/auth";
import { SuppliersManager } from "./SuppliersManager";

export default async function AdminSuppliersPage() {
  await requireUser();
  return <SuppliersManager />;
}
