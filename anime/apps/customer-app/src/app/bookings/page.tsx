// src/app/bookings/page.tsx — Customer booking list
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, Plus } from 'lucide-react';
import { Button, Card, StatusBadge, NavBar, useToast, Spinner, Badge } from '@shram-sangam/ui-kit';
import { formatDate, formatINR } from '@shram-sangam/ui-kit';
import { api } from '@/lib/api';
import { useDemoUser } from '@/hooks/use-demo-user';

export default function BookingsPage() {
  const router       = useRouter();
  const { user }     = useDemoUser();
  const { toast }    = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.bookings
      .list()
      .then(setBookings)
      .catch(() => toast('error', 'Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        appName="Shram Sangam"
        role={user?.role as 'customer' | undefined}
        userName={user?.full_name}
        items={[
          { label: 'Services', href: '/' },
          { label: 'My Bookings', href: '/bookings', active: true },
        ]}
      />

      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-bold text-gray-900">My Bookings</h1>
          <Button size="sm" onClick={() => router.push('/')}>
            <Plus className="h-4 w-4" /> New Booking
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" label="Loading…" /></div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No bookings yet</p>
            <Button className="mt-4" onClick={() => router.push('/')}>Browse services</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b: any) => (
              <Card
                key={b.id}
                hover
                onClick={() => router.push(`/bookings/${b.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{b.services?.title}</p>
                      <Badge variant="outline">{b.services?.category}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">{b.address}</p>
                    {b.worker && (
                      <p className="text-xs text-coop-green mt-1">
                        Worker: {b.worker.full_name}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <StatusBadge status={b.status} />
                    <span className="text-sm font-bold text-gray-900">{formatINR(b.total_amount)}</span>
                    <span className="text-xs text-gray-400">{formatDate(b.created_at)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
