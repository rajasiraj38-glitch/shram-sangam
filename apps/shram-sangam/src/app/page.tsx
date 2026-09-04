'use client';

import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  CircleDollarSign,
  HandHeart,
  Hammer,
  Home,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Vote,
  Wrench,
  Zap,
} from 'lucide-react';

type Mode = 'customer' | 'worker' | 'governance';
type ServiceCard = (typeof services)[number];

const services = [
  { title: 'Emergency pipe repair', category: 'Plumbing', price: 600, icon: Wrench, tone: 'bg-blue-50 text-blue-700' },
  { title: 'Fan and switch repair', category: 'Electrical', price: 400, icon: Zap, tone: 'bg-amber-50 text-amber-700' },
  { title: 'Elder companion visit', category: 'Caregiving', price: 350, icon: HandHeart, tone: 'bg-rose-50 text-rose-700' },
  { title: 'Home deep cleaning', category: 'Cleaning', price: 800, icon: Home, tone: 'bg-emerald-50 text-emerald-700' },
];

const proposals = [
  { title: 'Lower the cooperative fee from 7% to 5%', detail: 'Return more surplus to working members as the network grows.', yes: 18, no: 4, category: 'Fee adjustment' },
  { title: 'Create a tool replacement grant', detail: 'Use 20% of the mutual aid reserve for verified equipment damage.', yes: 13, no: 2, category: 'Mutual aid' },
];

function money(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

export default function ShramSangamApp() {
  const [mode, setMode] = useState<Mode>('customer');
  const [query, setQuery] = useState('');
  const [booked, setBooked] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [voted, setVoted] = useState<Record<number, 'yes' | 'no'>>({});

  const visibleServices = useMemo(
    () => services.filter((service) => `${service.title} ${service.category}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  function vote(index: number, decision: 'yes' | 'no') {
    setVoted((current) => ({ ...current, [index]: decision }));
  }

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-black/5 bg-cream/90 px-4 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Shram Sangam</p>
              <p className="mt-1 text-xs text-slate-500">Community-owned service network</p>
            </div>
            <button className="rounded-xl border border-black/10 p-2 lg:hidden" aria-label="Notifications"><Bell className="h-4 w-4" /></button>
          </div>
          <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-black/5 bg-white p-1" aria-label="App modes">
            <ModeButton active={mode === 'customer'} onClick={() => setMode('customer')} icon={<Search className="h-4 w-4" />} label="Customer" />
            <ModeButton active={mode === 'worker'} onClick={() => setMode('worker')} icon={<Hammer className="h-4 w-4" />} label="Worker member" />
            <ModeButton active={mode === 'governance'} onClick={() => setMode('governance')} icon={<Vote className="h-4 w-4" />} label="Co-op assembly" />
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <button className="rounded-xl p-2 text-slate-500 hover:bg-white" aria-label="Notifications"><Bell className="h-4 w-4" /></button>
            <div className="flex items-center gap-2 border-l border-black/10 pl-3 text-sm"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-saffron font-bold text-white">A</span><span className="font-semibold">Aarav Mehta</span></div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:px-8 lg:grid-cols-[1fr_280px]">
        <section>
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">{modeLabel(mode)}</p>
              <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-ink md:text-5xl">{modeHeading(mode)}</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">{modeDescription(mode)}</p>
            </div>
            <div className="rounded-2xl bg-leaf px-4 py-3 text-sm text-moss"><strong>90%</strong> goes directly to workers</div>
          </div>

          {mode === 'customer' && <CustomerMode query={query} setQuery={setQuery} services={visibleServices} booked={booked} onBook={setBooked} />}
          {mode === 'worker' && <WorkerMode online={online} setOnline={setOnline} />}
          {mode === 'governance' && <GovernanceMode voted={voted} onVote={vote} />}
        </section>

        <aside className="space-y-4">
          <div className="panel overflow-hidden bg-ink p-5 text-white">
            <p className="eyebrow text-leaf">One platform, three roles</p>
            <p className="mt-4 text-lg font-semibold">Switch modes without switching products.</p>
            <p className="mt-2 text-sm leading-6 text-white/60">Customers request help, members earn fairly, and the community governs the rules from the same workspace.</p>
            <div className="mt-6 flex items-center gap-2 text-xs text-leaf"><ShieldCheck className="h-4 w-4" /> Transparent by default</div>
          </div>
          <div className="panel p-5">
            <p className="eyebrow">Today in the co-op</p>
            <div className="mt-4 space-y-4">
              <Metric icon={<Users />} value="42" label="active members" />
              <Metric icon={<CircleDollarSign />} value={money(87300)} label="paid to workers" />
              <Metric icon={<HandHeart />} value={money(2065)} label="mutual aid reserve" />
            </div>
          </div>
          <div className="panel p-5">
            <div className="flex items-center justify-between"><p className="eyebrow">Live activity</p><span className="flex items-center gap-1 text-xs text-moss"><span className="h-2 w-2 animate-pulse rounded-full bg-moss" /> live</span></div>
            <p className="mt-3 text-sm text-slate-600">A member in Indiranagar just completed an electrical repair.</p>
            <button className="mt-4 flex items-center gap-1 text-xs font-bold text-saffron">View ledger <ArrowUpRight className="h-3 w-3" /></button>
          </div>
        </aside>
      </div>
    </main>
  );
}

function ModeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button onClick={onClick} className={`mode-button ${active ? 'mode-button-active' : 'mode-button-idle'}`}>{icon}<span>{label}</span></button>;
}

function CustomerMode({ query, setQuery, services, booked, onBook }: { query: string; setQuery: (value: string) => void; services: ServiceCard[]; booked: string | null; onBook: (title: string) => void }) {
  return <div className="space-y-5">
    <div className="panel flex items-center gap-3 px-4 py-3"><Search className="h-5 w-5 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search plumbing, electrical, care..." className="w-full bg-transparent text-sm outline-none" /></div>
    {booked && <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><Check className="h-5 w-5" /><span>Request sent for <strong>{booked}</strong>. A nearby member will respond shortly.</span></div>}
    <div className="grid gap-4 md:grid-cols-2">{services.map((service) => { const Icon = service.icon; return <div key={service.title} className="panel group p-5 transition hover:-translate-y-1"><div className="flex items-start justify-between"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${service.tone}`}><Icon className="h-5 w-5" /></div><span className="flex items-center gap-1 text-xs font-semibold text-moss"><MapPin className="h-3 w-3" /> 1.2 km</span></div><p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">{service.category}</p><h2 className="mt-1 text-lg font-bold text-ink">{service.title}</h2><div className="mt-5 flex items-end justify-between"><div><p className="text-xs text-slate-400">starting at</p><p className="text-xl font-bold text-saffron">{money(service.price)}<span className="text-xs font-medium text-slate-400"> / visit</span></p></div><button onClick={() => onBook(service.title)} className="flex items-center gap-1 rounded-xl bg-ink px-3 py-2 text-xs font-bold text-white transition hover:bg-moss">Request <ChevronRight className="h-3 w-3" /></button></div></div>; })}</div>
    <div className="panel grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center"><div><p className="eyebrow">Fair receipt</p><h2 className="mt-1 text-lg font-bold">Every rupee has a destination.</h2><p className="mt-1 text-sm text-slate-500">No hidden surge pricing. The split is agreed by the co-op.</p></div><div className="flex gap-5 text-center text-xs"><span><strong className="block text-lg text-moss">90%</strong>worker</span><span><strong className="block text-lg text-saffron">7%</strong>reserve</span><span><strong className="block text-lg text-rose-600">3%</strong>mutual aid</span></div></div>
  </div>;
}

function WorkerMode({ online, setOnline }: { online: boolean; setOnline: (value: boolean) => void }) {
  return <div className="space-y-5"><div className="panel flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"><div><p className="eyebrow">Dispatch status</p><h2 className="mt-1 text-xl font-bold">{online ? 'You are visible for work' : 'You are taking a break'}</h2><p className="mt-1 text-sm text-slate-500">Transparent rotation prioritizes distance and members with fewer jobs this month.</p></div><button onClick={() => setOnline(!online)} className={`rounded-xl px-4 py-3 text-sm font-bold ${online ? 'bg-moss text-white' : 'bg-slate-100 text-slate-600'}`}>{online ? 'Online' : 'Go online'}</button></div><div className="grid gap-4 sm:grid-cols-3"><Stat label="This month" value={money(18400)} icon={<Banknote />} /><Stat label="Jobs completed" value="27" icon={<Hammer />} /><Stat label="Patronage points" value="1,840" icon={<Sparkles />} /></div><div className="panel p-5"><div className="flex items-center justify-between"><div><p className="eyebrow">Nearby opportunity</p><h2 className="mt-1 text-lg font-bold">Ceiling fan and switch repair</h2></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-moss">2.4 km away</span></div><div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-black/5 pt-4"><span className="flex items-center gap-2 text-sm text-slate-500"><MapPin className="h-4 w-4" /> HSR Layout · Today, 4:30 PM</span><span className="text-lg font-bold text-moss">{money(360)} payout</span><button className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white">Review job</button></div></div></div>;
}

function GovernanceMode({ voted, onVote }: { voted: Record<number, 'yes' | 'no'>; onVote: (index: number, decision: 'yes' | 'no') => void }) {
  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><Stat label="Active proposals" value="2" icon={<Vote />} /><Stat label="Quorum reached" value="76%" icon={<BarChart3 />} /><Stat label="Reserve balance" value={money(2065)} icon={<CircleDollarSign />} /></div>{proposals.map((proposal, index) => { const total = proposal.yes + proposal.no; return <div key={proposal.title} className="panel p-5"><div className="flex flex-col justify-between gap-3 md:flex-row"><div><span className="rounded-full bg-leaf px-2.5 py-1 text-[11px] font-bold text-moss">{proposal.category}</span><h2 className="mt-3 text-lg font-bold">{proposal.title}</h2><p className="mt-1 text-sm text-slate-500">{proposal.detail}</p></div><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Vote className="h-5 w-5" /></div></div><div className="mt-5"><div className="mb-2 flex justify-between text-xs font-semibold text-slate-500"><span>{Math.round((proposal.yes / total) * 100)}% yes</span><span>{total} votes</span></div><div className="h-2 overflow-hidden rounded-full bg-rose-100"><div className="h-full rounded-full bg-moss" style={{ width: `${(proposal.yes / total) * 100}%` }} /></div></div><div className="mt-5 flex flex-wrap gap-2"><button onClick={() => onVote(index, 'yes')} className={`rounded-xl px-4 py-2 text-sm font-bold ${voted[index] === 'yes' ? 'bg-moss text-white' : 'bg-leaf text-moss'}`}>{voted[index] === 'yes' ? 'Voted yes' : 'Vote yes'}</button><button onClick={() => onVote(index, 'no')} className={`rounded-xl px-4 py-2 text-sm font-bold ${voted[index] === 'no' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700'}`}>{voted[index] === 'no' ? 'Voted no' : 'Vote no'}</button></div></div>; })}</div>;
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="panel p-4"><div className="flex items-center justify-between text-moss"><span className="h-5 w-5">{icon}</span><BarChart3 className="h-4 w-4 text-slate-300" /></div><p className="mt-4 text-2xl font-bold text-ink">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>; }
function Metric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-leaf text-moss">{icon}</span><div><p className="font-bold text-ink">{value}</p><p className="text-xs text-slate-500">{label}</p></div></div>; }
function modeLabel(mode: Mode) { return mode === 'customer' ? 'Customer workspace' : mode === 'worker' ? 'Worker member workspace' : 'Cooperative assembly'; }
function modeHeading(mode: Mode) { return mode === 'customer' ? 'Trusted help, close to home.' : mode === 'worker' ? 'Work on your terms, together.' : 'The people doing the work set the rules.'; }
function modeDescription(mode: Mode) { return mode === 'customer' ? 'Find a verified local service and see exactly where your payment goes before you request help.' : mode === 'worker' ? 'See fair dispatch opportunities, your earnings, and the ownership you are building with every completed job.' : 'Vote on fees, mutual aid, and platform rules with one member, one vote.'; }
