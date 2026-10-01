import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/backend/auth";
import { HttpError } from "@/lib/backend/http";
import { AdminPanel } from "./panel";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Owner dashboard | Sardaar G",
  robots: { index: false, follow: false },
};
export default async function Page() {
  let email = "";
  try {
    const { user } = await requireAdmin();
    email = user.email || "";
  } catch (e) {
    if (e instanceof HttpError && e.status === 403) {
      return (
        <main className="cms-login">
          <h1>Access restricted.</h1>
          <p>This account is not an approved administrator.</p>
          <a className="text-link" href="/admin/login">
            Sign in with another account
          </a>
        </main>
      );
    }
    redirect("/admin/login");
  }
  return <AdminPanel email={email} />;
}
