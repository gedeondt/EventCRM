// src/shared/trace.ts
import { randomUUID } from 'crypto';

export type TraceContext = {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  source?: string;
  userId?: string;
  timestamp: string;
};

export function createTraceContext(overrides: Partial<TraceContext> = {}): TraceContext {
  const trace: TraceContext = {
    traceId: overrides.traceId ?? randomUUID(),
    spanId: randomUUID(),
    timestamp: new Date().toISOString()
  };

  // Solo incluir si están definidos
  if (overrides.parentSpanId) trace.parentSpanId = overrides.parentSpanId;
  if (overrides.source) trace.source = overrides.source;
  if (overrides.userId) trace.userId = overrides.userId;

  return trace;
}

export function extractTraceContext(headers: Record<string, unknown>): TraceContext {
  return createTraceContext({
    traceId: headers['x-trace-id']?.toString(),
    spanId: headers['x-span-id']?.toString(),
    source: headers['x-source']?.toString() || 'api',
    userId: headers['x-user-id']?.toString()
  });
}