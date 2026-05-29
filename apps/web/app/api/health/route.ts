// Liveness probe — no internal state leaked.
import { NextResponse } from 'next/server'
export async function GET() { return NextResponse.json({ status: 'ok' }) }
