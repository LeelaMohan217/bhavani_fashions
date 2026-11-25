// Shapes returned by the Kosha API (backend/src/routes).
// All prices are integers in paise.

export type Category = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
};

export type ProductImage = { url: string; alt: string };

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  fabric: string | null;
  isNewArrival: boolean;
  category: { name: string; slug: string };
  images: ProductImage[];
  colors: { name: string; hex: string }[];
  inStock: boolean;
  /** Priced with the store-wide promotion (e.g. Black Friday) */
  onPromotion?: boolean;
  /** Pieces sold in real (confirmed or later) orders */
  sold?: number;
  /** Buyable options for adding to the bag from the card (older wishlist snapshots lack them) */
  options?: CardOption[];
};

export type CardOption = { id: string; color: string; colorHex: string; size: string | null; stock: number };

export type ProductVariant = {
  id: string;
  sku: string;
  color: string;
  colorHex: string;
  size: string | null;
  stock: number;
};

export type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
  fabric: string | null;
  occasion: string | null;
  care: string | null;
  price: number;
  compareAtPrice: number | null;
  isNewArrival: boolean;
  /** `parent` is set when the product sits in a subcategory (e.g. Sarees › Silk sarees) */
  category: { name: string; slug: string; parent?: { name: string; slug: string } | null };
  images: ProductImage[];
  variants: ProductVariant[];
  related: ProductCard[];
  /** Pieces sold in real (confirmed or later) orders */
  sold?: number;
  onPromotion?: boolean;
};

/** Store-wide % off running now (e.g. Black Friday) */
export type Promotion = { name: string; percentOff: number; endsAt: string };

export type ProductList = {
  items: ProductCard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Home-page offer banner (managed in Admin → Banners) */
export type Banner = {
  id: string;
  eyebrow: string | null;
  title: string;
  highlight: string | null;
  subtitle: string | null;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  imageAlt: string;
  /** Side of the photo the text sits on (tablet and desktop) */
  textSide: "LEFT" | "RIGHT";
};

/** Filter choices on offer in a listing, with how many products each finds */
export type ProductFilters = {
  /** Subcategories of the listing's category that have products */
  types: { slug: string; name: string; count: number }[];
  colors: { name: string; hex: string; count: number }[];
  fabrics: { name: string; count: number }[];
  occasions: { name: string; count: number }[];
};

export type SortOption = "featured" | "newest" | "price-asc" | "price-desc";

// ─── Cart & checkout ─────────────────────────────────────────────────────────

export type CartItem = {
  id: string;
  variantId: string;
  quantity: number;
  productName: string;
  productSlug: string;
  image: ProductImage | null;
  color: string;
  colorHex: string;
  size: string | null;
  sku: string;
  unitPrice: number;
  compareAtPrice: number | null;
  lineTotal: number;
  maxQuantity: number;
  unavailable: boolean;
};

export type Cart = {
  id: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  codFee: number;
};

/** A discount code that was accepted for the current bag */
export type AppliedCoupon = { code: string; discount: number; label: string };

export type CheckoutConfig = {
  razorpayEnabled: boolean;
  shippingFee: number;
  codFee: number;
};

export type PaymentMethod = "RAZORPAY" | "COD";
export type OrderStatus = "PENDING_PAYMENT" | "CONFIRMED" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "COD_DUE" | "REFUND_DUE" | "REFUNDED";

export type RazorpayPayment = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
};

export type OrderDetail = {
  id: string;
  number: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  fullName: string;
  email: string;
  phone: string;
  address: { line1: string; line2: string | null; city: string; state: string; pincode: string };
  subtotal: number;
  shippingFee: number;
  codFee: number;
  /** Coupon discount in paise (0 when none) */
  discount: number;
  couponCode: string | null;
  total: number;
  createdAt: string;
  courierName: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: {
    id: string;
    productName: string;
    productSlug: string;
    imageUrl: string | null;
    color: string;
    size: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
};

/** Result of a server action: either data or a user-facing error (with optional field errors). */
export type ActionResult<T> =
  | ({ ok: true } & T)
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** One link in the store's header or footer menu (Admin → Navigation) */
export type NavNode = { id: string; label: string; href: string | null; badge: string | null; children: NavNode[] };
/** A menu as the store draws it; `custom` is false while it still follows the categories automatically */
export type NavMenu = { items: NavNode[]; custom: boolean };
