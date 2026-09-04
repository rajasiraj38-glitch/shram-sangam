// src/app/book/[serviceId]/page.tsx — Booking page with AI scoping
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, MapPin, Clock, AlertTriangle, Sparkles, ChevronLeft } from 'lucide-react';
import {
  Button, Card, Input, Textarea, FeeBreakdown, NavBar, useToast, Spinner, Badge,
} from '@shram-sangam/ui-kit';
import type { Service } from '@shram-sangam/shared-types';
import { api } from '@/lib/api';
import { useDemoUser } from '@/hooks/use-demo-user';
import { formatINR } from '@shram-sangam/ui-kit';

export default function BookPage({ params }: { params: { serviceId: string } }) {
  const router          = useRouter();
  const { user }        = useDemoUser();
  const { toast }       = useToast();
  const fileRef         = useRef<HTMLInputElement>(null);

  const [service, setService]       = useState<Service | null>(null);
  const [address, setAddress]       = useState('');
  const [notes, setNotes]           = useState('');
  const [problemDesc, setProblemDesc] = useState('');
  const [imageB64, setImageB64]     = useState<string | null>(null);
  const [price, setPrice]           = useState<number | null>(null);
  const [aiEstimate, setAiEstimate] = useState<{ standard_hours: number; difficulty_tier: string; notes?: string } | null>(null);
  const [scoping, setScoping]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]         = useState<Record<string, string>>({});

  useEffect(() => {
    api.services.list().then((list) => {
      const svc = list.find((s) => s.id === params.serviceId);
      if (svc) {
        setService(svc);
        setPrice(svc.base_rate);
      }
    });
  }, [params.serviceId]);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(',')[1] ?? '';
      setImageB64(b64);
    };
    reader.readAsDataURL(file);
  }

  async function handleAIScope() {
    if (!problemDesc || problemDesc.length < 10) {
      toast('warning', 'Describe the problem in at least 10 characters');
      return;
    }
    setScoping(true);
    try {
      const estimate = await api.scope.estimate(problemDesc, imageB64 ?? undefined, service?.category);
      setAiEstimate(estimate);
      setPrice(estimate.recommended_base_price);
      toast('success', 'AI estimate ready', `${estimate.difficulty_tier} job — ${estimate.standard_hours}h estimated`);
    } catch {
      toast('error', 'AI scoping unavailable', 'Using base rate instead');
    } finally {
      setScoping(false);
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!address || address.length < 10) e['address'] = 'Please enter a full address (min 10 characters)';
    if (!user) e['auth'] = 'Please log in to book a service';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleBook() {
    if (!validate() || !service || !price) return;
    setSubmitting(true);
    try {
      const booking = await api.bookings.create({
        service_id:   params.serviceId,
        address,
        notes,
        total_amount: price,
      });
      toast('success', 'Booking created!', 'Finding the best worker near you…');
      router.push(`/bookings/${booking.id}`);
    } catch (err) {
      toast('error', 'Booking failed', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" label="Loading service…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        appName="Shram Sangam"
        role={user?.role as 'customer' | undefined}
        userName={user?.full_name}
      />

      <main className="mx-auto max-w-lg px-4 py-6 space-y-4">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" /> Back to services
        </button>

        {/* Service header */}
        <Card>
          <h1 className="text-lg font-bold text-gray-900">{service.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{service.description}</p>
          <div className="mt-3 flex items-center gap-3">
            <Badge variant="info">{service.category}</Badge>
            <span className="text-sm font-semibold text-brand-600">
              From {formatINR(service.base_rate)}/{service.unit}
            </span>
          </div>
        </Card>

        {/* AI Scope */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-brand-500" />
            <h2 className="text-sm font-semibold text-gray-800">AI Job Scoper (optional)</h2>
            <Badge variant="purple">Smart pricing</Badge>
          </div>
          <Textarea
            label="Describe the problem"
            placeholder="e.g. Kitchen pipe burst near the sink, water leaking onto floor for 2 days…"
            value={problemDesc}
            onChange={(e) => setProblemDesc(e.target.value)}
            rows={3}
            hint="More detail = more accurate estimate"
          />

          <div className="mt-2 flex gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="h-3.5 w-3.5" />
              {imageB64 ? 'Photo attached ✓' : 'Add photo'}
            </Button>
            <Button
              size="sm"
              onClick={handleAIScope}
              loading={scoping}
              disabled={scoping || problemDesc.length < 10}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Get AI estimate
            </Button>
          </div>

          {aiEstimate && (
            <div className="mt-3 rounded-lg bg-green-50 border border-green-100 p-3 text-sm">
              <p className="font-medium text-green-800">
                {aiEstimate.difficulty_tier} job — ~{aiEstimate.standard_hours}h estimated
              </p>
              {aiEstimate.notes && <p className="text-green-700 mt-0.5 text-xs">{aiEstimate.notes}</p>}
            </div>
          )}
        </Card>

        {/* Address */}
        <Card>
          <Input
            label="Service address"
            placeholder="Flat/House no., Street, Area, City — PIN code"
            icon={MapPin}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            error={errors['address']}
          />
          <div className="mt-3">
            <Textarea
              label="Additional notes (optional)"
              placeholder="Gate code, landmark, preferred time…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </Card>

        {/* Schedule hint */}
        <Card padding="sm">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-brand-400" />
            <span>Available workers will be notified instantly. Typical response: &lt;15 min.</span>
          </div>
        </Card>

        {/* Fee breakdown */}
        {price && <FeeBreakdown total={price} />}

        {/* Auth warning */}
        {errors['auth'] && (
          <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {errors['auth']}
          </div>
        )}

        {/* Book button */}
        <Button
          fullWidth
          size="lg"
          onClick={handleBook}
          loading={submitting}
          disabled={submitting}
        >
          Book {service.title} — {price ? formatINR(price) : ''}
        </Button>
      </main>
    </div>
  );
}
