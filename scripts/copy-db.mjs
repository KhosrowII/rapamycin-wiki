import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");                 // repo root
const STANDALONE = path.join(ROOT, ".next", "standalone");       // lambda root

// 1. ensure standalone dir exists
fs.mkdirSync(STANDALONE, { recursive: true });

// 2. copy db.sqlite right into the lambda root
fs.copyFileSync(
  path.join(ROOT, "db.sqlite"),
  path.join(STANDALONE, "db.sqlite")
);

console.log("✅  copied db.sqlite into", STANDALONE);
