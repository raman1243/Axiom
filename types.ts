export type District = { id: number; name_en: string; name_as: string | null; slug: string }
export type Category = { id: number; name_en: string; name_as: string | null; slug: string }
export type Listing = {
  id: string; name: string; description: string | null; phone: string | null;
  address: string | null; district_name: string; district_slug: string;
  category_name: string; category_slug: string; verification_status: string;
}
