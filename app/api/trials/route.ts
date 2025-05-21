// app/api/trials/route.ts
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

/* ── copy db.sqlite into /tmp on first cold-start ─────────────── */
if (process.env.NODE_ENV === "production") {
  const tmpDB = "/tmp/db.sqlite";
  if (!fs.existsSync(tmpDB)) {
    const bundleDB = path.join(process.cwd(), "db.sqlite"); // bundled with function
    fs.copyFileSync(bundleDB, tmpDB);
    console.log("📦  copied db.sqlite → /tmp");
  }
  process.env.DATABASE_URL = "file:/tmp/db.sqlite";
}
/* ─────────────────────────────────────────────────────────────── */

export async function GET(req: Request) {
  const prisma = new PrismaClient();

  const kw = new URL(req.url).searchParams.get("keyword");
  const rows = await prisma.trial.findMany({
    where: kw ? { keyword: kw } : {},
  });

  return NextResponse.json(
    rows.map((t) => ({ ...t, url: `https://clinicaltrials.gov/study/${t.nct}` }))
  );
}
