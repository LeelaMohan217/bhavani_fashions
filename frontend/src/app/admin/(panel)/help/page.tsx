import type { Metadata } from "next";
import { ChevronDown, Keyboard, LifeBuoy, MessageCircle } from "lucide-react";
import { Card, PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Help & Support" };

const SHORTCUTS: [keys: string[], action: string][] = [
  [["/"], "Jump to search"],
  [["↑", "↓"], "Move through search suggestions"],
  [["Enter"], "Open the highlighted search"],
  [["Ctrl", "B"], "Collapse or expand the sidebar"],
  [["Esc"], "Close menus and search"],
];

const GUIDES: { q: string; a: string[] }[] = [
  {
    q: "How do I fulfil a new order?",
    a: [
      "Open Orders → To fulfil and pick the oldest order first.",
      "Check each piece, pack it, then press Mark packed (optional).",
      "Book the courier, press Ship order, choose the courier and enter the tracking number.",
      "When the courier confirms delivery, press Mark delivered.",
    ],
  },
  {
    q: "How does cash on delivery work?",
    a: [
      "COD orders show a “COD due” badge until they are delivered.",
      "Marking a COD order delivered records the cash as collected and changes it to “Paid”.",
      "A ₹49 handling fee is added to every COD order at checkout.",
    ],
  },
  {
    q: "A customer wants to cancel — what happens?",
    a: [
      "Open the order and press Cancel order, then confirm.",
      "The pieces go back into stock automatically.",
      "If the customer had paid online, the order shows “Refund due”. Refund them from the Razorpay dashboard, then press Mark refunded.",
    ],
  },
  {
    q: "How do I add a new product?",
    a: [
      "Go to Products → New product.",
      "Fill in the name, description, category and price.",
      "Paste image links (Unsplash or Cloudinary) — the first image is the cover.",
      "Add a variant for each colour and size with its stock, then press Create product.",
    ],
  },
  {
    q: "How do I take a product off the store?",
    a: [
      "Use the eye button on the Products list, or switch off “Live in store” in the editor.",
      "Hidden products disappear from the store but stay in past orders, and can be shown again anytime.",
    ],
  },
  {
    q: "What do the alerts in the bell mean?",
    a: [
      "Waiting to ship: confirmed orders that haven't been shipped yet, oldest first.",
      "Refunds due: online payments that need refunding after a cancellation.",
      "Low stock: variants with 3 or fewer pieces left.",
    ],
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHeader title="Help & Support" description="Shortcuts and quick guides for running the store." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card title="Guides" bodyClassName="">
            <ul className="divide-y divide-neutral-100">
              {GUIDES.map((g, i) => (
                <li key={g.q}>
                  <details className="group" open={i === 0}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-medium hover:bg-neutral-50">
                      {g.q}
                      <ChevronDown className="size-4 shrink-0 text-neutral-400 transition-transform duration-300 group-open:rotate-180" />
                    </summary>
                    <ol className="space-y-2 px-5 pb-5 text-sm text-neutral-600">
                      {g.a.map((step, n) => (
                        <li key={n} className="flex gap-3">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[0.65rem] font-semibold text-neutral-600">
                            {n + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </details>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card
            title={
              <span className="flex items-center gap-2">
                <Keyboard className="size-4 text-neutral-500" /> Keyboard shortcuts
              </span>
            }
            bodyClassName=""
          >
            <ul className="divide-y divide-neutral-100">
              {SHORTCUTS.map(([keys, action]) => (
                <li key={action} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                  <span className="text-neutral-600">{action}</span>
                  <span className="flex shrink-0 gap-1">
                    {keys.map((k) => (
                      <kbd
                        key={k}
                        className="min-w-6 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-center text-xs font-medium text-neutral-700 shadow-[inset_0_-1px_0_rgb(0_0_0/0.06)]"
                      >
                        {k}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card
            title={
              <span className="flex items-center gap-2">
                <LifeBuoy className="size-4 text-neutral-500" /> Need more help?
              </span>
            }
          >
            <p className="text-sm leading-relaxed text-neutral-600">
              For anything the guides don&rsquo;t cover — a bug, a payment question or a new feature —
              contact your website developer with the order number or a screenshot.
            </p>
            <p className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
              <MessageCircle className="size-4" /> Tip: order numbers look like BF10002.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
