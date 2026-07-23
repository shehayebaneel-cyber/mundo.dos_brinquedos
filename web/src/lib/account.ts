// Very simple customer identity: name + WhatsApp phone, stored locally.
// No email, no password — the phone identifies the customer.
export type Account = { name: string; phone: string };
const KEY = "mundo_account";

export function digits(s: string) { return (s || "").replace(/\D/g, ""); }

export function getAccount(): Account | null {
  try {
    const a = JSON.parse(localStorage.getItem(KEY) || "null");
    return a && a.name && digits(a.phone).length >= 10 ? a : null;
  } catch { return null; }
}
export function setAccount(a: Account) { localStorage.setItem(KEY, JSON.stringify(a)); }
export function clearAccount() { localStorage.removeItem(KEY); }
