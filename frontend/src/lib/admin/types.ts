import type { OrderStatus, PaymentMethod, PaymentStatus } from "../types";

export type Admin = { id: string; name: string; email: string };

export type Dashboard = {
  today: { orders: number; revenue: number };
  last30: { orders: number; revenue: number };
  toFulfil: number;
  paymentSplit: { cod: { orders: number; revenue: number }; prepaid: { orders: number; revenue: number } };
  lowStockCount: number;
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

export type AdminCategory = { id: string; name: string; slug: string };

/** Payload sent when saving a product (prices in paise) */
export type ProductPayload = Omit<AdminProduct, "id" | "fabric" | "occasion" | "care" | "slug"> & {
  slug?: string;
  fabric?: string;
  occasion?: string;
  care?: string;
};
