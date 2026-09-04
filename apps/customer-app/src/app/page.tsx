// src/app/page.tsx — Home / service catalog
'use client';

import { useEffect, useState } from 'react';
import { Search, MapPin, Zap, Wrench, Heart, Home, Hammer, Settings, Paintbrush, Users, ChevronRight } from 'lucide-react';
import { Button, Card, StatBox, FeeBreakdown, NavBar, useToast, Spinner } from '@shram-sangam/ui-kit';
import type { Service } from '@shram-sangam/shared-types';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useDemoUser } from '@/hooks/use-demo-user';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Plumbing:           Wrench,
  Electrical:         Zap,
  Carpentry:          Hammer,
  Caregiving:         Heart,
  Cleaning:           Home,
  'Appliance Repair': Settings,
  Painting:           Paintbrush,
  Other:              Settings,
};

const CATEGORIES = ['All', 'Plumbing', 'Electrical', 'Carpentry', 'Caregiving', 'Cleaning', 'Appliance Repair', 'Painting'];

export default function HomePage() {
  const router           = useRouter();
  const { user, login }  = useDemoUser();
  const { toast }        = useToast();
  const [services, setServices]    = useState<Service[]>([]);
  const [loading, setLoading]      = useState(true);
  const [category, setCategory]    = useState('All');
  const [search, setSearch]        = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    api.services
      .list(category === 'All' ? undefined : category)
      .then(setServices)
      .catch(() => toast('error', 'Failed to load services'))
      .finally(() => setLoading(false));
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = services.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleDemoLogin() {
    try {
      await login('customer');
      toast('success', 'Logged in as demo customer');
    } catch {
      toast('error', 'Login failed');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        appName="Shram Sangam"
        role={user?.role as 'customer' | undefined}
        userName={user?.full_name}
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen((o) => !o)}
        items={[
          { label: 'Services', href: '/', active: true },
          { label: 'My Bookings', href: '/bookings' },
        ]}
        rightSlot={
          !user ? (
            <Button size="sm" onClick={handleDemoLogin}>Demo Login</Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => router.push('/bookings')}>
              My Bookings
            </Button>
          )
        }
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-500 to-brand-700 text-white px-4 py-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-200 mb-2">
            Worker-Owned • Transparent • Fair
          </p>
          <h1 className="text-3xl font-bold mb-2">Find Trusted Help in Your Neighbourhood</h1>
          <p className="text-brand-100 text-sm mb-6">
            90% of every payment goes directly to the worker. No hidden cuts.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search plumber, electrician, caregiver…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl pl-9 pr-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Search services"
            />
          </div>
        </div>
      </section>

      {/* Cooperative stats strip */}
      <section className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="mx-auto max-w-4xl grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <p className="text-lg font-bold text-brand-500">97</p>
            <p className="text-gray-500">Jobs Completed</p>
          </div>
          <div>
            <p className="text-lg font-bold text-coop-green">₹87,300</p>
            <p className="text-gray-500">Paid to Workers</p>
          </div>
          <div>
            <p className="text-lg font-bold text-coop-purple">₹2,065</p>
            <p className="text-gray-500">Mutual Aid Pool</p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-brand-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Service grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" label="Loading services…" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No services found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((service) => {
              const Icon = CATEGORY_ICONS[service.category] ?? Settings;
              return (
                <Card
                  key={service.id}
                  hover
                  onClick={() => router.push(`/book/${service.id}`)}
                  className="group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 group-hover:bg-brand-100 transition-colors">
                      <Icon className="h-5 w-5 text-brand-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm">{service.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{service.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-brand-600">
                          ₹{service.base_rate}/{service.unit}
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-coop-green font-medium">
                          <Users className="h-3 w-3" />
                          90% to worker
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 self-center flex-shrink-0" />
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Cooperative explainer */}
        <section className="mt-10">
          <h2 className="text-base font-semibold text-gray-800 mb-3">See Where Your Money Goes</h2>
          <FeeBreakdown total={1000} />
        </section>
      </main>
    </div>
  );
}
