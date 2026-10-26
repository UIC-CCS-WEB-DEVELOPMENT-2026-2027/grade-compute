// src/utils/sandbox.js
// Target Grade Sandbox math. Pure functions only (no React, no localStorage).
//
// Question it answers: "What percentage do I need on each remaining task
// this term to reach my target?"
//
// - Works with any grading rule: every deepest criterion of the rule
//   (getRuleLeaves) is planned separately, using effectiveMultipliers.
// - A task's score follows the 3-State rule (grades-guide.txt): officialScore
//   if present, otherwise studentReportedScore. Scored tasks are fixed.
// - Remaining tasks ("slots") are the criterion's tasks without a score plus
//   the upcoming tasks the student expects (not saved as tasks).
// - The student may give a criterion an expected percentage (e.g. "I expect
//   80% on the exam"). Its slots then use that value. All other slots use
//   one shared value R, the required percentage this file solves for.
// - Each criterion's grade is the average of its task percentages, like
//   grades.js. Criteria with no tasks and no upcoming tasks are left out and
//   the rest are renormalized, like the "grade so far".
//
// Settings live on the student record, per term:
//   targetGradeSandbox.terms[term] = {
//     sandboxDesiredFinalGrade: 90,
//     criteria: { [leafId]: { upcoming: 2, expected: null } },
//   }
import { toTaskList } from "./grades.js";
import { getRuleLeaves, TOTAL_SHARE } from "./rules.js";

export const DEFAULT_TARGET = 90;
export const MAX_UPCOMING = 20;

function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

// Round up to 2 decimals, so scoring the shown value always reaches the target.
export function roundUp2(value) {
    return Math.ceil(value * 100 - 1e-9) / 100;
}

// A task's percentage under the 3-State rule, or null if it has no score yet.
export function taskPercent(task) {
    const maxScore = toNumber(task?.maxScore);
    if (maxScore === null || maxScore <= 0) return null;
    const score = toNumber(task?.officialScore) ?? toNumber(task?.studentReportedScore);
    return score === null ? null : (score / maxScore) * 100;
}

// The sandbox target for a term: the sandbox's own target if the student
// set one, otherwise the subject's target for that term, otherwise 90.
export function getSandboxTarget(studentRecord, termKey) {
    const config = studentRecord?.targetGradeSandbox ?? {};
    const termConfig = config.terms?.[termKey] ?? {};
    const target = [
        termConfig.sandboxDesiredFinalGrade,
        termConfig.desiredFinalGrade,
        config.sandboxDesiredFinalGrade,
        config.desiredFinalGrade,
    ].map(toNumber).find((value) => value !== null && value >= 0 && value <= 100);
    return target ?? DEFAULT_TARGET;
}

// Upcoming count and expected % for one criterion of a term.
// Older sandbox data saved upcomingAT, upcomingTLA and expectedExamScore;
// those still apply to criteria with the ids AT, TLA and Exam.
export function getCriterionSettings(studentRecord, termKey, criterionId, taskCount) {
    const termConfig = studentRecord?.targetGradeSandbox?.terms?.[termKey] ?? {};
    const saved = termConfig.criteria?.[criterionId] ?? {};
    const legacyUpcoming = { AT: termConfig.upcomingAT, TLA: termConfig.upcomingTLA }[criterionId];
    const legacyExpected = criterionId === "Exam" ? termConfig.expectedExamScore : undefined;

    const upcoming = toNumber(saved.upcoming) ?? toNumber(legacyUpcoming);
    const expected = "expected" in saved ? toNumber(saved.expected) : toNumber(legacyExpected);
    return {
        // A criterion with no tasks yet starts with one upcoming task, so it
        // counts toward the plan (for example, the term exam).
        upcoming: clamp(Math.round(upcoming ?? (taskCount === 0 ? 1 : 0)), 0, MAX_UPCOMING),
        expected: expected === null ? null : clamp(expected, 0, 100),
    };
}

// The full plan for one term.
// Returns {
//   target, status, required, requiredRaw, projected, best, worst,
//   requiredSlots, criteria: [...]
// }
// status:
//   "required"   - score `required`% on each remaining task to reach the target
//   "impossible" - even 100% on every remaining task stays below the target
//   "reached"    - the target is reached even with 0% on the remaining tasks
//   "complete"   - no task uses the required value (all scored or expected)
//   "empty"      - nothing to plan yet (no tasks and no upcoming tasks)
export function getSandboxPlan(studentRecord, rule, termKey, target = getSandboxTarget(studentRecord, termKey)) {
    const termGrades = studentRecord?.grades?.[termKey] ?? {};

    const criteria = getRuleLeaves(rule).map((leaf) => {
        const tasks = toTaskList(termGrades[leaf.id]).map((task) => ({ task, percent: taskPercent(task) }));
        const scored = tasks.filter((item) => item.percent !== null);
        const settings = getCriterionSettings(studentRecord, termKey, leaf.id, tasks.length);
        const openTasks = tasks.length - scored.length;
        const slots = openTasks + settings.upcoming;
        const total = scored.length + slots;
        const weight = leaf.effectiveShare / TOTAL_SHARE;
        const scoredSum = scored.reduce((sum, item) => sum + item.percent, 0);
        const usesRequired = slots > 0 && settings.expected === null;

        return {
            id: leaf.id,
            name: leaf.name,
            path: leaf.path,
            weight,
            tasks,
            scoredCount: scored.length,
            scoredAverage: scored.length ? scoredSum / scored.length : null,
            openTasks,
            upcoming: settings.upcoming,
            expected: settings.expected,
            slots,
            usesRequired,
            counted: total > 0 && weight > 0,
            // grade = fixedPart + requiredPart * R (both over this criterion's tasks)
            fixedPart: total ? (scoredSum + (usesRequired ? 0 : slots * (settings.expected ?? 0))) / total : 0,
            requiredPart: total && usesRequired ? slots / total : 0,
        };
    });

    const counted = criteria.filter((criterion) => criterion.counted);
    const totalWeight = counted.reduce((sum, criterion) => sum + criterion.weight, 0);
    const base = { target, criteria, required: null, requiredRaw: null, requiredSlots: 0 };
    if (!totalWeight) {
        return { ...base, status: "empty", projected: null, best: null, worst: null };
    }

    // Term grade as a function of R: A + B * R.
    const A = counted.reduce((sum, c) => sum + c.weight * c.fixedPart, 0) / totalWeight;
    const B = counted.reduce((sum, c) => sum + c.weight * c.requiredPart, 0) / totalWeight;
    const gradeAt = (r) => A + B * r;
    const requiredSlots = counted
        .filter((criterion) => criterion.usesRequired)
        .reduce((sum, criterion) => sum + criterion.slots, 0);
    const shared = { ...base, requiredSlots, best: gradeAt(100), worst: gradeAt(0) };

    if (B <= 0) {
        return { ...shared, status: "complete", projected: A };
    }

    const requiredRaw = (target - A) / B;
    if (requiredRaw > 100 + 1e-9) {
        return { ...shared, status: "impossible", requiredRaw, projected: gradeAt(100) };
    }
    if (requiredRaw <= 0) {
        return { ...shared, status: "reached", requiredRaw, required: 0, projected: gradeAt(0) };
    }
    const required = Math.min(100, roundUp2(requiredRaw));
    return { ...shared, status: "required", requiredRaw, required, projected: gradeAt(required) };
}

// The raw score needed on a task of the given maxScore for `percent`.
export function requiredScore(percent, maxScore) {
    const max = toNumber(maxScore);
    if (percent === null || max === null || max <= 0) return null;
    return Math.min(max, roundUp2((percent * max) / 100));
}

// Saves sandbox settings for one term onto a student record (returns a copy).
// updates: { sandboxDesiredFinalGrade?, criteria?: { [leafId]: { upcoming?, expected? } } }
export function updateSandboxSettings(studentRecord, termKey, updates) {
    const config = studentRecord?.targetGradeSandbox ?? {};
    const termConfig = config.terms?.[termKey] ?? {};
    const criteria = { ...(termConfig.criteria ?? {}) };
    Object.entries(updates.criteria ?? {}).forEach(([id, values]) => {
        criteria[id] = { ...(criteria[id] ?? {}), ...values };
    });
    return {
        ...studentRecord,
        targetGradeSandbox: {
            ...config,
            terms: {
                ...(config.terms ?? {}),
                [termKey]: { ...termConfig, ...updates, criteria },
            },
        },
    };
}
