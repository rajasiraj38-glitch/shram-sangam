// src/app/jobs/[id]/page.tsx — Job lifecycle controls + OTP entry + SOS
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Phone, ChevronLeft, Shield, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { Button, Card, StatusBadge, FeeBreakdown, NavBar, useToast, Spinner, Input, Modal } from '@shram-sangam/ui-kit';
import { formatDateTime, formatINR } from '@shram-sangam/ui-kit';
import { api } from '@/lib/api';
import { useWorker } from '@/hooks/use-worker';
import { getSupabase } from '@/lib/supabase';

const NEXT_LABEL: Record<string, string> = {
  accepted:    'Mark Arrived',
  arrived:     'Start Job',
  in_progress: 'Complete Job',
};

const NEXT_STATUS: Record<string, string> = {
  accepted:    'arrived',
  arrived:     'in_progress',
  in_progress: 'completed',
};

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router       = useRouter();
  const { worker }   = useWorker();
  const { toast }    = useToast();
  const [job, setJob]         = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [otpInput, setOtp]    = useState('');
  const [otpOpen, setOtpOpen] = useState(false);
  const [sosWorking, setSos]  = useState(false);
  const [checkinWorking, setCheckin] = useState(false);

  useEffect(() => {
    api.jobs.active()
      .then((jobs) => {
        const found = jobs.find((j: any) => j.id === params.id);
        setJob(found ?? null);
      })
      .finally(() => setLoading(false));

    // Realtime updates
    const supabase = getSupabase();
    const channel  = supabase
      .channel(`booking:${params.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${params.id}` },
        (payload) => setJob((prev: any) => ({ ...prev, ...payload.new }))
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [params.id]);

  async function handleAdvanceStatus() {
    const nextStatus = NEXT_STATUS[job?.status];
    if (!nextStatus) return;
    if (nextStatus === 'completed') { setOtpOpen(true); return; }

    setWorking(true);
    try {
      const updated = await api.jobs.updateStatus(params.id, nextStatus);
      setJob((prev: any) => ({ ...prev, ...updated }));
      toast('success', `Status updated to ${nextStatus.replace(/_/g, ' ')}`);
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setWorking(false);
    }
  }

  async function handleComplete() {
    setWorking(true);
    try {
      const updated = await api.jobs.verifyOtp(params.id, otpInput);
      setJob((prev: any) => ({ ...prev, ...updated }));
      setOtpOpen(false);
      toast('success', 'Job completed!', 'Payment is being processed');
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setWorking(false);
    }
  }

  async function handleSOS() {
    setSos(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          await api.worker.sos(params.id, pos.coords.latitude, pos.coords.longitude);
          toast('warning', 'SOS sent!', 'Nearby members and emergency contacts have been alerted');
          setSos(false);
        }, async () => {
          await api.worker.sos(params.id, 0, 0);
          toast('warning', 'SOS sent (no GPS)', 'Alerting nearby members');
          setSos(false);
        });
      } else {
        await api.worker.sos(params.id, 0, 0);
        toast('warning', 'SOS sent');
        setSos(false);
      }
    } catch {
      toast('error', 'SOS failed — call 112 directly');
      setSos(false);
    }
  }

  async function handleCheckin() {
    setCheckin(true);
    try {
      await api.worker.checkin(params.id);
      toast('success', 'Check-in recorded', 'Your co-op knows you are safe');
    } catch {
      toast('error', 'Check-in failed');
    } finally {
      setCheckin(false);
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div>;
  if (!job) return (
    <div className="flex min-h-screen items-center justify-center text-gray-500">
      Job not found
    </div>
  );

  const nextLabel  = NEXT_LABEL[job.status];
  const isComplete = job.status === 'completed';

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar appName="Worker Dashboard" role="worker_member" userName={worker?.full_name} />

      <main className="mx-auto max-w-lg px-4 py-6 space-y-4">
        <button onClick={() => router.push('/')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Back to radar
        </button>

        {/* Job header */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">{job.services?.title}</h1>
              <p className="text-xs text-gray-500 mt-0.5">{job.services?.category}</p>
            </div>
            <StatusBadge status={job.status} />
          </div>
          <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span>{job.address}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">{formatDateTime(job.created_at)}</p>
        </Card>

        {/* Customer */}
        {job.customer && (
          <Card padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Customer</p>
                <p className="font-semibold text-sm">{job.customer.full_name}</p>
              </div>
              <a href={`tel:${job.customer.phone}`} className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-coop-blue hover:bg-blue-100">
                <Phone className="h-4 w-4" /> Call
              </a>
            </div>
          </Card>
        )}

        {/* OTP display (in_progress only) */}
        {job.status === 'in_progress' && (
          <Card className="border-green-200 bg-green-50">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-coop-green" />
              <p className="text-sm font-semibold text-coop-green">Completion OTP</p>
            </div>
            <p className="text-3xl font-mono font-bold text-coop-green tracking-widest text-center py-2">
              {job.completion_otp ?? '------'}
            </p>
            <p className="text-xs text-gray-500 text-center">Customer will show you this code when satisfied</p>
          </Card>
        )}

        {/* Payout */}
        <FeeBreakdown total={job.total_amount} />

        {/* Completed */}
        {isComplete && (
          <Card className="border-green-200 bg-green-50 text-center">
            <CheckCircle2 className="h-8 w-8 text-coop-green mx-auto mb-2" />
            <p className="font-bold text-coop-green">Job Completed!</p>
            <p className="text-sm text-gray-600 mt-1">{formatINR(job.worker_payout)} is being transferred to your account</p>
          </Card>
        )}

        {/* Action buttons */}
        {!isComplete && (
          <div className="space-y-2">
            {nextLabel && (
              <Button fullWidth size="lg" loading={working} onClick={handleAdvanceStatus}>
                {nextLabel}
              </Button>
            )}

            {/* Safety tools — only during active job */}
            {['arrived', 'in_progress'].includes(job.status) && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  fullWidth
                  loading={checkinWorking}
                  onClick={handleCheckin}
                >
                  <Shield className="h-4 w-4" /> I'm Safe (Check-in)
                </Button>
                <Button
                  variant="danger"
                  loading={sosWorking}
                  onClick={handleSOS}
                  className="flex-shrink-0"
                  aria-label="Send SOS emergency alert"
                >
                  <AlertOctagon className="h-4 w-4" />
                  SOS
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* OTP entry modal */}
      <Modal
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        title="Enter Completion OTP"
        description="Ask the customer for the 6-digit code shown on their app"
      >
        <div className="space-y-3">
          <Input
            label="6-digit OTP"
            placeholder="e.g. 482916"
            maxLength={6}
            value={otpInput}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            pattern="[0-9]*"
          />
          <Button fullWidth loading={working} disabled={otpInput.length !== 6} onClick={handleComplete}>
            Confirm & Complete Job
          </Button>
        </div>
      </Modal>
    </div>
  );
}
