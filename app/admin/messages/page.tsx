import { requireUser } from "@/lib/auth";
import { MessagesManager } from "./MessagesManager";

export default async function AdminMessagesPage() {
  await requireUser();
  return <MessagesManager />;
}
