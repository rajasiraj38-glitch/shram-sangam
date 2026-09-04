// src/app/api/services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiSuccess, apiError } from '@shram-sangam/shared-types';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
);

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category');

  let query = supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('title');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(apiError('Failed to fetch services', 'DB_ERROR'), { status: 500 });
  }

  return NextResponse.json(apiSuccess(data));
}
