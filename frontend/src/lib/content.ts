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

export const HERO = {
  eyebrow: "The Festive Edit, Winter 2026",
  image: unsplash("1617627143750-d86bc21e42bb"),
  imageAlt: "Woman wearing a pink and orange organza saree with gold jewellery",
  inset: unsplash("1641699862936-be9f49b1c38d"),
  insetAlt: "Detail of a plum Tussar silk saree with gold zari",
  featured: { name: "Meera Banarasi Organza", href: "/products/meera-banarasi-organza-saree" },
};

/** Photo for the store-wide promotion banner (Black Friday) */
export const PROMO_IMAGE = {
  src: unsplash("1759906760638-eeffcb471e53"),
  alt: "Bride in a red embroidered lehenga",
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
