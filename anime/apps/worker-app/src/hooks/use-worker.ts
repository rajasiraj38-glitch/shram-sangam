// src/hooks/use-worker.ts
'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface WorkerProfile {
  id: string;
  full_name: string;
  role: string;
  coop_shares: number;
  guild_category: string;
  is_available: boolean;
  is_verified: boolean;
}

export function useWorker() {
  const [worker, setWorker]       = useState<WorkerProfile | null>(null);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    // Read cookies set by demo-login
    const name = document.cookie.split('; ').find((r) => r.startsWith('demo_user_name='))?.split('=')[1];
    const role = document.cookie.split('; ').find((r) => r.startsWith('demo_user_role='))?.split('=')[1];
    const id   = document.cookie.split('; ').find((r) => r.startsWith('demo_user_id='))?.split('=')[1];
    if (name && role && id) {
      // Hydrate from API for full profile
      api.worker.profile().then((p) => {
        setWorker(p);
        setAvailable(p.is_available);
      }).catch(() => {
        setWorker({ id, full_name: decodeURIComponent(name), role, coop_shares: 1, guild_category: '', is_available: false, is_verified: false });
      });
    }
  }, []);

  async function login() {
    const { profile } = await api.auth.demo();
    setWorker(profile as WorkerProfile);
    return profile;
  }

  async function toggleAvailability() {
    const next = !available;
    setAvailable(next);
    try {
      await api.worker.setAvailability(next);
    } catch {
      setAvailable(!next); // revert on failure
    }
  }

  return { worker, available, login, toggleAvailability };
}
