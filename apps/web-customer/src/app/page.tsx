import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { Button, StatBox, CoopPoolCard } from "@shram-sangam/ui-kit";
import { createServerSupabase } from "@/lib/supabase-server";

// ─── Hero Stats (from live DB) ────────────────────────────────────────────────

async function getHeroStats() {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("coop_financials")
      .select("mutual_aid_reserve, operational_reserve, total_gigs_completed")
      .single();
    const { count: workerCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "worker_member")
      .eq("is_verified", true);

    return {
      mutualAidReserve: data?.mutual_aid_reserve ?? 105,
      operationalReserve: data?.operational_reserve ?? 245,
      totalGigs: data?.total_gigs_completed ?? 4,
      workerCount: workerCount ?? 7,
    };
  } catch {
    return { mutualAidReserve: 105, operationalReserve: 245, totalGigs: 4, workerCount: 7 };
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const stats = await getHeroStats();

  return (
    <div className="space-y-8 py-4">

      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 space-y-4">
        <div className="space-y-1">
          <p className="text-orange-200 text-sm font-medium uppercase tracking-wide">
            Worker-Owned Platform
          </p>
          <h1 className="text-2xl font-bold leading-tight">
            Trusted Home Services by Your Neighbours
          </h1>
          <p className="text-orange-100 text-sm leading-relaxed">
            Every rupee you pay is split fairly — 90% directly to the worker,
            3% to a community emergency fund.
          </p>
        </div>
        <Link href="/services">
          <Button
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-orange-600"
            rightIcon={<ArrowRight size={16} />}
          >
            Find a Service
          </Button>
        </Link>
      </section>

      {/* Live Co-op Stats */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Live Co-op Snapshot
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatBox
            label="Verified Workers"
            value={stats.workerCount}
            icon={<Users size={20} />}
            color="teal"
          />
          <StatBox
            label="Gigs Completed"
            value={stats.totalGigs}
            icon={<TrendingUp size={20} />}
            color="orange"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <CoopPoolCard
            title="Mutual Aid Pool"
            balance={stats.mutualAidReserve}
            subtitle="Worker emergency fund"
          />
          <CoopPoolCard
            title="Ops Reserve"
            balance={stats.operationalReserve}
            subtitle="Platform operations"
          />
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">
          Why Shram Sangam?
        </h2>
        {[
          {
            icon: <ShieldCheck size={20} className="text-teal-600" />,
            title: "Peer-Vouched Workers",
            desc: "Every worker is endorsed by 2 existing co-op members before joining.",
          },
          {
            icon: <span className="text-lg">💸</span>,
            title: "Transparent Pricing",
            desc: "You see exactly where each rupee goes — no hidden platform cuts.",
          },
          {
            icon: <Users size={20} className="text-orange-500" />,
            title: "Worker-Owned",
            desc: "Workers vote on platform rules, fees, and policies — not a distant VC.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="flex gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-card"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
              {item.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="text-center space-y-3 pb-4">
        <p className="text-sm text-slate-500">
          Already a member?
        </p>
        <Link href="/login">
          <Button variant="outline" fullWidth>
            Sign In to Your Account
          </Button>
        </Link>
      </section>
    </div>
  );
}
