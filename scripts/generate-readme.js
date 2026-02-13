const fs = require("fs");
const path = require("path");

// ---------- helpers ----------
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf-8"));

const listDir = (dir, depth = 1, prefix = "") => {
  if (!fs.existsSync(dir) || depth === 0) return "";
  return fs.readdirSync(dir)
    .filter(name => !name.startsWith("."))
    .map(name => {
      const full = path.join(dir, name);
      const isDir = fs.statSync(full).isDirectory();
      return (
        `${prefix}- ${name}\n` +
        (isDir ? listDir(full, depth - 1, prefix + "  ") : "")
      );
    })
    .join("");
};

// ---------- read data ----------
const rootPkg = readJSON("package.json");

const frontendPkgPath = "frontend/package.json";
const frontendPkg = fs.existsSync(frontendPkgPath)
  ? readJSON(frontendPkgPath)
  : null;

// ---------- generate README ----------
const readme = `
# ${rootPkg.name}

${rootPkg.description || "Trip planning & voting web application"}

---

## Tech Stack
- Frontend: React + TypeScript
- Backend: Node.js / API
- State & UI: Custom components
- Tooling: Vite, Git, npm

---

## Project Structure
\`\`\`
my-tripmate-wepapp
├─ frontend
${listDir("frontend/src", 2, "│  ")}
├─ backend
${listDir("backend", 2, "│  ")}
\`\`\`

---

## Frontend Scripts
\`\`\`bash
${frontendPkg ? Object.entries(frontendPkg.scripts)
  .map(([k, v]) => `npm run ${k} # ${v}`)
  .join("\n") : "No frontend package.json found"}
\`\`\`

---

## Setup

### Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

### Backend
\`\`\`bash
cd backend
npm install
npm start
\`\`\`

---

## Main Features
- Trip voting system
- Member progress tracking
- Budget & place selection
- Summary & analytics
- Owner / member role separation

---

## Author
${rootPkg.author || "My TripMate Team"}
`;

fs.writeFileSync("README.md", readme.trim());
console.log("✅ README.md generated successfully");
