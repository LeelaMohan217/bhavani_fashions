"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { changePassword, updateProfile } from "@/lib/admin/actions";
import type { Admin } from "@/lib/admin/types";
import { Card, btn, inputCls } from "./ui";

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** Your own details and password. */
export function ProfileForm({ admin }: { admin: Admin }) {
  return (
    <div className="grid max-w-3xl gap-6">
      <Details admin={admin} />
      <Password />
    </div>
  );
}

function Details({ admin }: { admin: Admin }) {
  const router = useRouter();
  const [saved, setSaved] = useState({ name: admin.name, email: admin.email });
  const [form, setForm] = useState(saved);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const dirty = form.name !== saved.name || form.email !== saved.email;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await updateProfile({ name: form.name.trim(), email: form.email.trim() });
      if (!res.ok) {
        setError(res.fieldErrors ? Object.values(res.fieldErrors)[0] : res.error);
        return;
      }
      const next = { name: res.admin.name, email: res.admin.email };
      setSaved(next);
      setForm(next);
      setDone(true);
      router.refresh(); // the top bar shows the new name
    });
  };

  return (
    <Card title="Your details">
      <form onSubmit={save} className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="relative">
            <span className="flex size-14 items-center justify-center rounded-full bg-neutral-900 text-base font-semibold text-white">
              {initials(form.name || admin.name)}
            </span>
            <span aria-hidden className="absolute bottom-0.5 right-0.5 size-3 rounded-full bg-emerald-400 ring-2 ring-white" />
          </span>
          <span>
            <span className="block text-sm font-medium">{saved.name}</span>
            <span className="mt-1 inline-block rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-200">
              Admin
            </span>
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-neutral-800">Name</label>
            <input id="name" value={form.name} onChange={(e) => (setForm((f) => ({ ...f, name: e.target.value })), setDone(false))} className={inputCls} />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-800">Email</label>
            <input id="email" type="email" value={form.email} onChange={(e) => (setForm((f) => ({ ...f, email: e.target.value })), setDone(false))} className={inputCls} />
            <p className="mt-1.5 text-xs text-neutral-500">You sign in with this email.</p>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center justify-end gap-3">
          {done && !dirty && (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
              <Check className="size-4" /> Saved
            </span>
          )}
          <button type="submit" disabled={pending || !dirty} className={`${btn.base} ${btn.primary}`}>
            {pending && <LoaderCircle className="size-4 animate-spin" />} Save details
          </button>
        </div>
      </form>
    </Card>
  );
}

function Password() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setDone(false);
    setError(null);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword.length < 10) return setError("Use at least 10 characters for the new password.");
    if (form.newPassword !== form.confirm) return setError("The new passwords don't match.");
    start(async () => {
      const res = await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      if (!res.ok) {
        setError(res.fieldErrors ? Object.values(res.fieldErrors)[0] : res.error);
        return;
      }
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      setDone(true);
    });
  };

  const type = show ? "text" : "password";
  return (
    <Card
      title="Password"
      action={
        <button type="button" onClick={() => setShow((s) => !s)} className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900">
          {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />} {show ? "Hide" : "Show"}
        </button>
      }
    >
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-neutral-800">Current password</label>
            <input id="currentPassword" type={type} autoComplete="current-password" value={form.currentPassword} onChange={set("currentPassword")} className={inputCls} />
          </div>
          <div>
            <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-neutral-800">New password</label>
            <input id="newPassword" type={type} autoComplete="new-password" value={form.newPassword} onChange={set("newPassword")} placeholder="At least 10 characters" className={inputCls} />
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-neutral-800">Confirm new password</label>
            <input id="confirm" type={type} autoComplete="new-password" value={form.confirm} onChange={set("confirm")} className={inputCls} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">Changing it signs you out on your other devices.</p>
          <div className="flex items-center gap-3">
            {done && (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
                <Check className="size-4" /> Password changed
              </span>
            )}
            <button
              type="submit"
              disabled={pending || !form.currentPassword || !form.newPassword || !form.confirm}
              className={`${btn.base} ${btn.primary}`}
            >
              {pending && <LoaderCircle className="size-4 animate-spin" />} Change password
            </button>
          </div>
        </div>
      </form>
    </Card>
  );
}
