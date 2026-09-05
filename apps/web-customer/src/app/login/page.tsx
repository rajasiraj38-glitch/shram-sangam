"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.assign("/");
  }

  return (
    <section className="login-stage relative -mx-4 -mt-4 min-h-screen overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />
      <div className="login-grid" />

      <div className="relative z-10 mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
        <div className="hidden text-white lg:block">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide backdrop-blur-md">
            <Sparkles size={14} className="text-amber-300" />
            THE PEOPLE WHO DO THE WORK OWN THE PLATFORM
          </div>
          <h1 className="max-w-xl text-5xl font-bold leading-[1.03] tracking-tight">
            A better way to get things <span className="text-amber-300">done.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-sky-100/80">
            Meet trusted local workers, book with confidence, and know your payment supports the community.
          </p>

          <div className="login-visual mt-10" aria-hidden="true">
            <div className="login-halo" />
            <div className="login-cube login-cube-large">
              <span /><span /><span /><span /><span /><span />
              <div className="login-cube-mark">S</div>
            </div>
            <div className="login-cube login-cube-small"><span /><span /><span /><span /><span /><span /></div>
            <div className="login-float-card login-float-card-top"><CheckCircle2 size={16} /> Verified local help</div>
            <div className="login-float-card login-float-card-bottom">90% <span>goes to workers</span></div>
          </div>
        </div>

        <div className="login-card mx-auto w-full max-w-md rounded-[2rem] p-6 sm:p-8">
          <div className="mb-7 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-slate-800">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-xl shadow-lg shadow-orange-500/30">🤝</span>
              <span>Shram<span className="text-orange-500">Sangam</span></span>
            </Link>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-[11px] font-bold text-teal-700">MEMBER ACCESS</span>
          </div>

          <div>
            <p className="text-sm font-semibold text-orange-600">Welcome back</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Sign in to your circle.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Your neighbourhood network is ready when you are.</p>
          </div>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Email address</span>
              <span className="login-input-wrap">
                <Mail size={18} />
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" />
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Password</span>
              <span className="login-input-wrap">
                <LockKeyhole size={18} />
                <input required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-slate-600"><input type="checkbox" className="accent-orange-500" /> Remember me</label>
              <button type="button" className="font-semibold text-orange-600 hover:text-orange-700">Forgot password?</button>
            </div>

            {message && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{message}</p>}

            <button disabled={loading} type="submit" className="login-submit group">
              {loading ? "Signing you in…" : "Enter Shram Sangam"}
              {!loading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          <div className="mt-7 flex items-center gap-3 text-xs leading-5 text-slate-500"><ShieldCheck size={17} className="shrink-0 text-teal-600" /> Your account is protected with secure, encrypted sign-in.</div>
          <p className="mt-5 text-center text-sm text-slate-500">New to the co-op? <Link href="/" className="font-semibold text-orange-600 hover:text-orange-700">Explore services first</Link></p>
        </div>
      </div>
    </section>
  );
}
