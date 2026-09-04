// src/hooks/use-demo-user.ts
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface DemoUser {
  id: string;
  full_name: string;
  role: string;
}

export function useDemoUser() {
  const [user, setUser] = useState<DemoUser | null>(null);

  useEffect(() => {
    // Read role cookie set by demo-login
    const name = document.cookie
      .split('; ')
      .find((r) => r.startsWith('demo_user_name='))
      ?.split('=')[1];
    const role = document.cookie
      .split('; ')
      .find((r) => r.startsWith('demo_user_role='))
      ?.split('=')[1];
    const id = document.cookie
      .split('; ')
      .find((r) => r.startsWith('demo_user_id='))
      ?.split('=')[1];

    if (name && role && id) {
      setUser({ id, full_name: decodeURIComponent(name), role });
    }
  }, []);

  async function login(role: 'customer' | 'worker_member') {
    const { profile } = await api.auth.demo(role);
    setUser(profile as DemoUser);
    return profile;
  }

  function logout() {
    document.cookie = 'demo_user_id=; Max-Age=0; path=/';
    document.cookie = 'demo_user_role=; Max-Age=0; path=/';
    document.cookie = 'demo_user_name=; Max-Age=0; path=/';
    setUser(null);
  }

  return { user, login, logout };
}
