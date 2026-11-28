#!/usr/bin/env node
// Checks the Code Defense Guide (docs/defense/) against the code.
//
//   node .claude/skills/defense-update/scripts/check-links.mjs          check every chapter
//   node .claude/skills/defense-update/scripts/check-links.mjs --print  also print the first
//                                                                       line each link points to
//   node .claude/skills/defense-update/scripts/check-links.mjs <file>   check one chapter
//
// For every Markdown link in docs/defense/ it checks that:
// - the linked file exists (relative to the chapter);
// - a line anchor (#L12 or #L12-L20) stays inside the file and the range is in order.
// For every chapter (all files except README.md, glossary.md and ai-log.md) it checks that the
// header has "Last checked against:" with a commit git knows, and "Covers:" with paths that exist.
// Exit code 1 when anything is wrong, so the skill can stop.
//
// It cannot check that a sentence is true. --print shows the first line of each linked range, so
// the person or agent updating the guide can compare it with the claim next to the link.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const guideRoot = join(repoRoot, "docs", "defense");
const args = process.argv.slice(2);
const print = args.includes("--print");
const only = args.filter((arg) => !arg.startsWith("--")).map((arg) => resolve(arg));
const NOT_CHAPTERS = new Set(["README.md", "glossary.md", "ai-log.md"]);

function markdownFiles(folder) {
    return readdirSync(folder).flatMap((name) => {
        const path = join(folder, name);
        if (statSync(path).isDirectory()) return markdownFiles(path);
        return name.endsWith(".md") ? [path] : [];
    });
}

function lineCount(path) {
    return readFileSync(path, "utf8").split("\n").length;
}

function commitExists(sha) {
    try {
        execFileSync("git", ["cat-file", "-e", `${sha}^{commit}`], { cwd: repoRoot, stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
}

const problems = [];
let linkCount = 0;
const files = (only.length ? only : markdownFiles(guideRoot)).sort();

for (const file of files) {
    const shown = relative(repoRoot, file).replaceAll("\\", "/");
    const text = readFileSync(file, "utf8");
    const lines = text.split("\n");

    if (!NOT_CHAPTERS.has(file.split(/[\\/]/).pop())) {
        const checked = /^- Last checked against: `([0-9a-f]{7,40})`/m.exec(text);
        if (!checked) problems.push(`${shown}: no "- Last checked against: \`<sha>\`" line`);
        else if (!commitExists(checked[1]))
            problems.push(`${shown}: git does not know commit ${checked[1]}`);

        const covers = /^- Covers: (.+)$/m.exec(text);
        if (!covers) problems.push(`${shown}: no "- Covers:" line`);
        else {
            for (const [, path] of covers[1].matchAll(/`([^`]+)`/g)) {
                if (!existsSync(join(repoRoot, path)))
                    problems.push(`${shown}: Covers path does not exist: ${path}`);
            }
        }
    }

    // Links inside fenced code blocks and `inline code` are examples, not claims.
    let inFence = false;
    lines.forEach((rawLine, index) => {
        if (/^\s*```/.test(rawLine)) {
            inFence = !inFence;
            return;
        }
        if (inFence) return;
        const line = rawLine.replace(/`[^`]*`/g, "");
        for (const [, target] of line.matchAll(/\]\(([^)\s]+)\)/g)) {
            if (/^(https?:|mailto:|#)/.test(target)) continue;
            linkCount += 1;
            const [pathPart, anchor = ""] = target.split("#");
            const where = `${shown}:${index + 1}`;
            const linked = resolve(dirname(file), decodeURI(pathPart));
            if (!existsSync(linked)) {
                problems.push(`${where}: missing file ${target}`);
                continue;
            }
            const range = /^L(\d+)(?:-L(\d+))?$/.exec(anchor);
            if (!anchor) continue;
            if (!range) {
                if (statSync(linked).isFile() && !linked.endsWith(".md"))
                    problems.push(`${where}: unknown anchor #${anchor}`);
                continue;
            }
            const start = Number(range[1]);
            const end = Number(range[2] ?? range[1]);
            const total = lineCount(linked);
            if (start < 1 || end < start || end > total) {
                problems.push(`${where}: #${anchor} is outside ${pathPart} (${total} lines)`);
                continue;
            }
            if (print) {
                const first = readFileSync(linked, "utf8").split("\n")[start - 1].trim();
                console.log(`${where} -> ${relative(repoRoot, linked).replaceAll("\\", "/")}#${anchor}\n    ${first}`);
            }
        }
    });
}

if (problems.length) {
    console.error(`${problems.length} problem(s) in ${files.length} file(s):`);
    problems.forEach((problem) => console.error(`- ${problem}`));
    process.exit(1);
}
console.log(`OK: ${files.length} file(s), ${linkCount} link(s) checked.`);
