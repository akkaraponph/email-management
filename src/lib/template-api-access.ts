import { NextResponse } from 'next/server';

// This demo has no identity provider or owner authorization. Keep every
// database-backed template endpoint unavailable until both are implemented.
export function templateApiUnavailable(): NextResponse | null {
  return NextResponse.json(
    { error: 'Template API is unavailable until authentication and authorization are configured.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
