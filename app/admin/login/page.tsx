import { supabaseConfig } from "@/lib/supabase/config";
import { LoginForm } from "./form";
export const metadata = {
  title: "Admin sign in | Sardaar G",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <main className="cms-login">
      <a href="/" className="text-link">
        ← Back to website
      </a>
      <div className="cms-login-card">
        <img
          src="/images/logo-mark.webp"
          width="70"
          height="70"
          alt="Sardaar G"
        />
        <p className="label">Owner access</p>
        <h1>Welcome back.</h1>
        <p>Sign in to manage your projects, website content and enquiries.</p>
        {supabaseConfig() ? (
          <LoginForm />
        ) : (
          <div className="form-message">
            Admin access is not configured yet. Follow the backend setup guide
            to connect Supabase and approve the owner account.
          </div>
        )}
      </div>
    </main>
  );
}
