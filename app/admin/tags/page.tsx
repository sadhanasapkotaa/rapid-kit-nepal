import { requireUser } from "@/lib/auth";
import { TagsManager } from "./TagsManager";

export default async function AdminTagsPage() {
  await requireUser();
  return <TagsManager />;
}
