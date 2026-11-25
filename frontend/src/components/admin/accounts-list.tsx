"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, KeyRound, LoaderCircle, Plus, Trash2, TriangleAlert, X } from "lucide-react";
import { createAdmin, deleteAdmin, resetAdminPassword, setAdminActive } from "@/lib/admin/actions";
import type { AdminAccount } from "@/lib/admin/types";
import { useFeedback } from "@/components/ui/feedback";
import { Badge, Card, btn, inputCls, rowAction, td, th } from "./ui";

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const timeAgo = (iso: string | null) => {
  if (!iso) return "Never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  return days < 30 ? `${days} day${days === 1 ? "" : "s"} ago` : dateFmt.format(new Date(iso));
};

/** Admin accounts: add, turn access on/off, reset password, delete. Everyone is an Admin. */
export function AccountsList({ accounts: initial }: { accounts: AdminAccount[] }) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const { confirm, toast } = useFeedback();

  /** Short results show as a toast; ones with instructions stay as a note above the table */
  const run = (action: () => Promise<{ ok: boolean; error?: string }>, done: string, after?: () => void, asToast = false) => {
    setNotice(null);
    start(async () => {
      const res = await action();
      if (!res.ok) {
        setNotice({ tone: "error", text: res.error ?? "Couldn't save. Please try again." });
        return;
      }
      after?.();
      if (asToast) toast(done);
      else setNotice({ tone: "ok", text: done });
      router.refresh();
    });
  };

  const toggle = async (a: AdminAccount) => {
    if (a.isActive) {
      const ok = await confirm({
        title: `Turn off sign-in for ${a.name}?`,
        body: "They'll be signed out everywhere and can't sign in until you turn it back on.",
        confirmLabel: "Turn off",
        danger: true,
      });
      if (!ok) return;
    }
    run(
      () => setAdminActive(a.id, !a.isActive),
      a.isActive ? `${a.name} can no longer sign in` : `${a.name} can sign in again`,
      () => setAccounts((list) => list.map((x) => (x.id === a.id ? { ...x, isActive: !a.isActive } : x))),
      true,
    );
  };

  const remove = async (a: AdminAccount) => {
    const ok = await confirm({
      title: `Remove ${a.name}?`,
      body: `${a.email} will lose access to the admin for good. This can't be undone.`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    run(() => deleteAdmin(a.id), `${a.name} was removed`, () => setAccounts((list) => list.filter((x) => x.id !== a.id)), true);
  };

  return (
    <div className="space-y-3">
      {notice && (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          className={`flex items-start gap-2 rounded-md border px-4 py-3 text-sm ${
            notice.tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {notice.tone === "error" ? <TriangleAlert className="mt-0.5 size-4 shrink-0" /> : <Check className="mt-0.5 size-4 shrink-0" />}
          {notice.text}
        </div>
      )}

      {adding && (
        <AddAdminForm
          onCancel={() => setAdding(false)}
          onCreated={(a) => {
            setAccounts((list) => [...list, a]);
            setAdding(false);
            setNotice({ tone: "ok", text: `${a.name} can now sign in with ${a.email}. Share the password with them privately.` });
            router.refresh();
          }}
        />
      )}

      <Card
        bodyClassName=""
        title={
          <span>
            Admins <span className="font-normal text-neutral-500">· {accounts.length}</span>
          </span>
        }
        action={
          !adding && (
            <button type="button" onClick={() => setAdding(true)} className={`${btn.base} ${btn.primary} !h-8 !px-3 text-xs`}>
              <Plus className="size-3.5" /> Add admin
            </button>
          )
        }
      >
        <div className={`relative overflow-x-auto overflow-y-hidden ${pending ? "opacity-70" : ""}`}>
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className={th}>Admin</th>
                <th className={th}>Can sign in</th>
                <th className={th}>Last sign-in</th>
                <th className={th}>Added</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <Fragment key={a.id}>
                  <tr className="border-b border-neutral-100 last:border-b-0">
                    <td className={td}>
                      <span className="flex items-center gap-3">
                        <span
                          className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                            a.isActive ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400"
                          }`}
                        >
                          {initials(a.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 font-medium">
                            {a.name}
                            {a.isYou && <Badge tone="violet">You</Badge>}
                          </span>
                          <span className="block truncate text-xs text-neutral-500">{a.email}</span>
                        </span>
                      </span>
                    </td>
                    <td className={td}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={a.isActive}
                        aria-label={a.isActive ? `Turn off sign-in for ${a.name}` : `Let ${a.name} sign in`}
                        disabled={pending || a.isYou}
                        title={a.isYou ? "You can't turn off your own access" : undefined}
                        onClick={() => toggle(a)}
                        className="inline-flex items-center gap-2 disabled:cursor-not-allowed"
                      >
                        <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${a.isActive ? "bg-neutral-900" : "bg-neutral-200"} ${a.isYou ? "opacity-50" : ""}`}>
                          <span className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${a.isActive ? "translate-x-[1.125rem]" : "translate-x-0.5"}`} />
                        </span>
                        <span className={`text-xs ${a.isActive ? "text-neutral-700" : "text-neutral-400"}`}>{a.isActive ? "Active" : "Turned off"}</span>
                      </button>
                    </td>
                    <td className={`${td} text-neutral-600`}>{timeAgo(a.lastLoginAt)}</td>
                    <td className={`${td} text-neutral-600`}>{dateFmt.format(new Date(a.createdAt))}</td>
                    <td className={`${td} text-right`}>
                        <span className="inline-flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => setResetting(resetting === a.id ? null : a.id)}
                            aria-label={`Reset password for ${a.name}`}
                            title="Reset password"
                            className={rowAction}
                          >
                            <KeyRound className="size-4" />
                          </button>
                          <button
                            type="button"
                            disabled={pending || a.isYou}
                            onClick={() => remove(a)}
                            aria-label={`Remove ${a.name}`}
                            title={a.isYou ? "You can't delete your own account" : "Remove admin"}
                            className={`${rowAction} hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </span>
                    </td>
                  </tr>
                  {resetting === a.id && (
                    <tr className="border-b border-neutral-100 bg-neutral-50/70">
                      <td colSpan={5} className="px-4 py-3">
                        <ResetPassword
                          admin={a}
                          pending={pending}
                          onCancel={() => setResetting(null)}
                          onSave={(password) =>
                            run(
                              () => resetAdminPassword(a.id, password),
                              a.isYou
                                ? "Your password was changed. Other devices were signed out."
                                : `${a.name}'s password was changed and they were signed out everywhere. Share the new password privately.`,
                              () => setResetting(null),
                            )
                          }
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="px-1 text-xs text-neutral-500">
        Every admin can manage orders, products and settings. There must always be at least one active admin.
      </p>
    </div>
  );
}

function PasswordField({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        autoComplete="new-password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputCls} pr-9`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-neutral-400 hover:text-neutral-700"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function ResetPassword({
  admin,
  pending,
  onCancel,
  onSave,
}: {
  admin: AdminAccount;
  pending: boolean;
  onCancel: () => void;
  onSave: (password: string) => void;
}) {
  const [password, setPassword] = useState("");
  const short = password.length > 0 && password.length < 10;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (password.length >= 10) onSave(password);
      }}
      className="flex flex-wrap items-start gap-2"
    >
      <div className="w-full sm:w-72">
        <label htmlFor={`pw-${admin.id}`} className="sr-only">
          New password for {admin.name}
        </label>
        <PasswordField id={`pw-${admin.id}`} value={password} onChange={setPassword} placeholder={`New password for ${admin.name.split(" ")[0]}`} />
        <p className={`mt-1 text-xs ${short ? "text-red-600" : "text-neutral-500"}`}>At least 10 characters. Signs them out everywhere.</p>
      </div>
      <button type="submit" disabled={pending || password.length < 10} className={`${btn.base} ${btn.primary}`}>
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <KeyRound className="size-4" />} Set password
      </button>
      <button type="button" onClick={onCancel} className={`${btn.base} ${btn.ghost}`}>
        Cancel
      </button>
    </form>
  );
}

function AddAdminForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (a: AdminAccount) => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof form) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (form.name.trim().length < 2) local.name = "Enter their name";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) local.email = "Enter a valid email address";
    if (form.password.length < 10) local.password = "Use at least 10 characters";
    if (Object.values(local).some(Boolean)) {
      setErrors(local);
      return;
    }
    setError(null);
    start(async () => {
      const res = await createAdmin({ ...form, email: form.email.trim() });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        if (!res.fieldErrors) setError(res.error);
        return;
      }
      onCreated(res.admin);
    });
  };

  return (
    <Card
      title="Add admin"
      action={
        <button type="button" onClick={onCancel} aria-label="Close" className={rowAction}>
          <X className="size-4" />
        </button>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="new-name" className="mb-1.5 block text-sm font-medium text-neutral-800">Name</label>
            <input id="new-name" value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="Full name" className={inputCls} aria-invalid={Boolean(errors.name) || undefined} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="new-email" className="mb-1.5 block text-sm font-medium text-neutral-800">Email</label>
            <input id="new-email" type="email" autoComplete="off" value={form.email} onChange={(e) => set("email")(e.target.value)} placeholder="name@example.com" className={inputCls} aria-invalid={Boolean(errors.email) || undefined} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-neutral-800">Password</label>
            <PasswordField id="new-password" value={form.password} onChange={set("password")} placeholder="At least 10 characters" />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">They sign in at /admin with this email and password.</p>
          <button type="submit" disabled={pending} className={`${btn.base} ${btn.primary}`}>
            {pending && <LoaderCircle className="size-4 animate-spin" />} Add admin
          </button>
        </div>
      </form>
    </Card>
  );
}
