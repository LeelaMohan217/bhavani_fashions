import type { OrderStatus, PaymentMethod, PaymentStatus } from "../types";

export type Admin = { id: string; name: string; email: string };

/** Admin → Low stock */
export type LowStockList = {
  threshold: number;
  counts: { soldOut: number; low: number; total: number };
  items: {
    id: string;
    sku: string;
    color: string;
    size: string | null;
    stock: number;
    product: { id: string; name: string; category: { name: string } };
  }[];
};

export type BestSellerPeriod = "this-month" | "last-month" | "all";

/** Admin → Best sellers (amounts in paise) */
export type BestSellers = {
  period: BestSellerPeriod;
  from: string | null;
  to: string | null;
  totals: { units: number; revenue: number; orders: number; products: number };
  items: {
    key: string;
    productId: string | null;
    name: string;
    slug: string;
    category: string | null;
    image: string | null;
    isActive: boolean;
    units: number;
    revenue: number;
    orders: number;
  }[];
};

/** A row in Admin → Admin Accounts (everyone has the Admin role) */
export type AdminAccount = Admin & {
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  isYou: boolean;
};

export type Dashboard = {
  today: { orders: number; revenue: number };
  last30: { orders: number; revenue: number };
  toFulfil: number;
  paymentSplit: { cod: { orders: number; revenue: number }; prepaid: { orders: number; revenue: number } };
  lowStockCount: number;
  /** Variants with no pieces left (part of lowStockCount) */
  soldOutCount?: number;
  lowStock: {
    id: string;
    sku: string;
    color: string;
    size: string | null;
    stock: number;
    product: { id: string; name: string };
  }[];
  recentOrders: {
    id: string;
    number: string;
    fullName: string;
    total: number;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    createdAt: string;
  }[];
  /** Same IST day last week, up to the same time of day (absent on an older API) */
  sameDayLastWeek?: { orders: number; revenue: number };
  /** Last 12 IST months, oldest first, e.g. { month: "2026-11", ... } (absent on an older API) */
  monthly?: { month: string; orders: number; revenue: number }[];
};

export type AdminAlerts = {
  total: number;
  toFulfilCount: number;
  toFulfil: { id: string; number: string; fullName: string; total: number; createdAt: string; status: OrderStatus }[];
  refundsDue: { id: string; number: string; fullName: string; total: number; updatedAt: string }[];
  lowStockCount: number;
  lowStock: { id: string; color: string; size: string | null; stock: number; product: { id: string; name: string } }[];
};

export type AdminOrderRow = {
  id: string;
  number: string;
  createdAt: string;
  fullName: string;
  phone: string;
  city: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  total: number;
  pieces: number;
};

export type AdminOrderList = {
  items: AdminOrderRow[];
  total: number;
  page: number;
  totalPages: number;
  counts: Partial<Record<OrderStatus, number>>;
};

export type AdminOrder = {
  id: string;
  number: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  email: string;
  phone: string;
  fullName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  shippingFee: number;
  codFee: number;
  discount: number;
  couponCode: string | null;
  total: number;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  courierName: string | null;
  trackingNumber: string | null;
  createdAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  allowedTransitions: OrderStatus[];
  items: {
    id: string;
    productName: string;
    productSlug: string;
    imageUrl: string | null;
    color: string;
    size: string | null;
    sku: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  events: { id: string; type: string; message: string; createdAt: string; by: string | null }[];
};

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  compareAtPrice: number | null;
  isActive: boolean;
  isFeatured: boolean;
  image: string | null;
  variantCount: number;
  totalStock: number;
  lowStock: boolean;
  updatedAt: string;
};

export type AdminProductList = { items: AdminProductRow[]; total: number; page: number; totalPages: number };

export type AdminVariant = {
  id?: string;
  sku: string;
  color: string;
  colorHex: string;
  size: string | null;
  stock: number;
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  fabric: string | null;
  occasion: string | null;
  care: string | null;
  categoryId: string;
  price: number;
  compareAtPrice: number | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  images: { url: string; alt: string }[];
  variants: AdminVariant[];
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  imageUrl: string | null;
  /** Set for subcategories */
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  /** Products directly in this category (not counting subcategories) */
  productCount: number;
  childCount: number;
};

export type AdminCategoryDetail = AdminCategory & { parent: { id: string; name: string } | null };

export type CategoryPayload = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  imageUrl: string;
  parentId: string | null;
  isActive: boolean;
};

/** Payload sent when saving a product (prices in paise) */
export type ProductPayload = Omit<AdminProduct, "id" | "fabric" | "occasion" | "care" | "slug"> & {
  slug?: string;
  fabric?: string;
  occasion?: string;
  care?: string;
};

export type AdminBanner = {
  id: string;
  eyebrow: string | null;
  title: string;
  highlight: string | null;
  subtitle: string | null;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  imageAlt: string;
  textSide: "LEFT" | "RIGHT";
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BannerPayload = {
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  imageAlt: string;
  textSide: "LEFT" | "RIGHT";
  isActive: boolean;
};

export type AdminPromotion = {
  id: string;
  name: string;
  percentOff: number;
  startsAt: string | null;
  endsAt: string;
  isActive: boolean;
};

export type PromotionPayload = { name: string; percentOff: number; endsAt: string; isActive: boolean };

// ─── Customers ───────────────────────────────────────────────────────────────

export type CustomerSort = "recent" | "spent" | "orders";

export type AdminCustomerList = {
  items: { phone: string; name: string; email: string; city: string; state: string; orders: number; spent: number; lastOrderAt: string }[];
  total: number;
  page: number;
  totalPages: number;
};

export type AdminCustomer = {
  phone: string;
  name: string;
  email: string;
  address: { line1: string; line2: string | null; city: string; state: string; pincode: string };
  orders: number;
  spent: number;
  pieces: number;
  firstOrderAt: string;
  lastOrderAt: string;
  history: {
    id: string;
    number: string;
    createdAt: string;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    total: number;
    pieces: number;
  }[];
};

// ─── Coupons ─────────────────────────────────────────────────────────────────

export type CouponType = "PERCENT" | "FLAT";
export type CouponState = "active" | "scheduled" | "expired" | "used-up" | "off";
export type CouponShow = "all" | "active" | "scheduled" | "ended";

export type AdminCoupon = {
  id: string;
  code: string;
  description: string | null;
  type: CouponType;
  /** Percent, or paise for FLAT */
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  state: CouponState;
  /** e.g. "10% off up to ₹500" */
  label: string;
};

export type AdminCouponList = { counts: Record<CouponShow, number>; items: AdminCoupon[] };

export type CouponPayload = {
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  isActive: boolean;
};

// ─── Activity log ────────────────────────────────────────────────────────────

export const ACTIVITY_AREAS = ["order", "product", "category", "banner", "coupon", "offer", "account", "profile"] as const;
export type ActivityArea = (typeof ACTIVITY_AREAS)[number];

export type ActivityList = {
  items: { id: string; adminId: string | null; adminName: string; area: ActivityArea; summary: string; href: string | null; createdAt: string }[];
  total: number;
  page: number;
  totalPages: number;
  admins: { id: string; name: string }[];
};