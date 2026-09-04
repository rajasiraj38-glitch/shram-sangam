// src/app/page.tsx — Worker radar: incoming jobs + active jobs
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Briefcase, MapPin, Phone, ChevronRight, Radio, AlertOctagon } from 'lucide-react';
import { Button, Card, StatusBadge, NavBar, useToast, Spinner, Countdown } from '@shram-sangam/ui-kit';
import { formatINR } from '@shram-sangam/ui-kit';
import { api } from '@/lib/api';
import { useWorker } from '@/hooks/use-worker';
import { getSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import type { IncomingJobPayload } from '@shram-sangam/shared-types';

export default function RadarPage() {
  const router                = useRouter();
  const { worker, available, login, toggleAvailability } = useWorker();
  const { toast }             = useToast();
  const [activeJobs, setActiveJobs]     = useState<any[]>([]);
  const [incomingJob, setIncomingJob]   = useState<IncomingJobPayload | null>(null);
  const [loading, setLoading]           = useState(true);
  const [accepting, setAccepting]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const jobs = await api.jobs.active();
      setActiveJobs(jobs);
    } catch {/* silent */}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Supabase realtime — listen for INCOMING_JOB dispatched to this worker
  useEffect(() => {
    if (!worker?.id) return;
    const supabase = getSupabase();
    const channel  = supabase
      .channel(`worker:${worker.id}`)
      .on('broadcast', { event: 'INCOMING_JOB' }, ({ payload }) => {
        setIncomingJob(payload as IncomingJobPayload);
        // Play audio cue if available
        try { new Audio('/sounds/ping.mp3').play(); } catch {/* ignore */}
        toast('info', 'New job request!', `${payload.service_title} — ${payload.distance_km.toFixed(1)}km away`);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [worker?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDemoLogin() {
    try { await login(); toast('success', 'Logged in as demo worker'); }
    catch { toast('error', 'Login failed'); }
  }

  async function handleAccept() {
    if (!incomingJob) return;
    setAccepting(true);
    try {
      await api.jobs.accept(incomingJob.booking_id);
      toast('success', 'Job accepted!', 'Head to the customer location');
      setIncomingJob(null);
      fetchJobs();
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setAccepting(false);
    }
  }

  async function handleDecline() {
    if (!incomingJob) return;
    try { await api.jobs.decline(incomingJob.booking_id); }
    catch {/* silent */}
    setIncomingJob(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        appName="Worker Dashboard"
        role="worker_member"
        userName={worker?.full_name}
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen((o) => !o)}
        items={[
          { label: 'Radar',    href: '/',        active: true, icon: Radio },
          { label: 'Earnings', href: '/earnings', icon: Briefcase },
          { label: 'Mutual Aid', href: '/mutual-aid', icon: AlertOctagon },
        ]}
        rightSlot={
          !worker
            ? <Button size="sm" onClick={handleDemoLogin}>Demo Login</Button>
            : (
              <button
                onClick={toggleAvailability}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  available
                    ? 'bg-coop-green text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
                aria-label={available ? 'Go offline' : 'Go online'}
              >
                <span className={`h-2 w-2 rounded-full ${available ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
                {available ? 'Online' : 'Offline'}
              </button>
            )
        }
      />

      <main className="mx-auto max-w-lg px-4 py-6 space-y-4">

        {/* Incoming job offer — full-screen priority card */}
        {incomingJob && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-md border-2 border-brand-400 bg-white" padding="lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-brand-500 animate-ping" />
                  <span className="text-sm font-bold text-brand-600 uppercase tracking-wide">New Job Request</span>
                </div>
                <Countdown
                  expiresAt={new Date(Date.now() + (incomingJob.expires_in_seconds ?? 90) * 1000).toISOString()}
                  onExpire={() => { setIncomingJob(null); toast('warning', 'Job offer expired'); }}
                />
              </div>

              <h2 className="text-lg font-bold text-gray-900">{incomingJob.service_title}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{incomingJob.category}</p>

              <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span>{incomingJob.address}</span>
              </div>
              <p className="mt-1 text-xs text-gray-400">{incomingJob.distance_km.toFixed(1)} km away</p>

              <div className="mt-3 rounded-lg bg-green-50 p-3 text-center">
                <p className="text-xs text-gray-500">Your payout for this job</p>
                <p className="text-2xl font-bold text-coop-green">{formatINR(incomingJob.worker_payout)}</p>
                <p className="text-xs text-gray-400">{formatINR(incomingJob.total_amount)} total — 90% to you</p>
              </div>

              <div className="mt-4 flex gap-3">
                <Button
                  variant="danger"
                  fullWidth
                  onClick={handleDecline}
                >
                  Decline
                </Button>
                <Button
                  fullWidth
                  size="lg"
                  loading={accepting}
                  onClick={handleAccept}
                >
                  Accept Job
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Availability status */}
        {worker && (
          <Card className={available ? 'border-green-200 bg-green-50' : 'border-gray-200'} padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {available ? '🟢 You are online and visible' : '⚫ You are offline'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {available ? 'New jobs will appear here automatically' : 'Toggle online to start receiving jobs'}
                </p>
              </div>
              <button
                onClick={toggleAvailability}
                className={`relative h-6 w-11 rounded-full transition-colors ${available ? 'bg-coop-green' : 'bg-gray-300'}`}
                role="switch"
                aria-checked={available}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${available ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </Card>
        )}

        {/* Active jobs */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Active Jobs</h2>
          {loading ? (
            <div className="flex justify-center py-10"><Spinner label="Loading jobs…" /></div>
          ) : activeJobs.length === 0 ? (
            <Card padding="lg" className="text-center text-gray-400">
              <Radio className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="font-medium text-sm">No active jobs</p>
              <p className="text-xs mt-1">Go online and wait for the next request</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeJobs.map((job: any) => (
                <Card
                  key={job.id}
                  hover
                  onClick={() => router.push(`/jobs/${job.id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{job.services?.title}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{job.address}</span>
                      </div>
                      {job.customer && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                          <Phone className="h-3 w-3" />
                          {job.customer.full_name}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <StatusBadge status={job.status} />
                      <span className="text-sm font-bold text-coop-green">{formatINR(job.worker_payout)}</span>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
