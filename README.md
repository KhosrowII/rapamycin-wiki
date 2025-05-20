# Rapamycin Wiki & Longevity Trial Finder

A Next.js app that combines:

- **Longevity Leaderboard**  
  Aggregates DrugAge, NIH-ITP & Orba data with GRADE badges.
- **Clinical Trial Calendar**  
  Auto-refreshing calendar of recruiting trials for rapalogs, senolytics, NMN, etc.

## 🚀 Quickstart

```bash
git clone https://github.com/KhosrowII/rapamycin-wiki.git
cd rapamycin-wiki
npm install
# fetch initial trials
python scripts/fetch_trials.py
npm run dev
