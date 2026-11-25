// Static storefront content (navigation, hero imagery, editorial copy).
// Placeholder photography is from Unsplash until the client's shoot is ready.

const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1800&q=80`;

export const NAV_LINKS = [
  { label: "Sarees", href: "/shop/sarees" },
  { label: "Lehengas", href: "/shop/lehengas" },
  { label: "Kurta Sets", href: "/shop/kurta-sets" },
  { label: "New In", href: "/shop?filter=new" },
  { label: "Sale", href: "/shop?filter=sale" },
] as const;

/** "Shop by occasion" (matches each product's Occasion in Admin). Links go to /shop?occasion=… */
export const OCCASIONS = ["Wedding", "Festive", "Party", "Birthday", "Sangeet", "Haldi", "Everyday", "Work"] as const;

/**
 * Price bands for the shop filter and "Shop by price" (rupees; `max` is exclusive).
 * `key` is how a band appears in links: /shop?price=3000-5000 (several: price=0-3000,3000-5000).
 */
export const PRICE_RANGES = [
  { key: "0-3000", label: "Under ₹3,000", max: 3000 },
  { key: "3000-5000", label: "₹3,000 to ₹5,000", min: 3000, max: 5000 },
  { key: "5000-10000", label: "₹5,000 to ₹10,000", min: 5000, max: 10000 },
  { key: "10000-20000", label: "₹10,000 to ₹20,000", min: 10000, max: 20000 },
  { key: "20000-", label: "₹20,000 & above", min: 20000 },
] as { key: string; label: string; min?: number; max?: number }[];

export const priceHref = (r: { key: string }) => `/shop?price=${r.key}`;

export const HERO = {
  eyebrow: "The Festive Edit, Winter 2026",
  image: unsplash("1617627143750-d86bc21e42bb"),
  imageAlt: "Woman wearing a pink and orange organza saree with gold jewellery",
  inset: unsplash("1641699862936-be9f49b1c38d"),
  insetAlt: "Detail of a plum Tussar silk saree with gold zari",
  featured: { name: "Meera Banarasi Organza", href: "/products/meera-banarasi-organza-saree" },
};

export const STORY = {
  image: unsplash("1679006831648-7c9ea12e5807"),
  imageAlt: "Woman in a forest-green handloom saree",
};

export const PROMISES = [
  "Free shipping across India",
  "Handpicked from India's weaving clusters",
  "7-day easy returns",
  "Secure UPI, card & COD payments",
  "Styling help on WhatsApp",
] as const;
