"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";

export default function Login() {
  const { ready, user, signIn, signInGoogle, signInEmail, mode, loadError } = useStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false); const [busy, setBusy] = useState(false);
  useEffect(() => { if (ready && user) router.replace("/app"); }, [ready, user, router]);

  return (
    <div className="light wave-bg relative grid min-h-screen text-fg place-items-center overflow-hidden px-5">
      <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-64 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden>
        <path fill="#b5b0a5" fillOpacity=".3" d="M0 160c160-70 300-70 460 0s300 70 460 0 380-60 520 0v160H0z" />
        <path fill="#0a0a0a" fillOpacity=".9" d="M0 230c150-40 280-40 430 0s300 40 450 0 400-30 560 0v90H0z" />
      </svg>
      <div className="card relative w-full max-w-md animate-rise p-8 shadow-xl">
        <Link href="/"><Logo /></Link>
        <h1 className="mt-8 text-3xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">Sign in to pick up where your last session left off.</p>
        {loadError && <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-xs text-coral" role="alert">{loadError}</p>}
        {mode === "supabase" ? (
          <div className="mt-7 space-y-4">
            <button type="button" className="btn-ghost w-full !py-3" onClick={signInGoogle}><GoogleIcon /> Continue with Google</button>
            <div className="flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
            {sent ? (
              <p className="rounded-xl bg-accent/10 p-4 text-sm">Check <strong>{email}</strong> for your sign-in link. You can close this tab.</p>
            ) : (
              <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setSent(await signInEmail(email.trim())); setBusy(false); }}>
                <label htmlFor="email" className="label">Email a sign-in link</label>
                <input id="email" type="email" required className="input" placeholder="you@school.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
                <button className="btn-primary w-full !py-3" disabled={busy}>{busy ? "Sending…" : "Send link"}</button>
              </form>
            )}
          </div>
        ) : (
          <form className="mt-7 space-y-4" onSubmit={(e) => { e.preventDefault(); signIn(name); router.push("/app"); }}>
            <div>
              <label htmlFor="name" className="label">Your name</label>
              <input id="name" className="input" placeholder="e.g. Ananya" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
            </div>
            <button type="submit" className="btn-ghost w-full !py-3"><GoogleIcon /> Continue with Google</button>
            <p className="rounded-lg bg-accent/10 px-3 py-2 text-xs text-muted"><strong className="text-accent">Demo mode:</strong> Supabase isn&rsquo;t configured. Your data stays in this browser.</p>
          </form>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" className="grayscale" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.5-4.2 7-10.3 7-17.6z" /><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" /><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" /></svg>
  );
}
