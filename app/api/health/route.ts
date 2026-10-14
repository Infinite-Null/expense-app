import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      {
        status: 'error',
        database: 'unconfigured',
        error: 'Supabase environment variables are missing',
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    )
  }

  try {
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { data, error } = await supabase
      .from('health')
      .select('*')
      .limit(1)
      .maybeSingle()

    const latencyMs = Date.now() - startTime

    if (error) {
      return NextResponse.json(
        {
          status: 'error',
          database: 'error',
          error: error.message,
          latency_ms: latencyMs,
          timestamp: new Date().toISOString(),
        },
        {
          status: 503,
          headers: { 'Cache-Control': 'no-store, max-age=0' },
        }
      )
    }

    if (!data) {
      return NextResponse.json(
        {
          status: 'degraded',
          database: 'connected_empty',
          message: 'Health table exists but contains no records',
          latency_ms: latencyMs,
          timestamp: new Date().toISOString(),
        },
        {
          status: 200,
          headers: { 'Cache-Control': 'no-store, max-age=0' },
        }
      )
    }

    return NextResponse.json(
      {
        status: 'ok',
        database: 'connected',
        data,
        latency_ms: latencyMs,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    )
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown database error'
    return NextResponse.json(
      {
        status: 'error',
        database: 'unreachable',
        error: errorMessage,
        latency_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    )
  }
}
