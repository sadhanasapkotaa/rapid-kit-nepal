import { requireUser } from "@/lib/auth";
import { GenerationsManager } from "./GenerationsManager";

export default async function AdminGenerationsPage() {
  await requireUser();
  return <GenerationsManager />;
}
