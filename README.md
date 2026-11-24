# Bhavani Fashion

Custom e-commerce storefront for sarees, lehengas and kurta sets.

| Part | Stack | Folder |
|---|---|---|
| Storefront | Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · Lucide icons | `frontend/` |
| API | Express 5 · TypeScript · Zod | `backend/` |
| Database | PostgreSQL 17 · Prisma 7 | `backend/prisma/` |
| Images | Cloudinary (Unsplash placeholders for now) | — |

## First-time setup

1. **Database** — the `bhavani_fashions` database exists on Postgres 17 (port **5433**).
   Edit `backend/.env` and replace `YOUR_USER` / `YOUR_PASSWORD` in `DATABASE_URL`.

2. **Backend**

   ```powershell
   cd backend
   npm install
   npm run db:migrate -- --name init   # creates the tables
   npm run db:seed                     # 3 categories, 15 sample products
   npm run dev                         # http://localhost:4000
   ```

3. **Frontend** (new terminal)

   ```powershell
   cd frontend
   npm install
   npm run dev                         # http://localhost:3000
   ```

## API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/categories` | All categories with product counts |
| GET | `/api/categories/:slug` | One category |
| GET | `/api/products` | `category`, `featured`, `new`, `color`, `fabric`, `minPrice`, `maxPrice` (paise), `sort` (`featured`/`newest`/`price-asc`/`price-desc`), `page`, `pageSize` |
| GET | `/api/products/:slug` | Full product with images, variants and 4 related products |
| POST | `/api/carts` | Create an empty cart |
| GET | `/api/carts/:cartId` | Cart with live prices, stock and totals |
| POST | `/api/carts/:cartId/items` | `{ variantId, quantity }` — add (increments if present, max 5, stock-checked) |
| PATCH | `/api/carts/:cartId/items/:itemId` | `{ quantity }` — set quantity, `0` removes |
| DELETE | `/api/carts/:cartId/items/:itemId` | Remove a line |
| GET | `/api/checkout/config` | Fees and whether Razorpay is enabled |
| POST | `/api/checkout` | Place an order. COD confirms immediately; Razorpay returns payment details |
| POST | `/api/checkout/verify` | Verify a Razorpay payment signature and confirm the order |
| GET | `/api/orders/:orderId` | Order confirmation details |

All prices are stored and returned as integers in **paise** (₹1 = 100).

## Cart & checkout rules

- **Guest checkout** — no login. The storefront keeps the cart id in an httpOnly `bf_cart` cookie and calls the API through Next.js Server Functions (`frontend/src/lib/cart-actions.ts`), so the browser never talks to the API directly.
- **Shipping** is free; **Cash on delivery** adds ₹49 (`backend/src/config/store.ts`).
- **Stock** is only reduced when an order is confirmed (COD placed, or Razorpay payment verified), using an atomic "decrement only if enough stock" update. If a paid order can't be fulfilled it is cancelled and marked `REFUND_DUE`.
- Order items are **snapshots** (name, price, image) so later product edits never change past orders.

## Razorpay (online payments)

1. Create a free account at razorpay.com and switch the dashboard to **Test mode**.
2. Account & Settings → API Keys → generate a **test** key.
3. Put both values in `backend/.env` as `RAZORPAY_KEY_ID` (`rzp_test_…`) and `RAZORPAY_KEY_SECRET`, then restart the API.

Without keys the checkout offers Cash on delivery only. The API refuses to start with a `rzp_live_` key outside production.

## Pages

- `/` — home: hero, categories, new arrivals, craft story, featured edit
- `/shop`, `/shop?filter=new`, `/shop/[category]` — listings with category chips, sort and pagination
- `/products/[slug]` — gallery, colour/size selection, add to bag, details, related products
- Bag drawer (from the header or after "Add to bag") and `/bag`
- `/checkout` — single-page guest checkout (contact, address, payment)
- `/order/[id]` — order confirmation

## Admin panel (`/admin`)

- **Sign in:** staff accounts are stored in the database (argon2 password hashes, 7-day server-side sessions in an httpOnly `bf_admin` cookie, 5 failed attempts → 15-minute lockout).
- **Create or reset an admin:** `cd backend` then `npm run admin:create -- you@example.com "Your Name"` (prompts for a password, 10+ characters; resetting signs out existing sessions).
- **Local test admin:** `admin@bhavani.test`, password in `backend/.env` (`DEV_ADMIN_PASSWORD`) — development only.
- **Dashboard:** today's orders and revenue, orders waiting to ship, COD vs prepaid (30 days), low-stock variants, recent orders.
- **Orders:** filter by status, search by order number, name or phone. Fulfilment flow: To pack → Packed → Shipped (courier + tracking) → Delivered. Delivered COD orders are marked paid automatically. Cancelling returns stock; prepaid cancellations become "Refund due" until marked refunded. Every change is logged in the order timeline with the admin's name.
- **Products:** search, live/hidden filter, hide/show (no hard delete), and a full editor for details, pricing, visibility, variants (colour, size, SKU, stock) and images.
- **Images:** pasted links from `images.unsplash.com` or `res.cloudinary.com` for now; direct Cloudinary uploads come later.

## Not built yet

Razorpay webhook (backup confirmation if the shopper closes the tab mid-payment), order emails/SMS, customer accounts, wishlist persistence, search, Cloudinary uploads in the admin, category management, Shiprocket.
