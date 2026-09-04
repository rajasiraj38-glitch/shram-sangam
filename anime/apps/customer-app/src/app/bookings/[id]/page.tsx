// src/app/bookings/[id]/page.tsx — Booking detail / tracking
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Phone, ChevronLeft, AlertTriangle, CheckCircle2, Clock, Shield } from 'lucide-react';
import {
  Button, Card, CardTitle, StatusBadge, FeeBreakdown, NavBar, useToast, Spinner, Input, Modal,
} from '@shram-sangam/ui-kit';
import { formatDateTime, formatINR } from '@shram-sangam/ui-kit';
import { api } from '@/lib/api';
import { useDemoUser } from '@/hooks/use-demo-user';
import { getSupabase } from '@/lib/supabase';
import type { Booking } from '@shram-sangam/shared-types';

const STATUS_STEPS = ['requested', 'accepted', 'arrived', 'in_progress', 'completed'];

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const router       = useRouter();
  const { user }     = useDemoUser();
  const { toast }    = useToast();

  const [booking, setBooking]        = useState<any>(null);
  const [loading, setLoading]        = useState(true);
  const [otp, setOtp]                = useState('');
  const [disputeReason, setDispute]  = useState('');
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [working, setWorking]        = useState(false);

  const fetchBooking = useCallback(async () => {
    try {
      const b = await api.bookings.get(params.id);
      setBooking(b);
    } catch {
      toast('error', 'Could not load booking');
    } finally {
      setLoading(false);
    }
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchBooking();

    // Subscribe to real-time status updates
    const supabase = getSupabase();
    const channel  = supabase
      .channel(`booking:${params.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${params.id}` },
        (payload) => {
          setBooking((prev: any) => ({ ...prev, ...payload.new }));
          toast('info', 'Booking updated', `Status: ${payload.new['status']}`);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCancelBooking() {
    setWorking(true);
    try {
      await api.bookings.updateStatus(params.id, 'cancelled');
      toast('success', 'Booking cancelled');
      setBooking((b: any) => ({ ...b, status: 'cancelled' }));
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setWorking(false);
    }
  }

  async function handleFileDispute() {
    if (disputeReason.length < 20) {
      toast('warning', 'Please describe the issue in at least 20 characters');
      return;
    }
    setWorking(true);
    try {
      await api.bookings.fileDispute(params.id, disputeReason);
      toast('success', 'Dispute filed', 'A peer jury will review within 24 hours');
      setDisputeOpen(false);
      fetchBooking();
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" label="Loading booking…" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Booking not found</p>
      </div>
    );
  }

  const stepIndex    = STATUS_STEPS.indexOf(booking.status);
  const isActive     = !['completed', 'cancelled', 'disputed'].includes(booking.status);
  const canCancel    = ['requested', 'accepted'].includes(booking.status);
  const canDispute   = ['in_progress', 'completed'].includes(booking.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        appName="Shram Sangam"
        role={user?.role as 'customer' | undefined}
        userName={user?.full_name}
      />

      <main className="mx-auto max-w-lg px-4 py-6 space-y-4">
        <button
          onClick={() => router.push('/bookings')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" /> My bookings
        </button>

        {/* Status card */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{booking.services?.title ?? 'Service'}</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">{booking.services?.category}</p>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          {/* Progress stepper */}
          {!['cancelled', 'disputed'].includes(booking.status) && (
            <div className="mt-4 flex items-center gap-1">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-1 flex-1">
                  <div className={`h-2 flex-1 rounded-full transition-all ${
                    i <= stepIndex ? 'bg-brand-500' : 'bg-gray-200'
                  }`} />
                  {i === STATUS_STEPS.length - 1 && (
                    <CheckCircle2 className={`h-4 w-4 ${stepIndex === STATUS_STEPS.length - 1 ? 'text-coop-green' : 'text-gray-300'}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{booking.address}</span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <Clock className="h-4 w-4 text-gray-400" />
            {formatDateTime(booking.created_at)}
          </div>
        </Card>

        {/* Worker details */}
        {booking.worker && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Your Worker</p>
                <p className="font-semibold text-gray-900 mt-0.5">{booking.worker.full_name}</p>
                <p className="text-xs text-gray-500">{booking.worker.guild_category}</p>
              </div>
              <a
                href={`tel:${booking.worker.phone}`}
                className="flex items-center gap-1.5 rounded-lg bg-coop-green/10 px-3 py-2 text-sm font-medium text-coop-green hover:bg-coop-green/20"
              >
                <Phone className="h-4 w-4" /> Call
              </a>
            </div>
          </Card>
        )}

        {/* OTP completion */}
        {booking.status === 'in_progress' && booking.completion_otp && (
          <Card className="border-brand-200 bg-brand-50">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-brand-500" />
              <p className="text-sm font-semibold text-brand-700">Job Completion OTP</p>
            </div>
            <p className="text-3xl font-mono font-bold text-brand-600 tracking-widest text-center py-2">
              {booking.completion_otp}
            </p>
            <p className="text-xs text-brand-600 text-center">Share this code with the worker when the job is done</p>
          </Card>
        )}

        {/* Fee breakdown */}
        <FeeBreakdown total={booking.total_amount} />

        {/* Actions */}
        <div className="space-y-2">
          {canCancel && (
            <Button
              variant="danger"
              fullWidth
              loading={working}
              onClick={handleCancelBooking}
            >
              Cancel Booking
            </Button>
          )}
          {canDispute && (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setDisputeOpen(true)}
            >
              <AlertTriangle className="h-4 w-4" />
              File a Dispute
            </Button>
          )}
        </div>
      </main>

      {/* Dispute modal */}
      <Modal
        open={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        title="File a Dispute"
        description="Describe the issue. A randomly selected peer jury of 3 co-op members will review and decide."
      >
        <div className="space-y-3">
          <textarea
            className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            rows={4}
            placeholder="e.g. The pipe is still leaking after the repair, and the worker is not responding…"
            value={disputeReason}
            onChange={(e) => setDispute(e.target.value)}
          />
          <Button fullWidth loading={working} onClick={handleFileDispute}>
            Submit Dispute
          </Button>
        </div>
      </Modal>
    </div>
  );
}
