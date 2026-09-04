// src/app/api/scope/route.ts — proxy to ai-scope-service
import { NextRequest, NextResponse } from 'next/server';
import { AIScopeRequestSchema, apiSuccess, apiError } from '@shram-sangam/shared-types';

const AI_SCOPE_URL = process.env['AI_SCOPE_SERVICE_URL'] ?? 'http://localhost:8000';

export async function POST(req: NextRequest) {
  const body   = await req.json();
  const parsed = AIScopeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(apiError('Invalid request', 'VALIDATION_ERROR'), { status: 422 });
  }

  try {
    const upstream = await fetch(`${AI_SCOPE_URL}/scope`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(parsed.data),
      signal:  AbortSignal.timeout(15_000),
    });

    if (!upstream.ok) {
      throw new Error(`AI service returned ${upstream.status}`);
    }

    const estimate = await upstream.json();
    return NextResponse.json(apiSuccess(estimate));
  } catch (err) {
    console.error('[api/scope]', err);
    return NextResponse.json(
      apiError('AI scope service unavailable — using default estimate', 'SCOPE_UNAVAILABLE'),
      { status: 503 },
    );
  }
}
