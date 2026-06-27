export type Role = "admin" | "staff";

export type Tag = { id: string; tag_code: string; name: string };

export type Generation = {
  id: string;
  generation_code: string;
  name: string;
};

export type Supplier = {
  id: string;
  supplier_code: string;
  name: string;
  country_of_origin: string | null;
  contact_person_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  product_code: string;
  supplier_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  images: string[];
  videos: string[];
  tags: Tag[];
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  phone: string | null;
  topic: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string | null;
  role: Role;
  created_at: string;
};
