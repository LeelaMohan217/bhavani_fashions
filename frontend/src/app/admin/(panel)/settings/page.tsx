import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, ExternalLink, ImageIcon, Store, Truck, UserRound } from "lucide-react";
import { getMe } from "@/lib/admin/api";
import { connection } from "next/server";
import { getCheckoutConfig } from "@/lib/api";
import { SettingsSkeleton } from "@/components/admin/skeletons";
import { formatPrice } from "@/lib/format";
import { Badge, Card, PageHeader, btn } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="How your store is set up. Editing these from the admin is coming soon."
        actions={
          <Link href="/" target="_blank" className={`${btn.base} ${btn.secondary}`}>
            <ExternalLink className="size-4" /> View store
          </Link>
        }
      />
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </>
  );
}

async function SettingsContent() {
  // Load at request time (not during the build) so deploys never depend on the API being up.
  await connection();
  const [me, config] = await Promise.all([getMe(), getCheckoutConfig()]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title={<Title icon={Store}>Store</Title>}>
        <Rows
          rows={[
            ["Store name", "Bhavani Fashion"],
            ["Currency", "Indian Rupee (₹)"],
            ["Prices", "Inclusive of all taxes"],
            ["Customer checkout", "Guest checkout (no account needed)"],
          ]}
        />
      </Card>

      <Card title={<Title icon={CreditCard}>Payments</Title>}>
        <ul className="divide-y divide-neutral-100">
          <li className="flex items-center justify-between gap-4 py-3 first:pt-0">
            <div>
              <p className="text-sm font-medium">Online payments · Razorpay</p>
              <p className="mt-0.5 text-xs text-neutral-500">UPI, cards, net banking and wallets</p>
            </div>
            {config.razorpayEnabled ? <Badge tone="green" dot>Active</Badge> : <Badge tone="amber" dot>Not connected</Badge>}
          </li>
          <li className="flex items-center justify-between gap-4 py-3 last:pb-0">
            <div>
              <p className="text-sm font-medium">Cash on delivery</p>
              <p className="mt-0.5 text-xs text-neutral-500">Handling fee of {formatPrice(config.codFee)} per order</p>
            </div>
            <Badge tone="green" dot>Active</Badge>
          </li>
        </ul>
        {!config.razorpayEnabled && (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800">
            Customers can only pay by cash on delivery until Razorpay keys are added to the server
            configuration. Ask your developer to connect it.
          </p>
        )}
      </Card>

      <Card title={<Title icon={Truck}>Shipping & returns</Title>}>
        <Rows
          rows={[
            ["Shipping fee", config.shippingFee === 0 ? "Free across India" : formatPrice(config.shippingFee)],
            ["Dispatch time", "Within 48 hours"],
            ["Delivery estimate", "4 to 7 working days"],
            ["Returns", "7 days from delivery"],
            ["Max quantity per piece", "5"],
          ]}
        />
      </Card>

      <Card title={<Title icon={ImageIcon}>Product images</Title>}>
        <Rows
          rows={[
            ["How images are added", "Paste a link in the product editor"],
            ["Allowed sources", "images.unsplash.com, res.cloudinary.com"],
            ["Direct uploads", "Coming soon (Cloudinary)"],
          ]}
        />
      </Card>

      <Card title={<Title icon={UserRound}>Your account</Title>} className="lg:col-span-2">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-full bg-neutral-900 text-sm font-medium text-white">
            {me.name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{me.name}</p>
            <p className="text-sm text-neutral-500">{me.email}</p>
          </div>
          <Badge tone="violet">Admin</Badge>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-neutral-500">
          Sessions last 7 days. To change your name or password, ask your developer to run the
          admin account command. Resetting a password signs out all your devices.
        </p>
      </Card>
    </div>
  );
}

function Title({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <Icon className="size-4 text-neutral-500" />
      {children}
    </span>
  );
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-neutral-100">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-6 py-2.5 text-sm first:pt-0 last:pb-0">
          <dt className="text-neutral-500">{label}</dt>
          <dd className="text-right font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
