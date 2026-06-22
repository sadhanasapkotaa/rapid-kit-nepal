import { requireUser } from "@/lib/auth";
import { ProductsManager } from "./ProductsManager";

export default async function AdminProductsPage() {
  await requireUser();
  return <ProductsManager />;
}
