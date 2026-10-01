import { LoginForm } from "./form";
export const metadata = {
  title: "Owner access | Sardaar G",
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
        <h1>Owner verification.</h1>
        <p>Access management functionality securely. No email or password required.</p>
        <LoginForm />
      </div>
    </main>
  );
}
