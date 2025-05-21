import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
console.log("▶︎ CWD at runtime:", process.cwd());   // ← add this

export async function GET(req: Request) {
  // create the client only when the route is actually executed
  const prisma = new PrismaClient();

  const params = new URL(req.url).searchParams;
  const kw = params.get("keyword");
  const where = kw ? { keyword: kw } : {};

  const rows = await prisma.trial.findMany({ where });
  const enriched = rows.map(t => ({
    ...t,
    url: `https://clinicaltrials.gov/study/${t.nct}`,
  }));

  await prisma.$disconnect();
  return NextResponse.json(enriched);
}
