// Takes a full-page screenshot of every screen at 375, 768, 1024 and 1440px.
//
//   npm run screenshots                -> docs/baseline/
//   npm run screenshots -- docs/after  -> docs/after/
//
// Every shot runs on the same fixed state, so "before" and "after" shots
// can be compared:
// - the browser clock is frozen at the date the tests use (src/test/fixedDate.js)
// - localStorage holds the seed database (src/services/db.json), signed in as U1
// - compugrade-sidebar-minimized is set explicitly to the state a new user
//   gets at that width: "1" (minimized) at 768 and 1024, "0" otherwise.
//   (useSidebarState starts minimized at 1100px or less; phones use the
//   slide-in menu instead.)
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";
import { FIXED_NOW } from "../src/test/fixedDate.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.resolve(root, process.argv[2] ?? "docs/baseline");
const seedDb = await readFile(path.join(root, "src/services/db.json"), "utf8");

const WIDTHS = [375, 768, 1024, 1440];
const HEIGHT = 900;
const SIDEBAR_MINIMIZED = { 375: "0", 768: "1", 1024: "1", 1440: "0" };

// name: file name prefix. signedIn: false for the login page.
// action: optional, run after the page loads (for example, open a section).
const SCREENS = [
    { name: "login", url: "/", signedIn: false },
    { name: "dashboard", url: "/student/dashboard" },
    { name: "subjects", url: "/student/subject" },
    { name: "subject-detail-prelim", url: "/student/subject/C101?term=prelim" },
    { name: "subject-detail-midterm", url: "/student/subject/C101?term=midterm" },
    { name: "sandbox-prelim", url: "/student/subject/C101/sandbox?term=prelim" },
    { name: "grade-rules", url: "/student/rules" },
    { name: "rule-detail", url: "/student/rules/CR-1" },
    { name: "rule-new", url: "/student/rules/new" },
    ...["Profile", "Account", "Security", "Notifications", "Account Actions"].map((section) => ({
        name: `settings-${section.toLowerCase().replace(/\s+/g, "-")}`,
        url: "/settings",
        action: (page) => page.getByRole("button", { name: section, exact: true }).click(),
    })),
];

const server = await createServer({
    root,
    logLevel: "error",
    server: { port: 5199, strictPort: true },
});
await server.listen();
const baseUrl = "http://localhost:5199";

const browser = await chromium.launch();
await mkdir(outDir, { recursive: true });

try {
    for (const width of WIDTHS) {
        for (const screen of SCREENS) {
            const context = await browser.newContext({
                viewport: { width, height: HEIGHT },
                locale: "en-US",
                timezoneId: "Asia/Manila",
                reducedMotion: "reduce",
            });
            await context.addInitScript(
                ({ db, signedIn, minimized }) => {
                    localStorage.setItem("compugrade_db", db);
                    localStorage.setItem("compugrade-sidebar-minimized", minimized);
                    if (signedIn) localStorage.setItem("activeUserId", "U1");
                },
                {
                    db: seedDb,
                    signedIn: screen.signedIn !== false,
                    minimized: SIDEBAR_MINIMIZED[width],
                },
            );
            const page = await context.newPage();
            await page.clock.setFixedTime(FIXED_NOW);
            await page.goto(baseUrl + screen.url, { waitUntil: "networkidle" });
            await page.evaluate(() => document.fonts.ready);
            if (screen.action) await screen.action(page);
            await page.waitForTimeout(300);

            const file = path.join(outDir, `${screen.name}-${width}.png`);
            await page.screenshot({ path: file, fullPage: true, animations: "disabled" });
            console.log(path.relative(root, file));
            await context.close();
        }
    }
} finally {
    await browser.close();
    await server.close();
}
