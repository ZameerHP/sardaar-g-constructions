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
          alt="Sardaar G Construction Ltd."
        />
        <p className="label">Owner access</p>
        <h1>Welcome back.</h1>
        <p>Sign in to manage your projects, website content and enquiries.</p>
        <LoginForm />
      </div>
    </main>
  );
}
