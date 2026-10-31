import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { llmConfigured } from "@/lib/ai/client";

export const dynamic = "force-dynamic";

export async function GET() {
  let db = false;
  try { await prisma.$queryRaw`SELECT 1`; db = true; } catch { db = false; }
  return NextResponse.json({ ok: db, db, ai: llmConfigured() }, { status: db ? 200 : 503 });
}
