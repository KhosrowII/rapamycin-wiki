// scripts/copy-db.mjs
import fs from "fs";
import path from "path";

// .next/standalone is the directory Vercel zips into the serverless function
const destDir = path.resolve(".next/standalone");
const src = path.resolve("db.sqlite");
const dest = path.join(destDir, "db.sqlite");

fs.copyFileSync(src, dest);
console.log("✅ copied db.sqlite into .next/standalone");
