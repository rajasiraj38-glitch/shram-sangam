'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface GovUser { id: string; full_name: string; role: string; }

export function useGovUser() {
  const [user, setUser] = useState<GovUser | null>(null);

  useEffect(() => {
    const name = document.cookie.split('; ').find(r => r.startsWith('demo_user_name='))?.split('=')[1];
    const role = document.cookie.split('; ').find(r => r.startsWith('demo_user_role='))?.split('=')[1];
    const id   = document.cookie.split('; ').find(r => r.startsWith('demo_user_id='))?.split('=')[1];
    if (name && role && id) setUser({ id, full_name: decodeURIComponent(name), role });
  }, []);

  async function login(role = 'worker_member') {
    const { profile } = await api.auth.demo(role);
    setUser(profile as GovUser);
    return profile;
  }

  return { user, login };
}
