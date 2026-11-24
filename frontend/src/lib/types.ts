// Shapes returned by the Bhavani Fashion API (backend/src/routes).
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
};

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
  category: { name: string; slug: string };
  images: ProductImage[];
  variants: ProductVariant[];
  related: ProductCard[];
};

export type ProductList = {
  items: ProductCard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
  total: number;
  createdAt: string;
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
