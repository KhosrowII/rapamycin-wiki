import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  // quick metric in the server log
  console.log("▶️  Prisma sees trials:", await prisma.trial.count());

  const params = new URL(req.url).searchParams;
  const kw = params.get("keyword");
  const where = kw ? { keyword: kw } : {};

  // fetch rows and add a deep-link URL
  const trials = await prisma.trial.findMany({ where });
  const enriched = trials.map(t => ({
    ...t,
    url: `https://clinicaltrials.gov/study/${t.nct}`,
  }));

  return NextResponse.json(enriched);
}
