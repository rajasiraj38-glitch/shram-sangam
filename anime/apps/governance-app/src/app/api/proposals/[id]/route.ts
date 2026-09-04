import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiSuccess, apiError } from '@shram-sangam/shared-types';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
);

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !data) return NextResponse.json(apiError('Not found', 'NOT_FOUND'), { status: 404 });
  return NextResponse.json(apiSuccess(data));
}
