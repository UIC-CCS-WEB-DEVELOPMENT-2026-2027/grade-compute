// src/utils/history.js
// Grade history charts: how a subject's term grade changed as each scored
// task came in, plus the sandbox plan drawn after it.
// Pure functions only (no React, no localStorage).
//
// - A task counts once it has a score. Its score follows the 3-State rule:
//   officialScore if present, otherwise studentReportedScore
//   (grades-guide.txt), so official scores take precedence.
// - Tasks are ordered by when they were first scored (studentScoredAt /
//   officialScoredAt), falling back to when they were added (createdAt, or
//   the time in "CUSTOM-<ms>" ids). Tasks with no time (seed data) come
//   first, in rule order.
// - The y value after each step is the term grade so far, calculated by
//   grades.js with only the tasks up to that step.
import { calculateUnofficialGrade, toTaskList } from "./grades.js";
import { getRuleLeaves } from "./rules.js";
import { getSandboxPlan } from "./sandbox.js";
import { getClassSemesterId, PASSING_GRADE } from "./subjects.js";

export { PASSING_GRADE };

const TERM_LABELS = { prelim: "Prelim", midterm: "Midterm", finals: "Finals" };
const DEFAULT_TARGET = 90;

function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function toTime(value) {
    const stamp = Date.parse(value ?? "");
    return Number.isFinite(stamp) ? stamp : null;
}

// When a task entered the graph (its first score), in ms, or null if unknown.
export function scoreTime(task) {
    const scored = [toTime(task?.studentScoredAt), toTime(task?.officialScoredAt)]
        .filter((time) => time !== null);
    if (scored.length) return Math.min(...scored);
    const created = toTime(task?.createdAt);
    if (created !== null) return created;
    const fromId = Number(String(task?.id ?? "").match(/^CUSTOM-(\d{10,})$/)?.[1]);
    return Number.isFinite(fromId) ? fromId : null;
}

function taskLabel(task, criterionName, index) {
    const title = task.title || `${criterionName} ${task.sequenceNumber ?? index + 1}`;
    return task.description ? `${title} - ${task.description}` : title;
}

// The subject's target for a term (the one set on Subject Detail).
export function getTermTarget(studentRecord, termKey) {
    const config = studentRecord?.targetGradeSandbox ?? {};
    const target = [config.terms?.[termKey]?.desiredFinalGrade, config.desiredFinalGrade]
        .map(toNumber)
        .find((value) => value !== null && value >= 0 && value <= 100);
    return target ?? DEFAULT_TARGET;
}

// Every scored task of one term, in the order it was scored.
// Only criteria in the subject's rule are included (tasks under removed
// criteria don't count toward the grade, so they don't appear either).
export function getScoredTasks(studentRecord, rule, termKey) {
    const tasks = [];
    getRuleLeaves(rule).forEach((criterion, criterionIndex) => {
        toTaskList(studentRecord?.grades?.[termKey]?.[criterion.id]).forEach((task, taskIndex) => {
            const maxScore = toNumber(task.maxScore);
            const official = toNumber(task.officialScore);
            const entry = toNumber(task.studentReportedScore);
            const score = official ?? entry;
            if (score === null || maxScore === null || maxScore <= 0) return;

            tasks.push({
                criterionId: criterion.id,
                criterionName: criterion.name,
                task,
                label: taskLabel(task, criterion.name, taskIndex),
                score,
                maxScore,
                percent: (score / maxScore) * 100,
                isOfficial: official !== null,
                // The student's own entry that the official score replaced.
                replacedEntry: official !== null && entry !== null && entry !== official
                    ? { score: entry, maxScore, percent: (entry / maxScore) * 100 }
                    : null,
                sortKey: [scoreTime(task), criterionIndex, taskIndex],
            });
        });
    });

    // Tasks with a known time go in time order after the ones without
    // (older seed data), which keep rule order.
    return tasks.sort((a, b) => {
        const [timeA, critA, indexA] = a.sortKey;
        const [timeB, critB, indexB] = b.sortKey;
        if (timeA !== timeB) {
            if (timeA === null) return -1;
            if (timeB === null) return 1;
            return timeA - timeB;
        }
        return critA - critB || indexA - indexB;
    });
}

// A student record that only holds the given tasks for one term.
function recordWithTasks(termKey, items) {
    const termGrades = {};
    items.forEach(({ criterionId, task }) => {
        termGrades[criterionId] = [...(termGrades[criterionId] ?? []), task];
    });
    return { grades: { [termKey]: termGrades } };
}

// History points for one subject and term.
// Each point: { step, grade, label, termLabel, criterionId, criterionName,
//   taskId, percent, isOfficial, replacedEntry, ghostGrade }
// ghostGrade: the grade at that step if your own entry had been used instead
// of the official score that replaced it (null when nothing was replaced).
export function getGradeHistory(studentRecord, rule, termKey) {
    if (!studentRecord || !rule) return [];
    const scored = getScoredTasks(studentRecord, rule, termKey);

    return scored.map((item, index) => {
        const upToHere = scored.slice(0, index + 1);
        const grade = calculateUnofficialGrade(recordWithTasks(termKey, upToHere), termKey, rule);
        let ghostGrade = null;
        if (item.replacedEntry) {
            const withEntry = upToHere.map((other) => other === item
                ? { ...other, task: { ...other.task, officialScore: null } }
                : other);
            ghostGrade = calculateUnofficialGrade(recordWithTasks(termKey, withEntry), termKey, rule);
        }
        return {
            step: index + 1,
            grade,
            label: item.label,
            termLabel: TERM_LABELS[termKey],
            criterionId: item.criterionId,
            criterionName: item.criterionName,
            taskId: item.task.id ?? null,
            percent: item.percent,
            isOfficial: item.isOfficial,
            replacedEntry: item.replacedEntry,
            ghostGrade,
        };
    });
}

// How far the student's own entries were from the official scores that
// replaced them. gap = official % - your %, averaged (negative = you
// guessed too high). Returns null when no entry was replaced.
export function getEntryAccuracy(points) {
    const replaced = points.filter((point) => point.replacedEntry);
    if (!replaced.length) return null;
    const gaps = replaced.map((point) => point.percent - point.replacedEntry.percent);
    return {
        count: replaced.length,
        averageGap: gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length,
        averageDistance: gaps.reduce((sum, gap) => sum + Math.abs(gap), 0) / gaps.length,
    };
}

// "Target reached" only counts when the latest task leaves the grade at or
// above the target (an earlier peak that later dropped doesn't count).
// Returns the index of that last point, or -1.
export function getTargetReachedIndex(points, target, key = "grade") {
    if (target === null || target === undefined || points.length === 0) return -1;
    const last = points[points.length - 1][key];
    return last !== null && last !== undefined && last >= target ? points.length - 1 : -1;
}

// Round-robin over groups of slots: one from each criterion in turn.
function interleave(groups) {
    const result = [];
    const queues = groups.map((group) => [...group]);
    while (queues.some((queue) => queue.length)) {
        queues.forEach((queue) => {
            if (queue.length) result.push(queue.shift());
        });
    }
    return result;
}

// The sandbox plan as chart points that continue after the real history.
// Every remaining task becomes one step:
// - criteria with an expected % use it;
// - the others use the required %, or 100% when the target is out of reach,
//   or the current term grade when the target is already reached (instead
//   of 0%, which would draw a misleading fall).
// Order of upcoming tasks is unknown: criteria take turns (one task each),
// and criteria with an expected % (often the exam) go last.
// Returns { plan, points, fillPercent } where each point is
//   { step, planGrade, label, criterionName, percent, isExpected }.
export function getPlanPoints(studentRecord, rule, termKey, target, startStep = 0) {
    const plan = getSandboxPlan(studentRecord, rule, termKey, target);
    if (plan.status === "empty" || plan.status === "complete") {
        return { plan, points: [], fillPercent: null };
    }

    const current = calculateUnofficialGrade(studentRecord, termKey, rule);
    const fillPercent = plan.status === "required"
        ? plan.required
        : plan.status === "impossible"
            ? 100
            : Math.min(100, Math.max(0, current ?? plan.target));

    const toSlots = (criterion) => {
        const percent = criterion.usesRequired ? fillPercent : criterion.expected;
        const open = criterion.tasks
            .map(({ task, percent: taskPercent }, index) => ({ task, taskPercent, index }))
            .filter(({ taskPercent }) => taskPercent === null)
            .map(({ task, index }) => ({
                criterion,
                task,
                percent,
                label: taskLabel(task, criterion.name, index),
            }));
        const upcoming = Array.from({ length: criterion.upcoming }, (_, index) => ({
            criterion,
            task: null,
            percent,
            label: `Upcoming ${criterion.name} task${criterion.upcoming > 1 ? ` ${index + 1}` : ""}`,
        }));
        return [...open, ...upcoming];
    };

    const counted = plan.criteria.filter((criterion) => criterion.counted && criterion.slots > 0);
    const ordered = [
        ...interleave(counted.filter((criterion) => criterion.usesRequired).map(toSlots)),
        ...interleave(counted.filter((criterion) => !criterion.usesRequired).map(toSlots)),
    ];

    // Fill the slots one by one on a copy of this term's tasks.
    const termGrades = Object.fromEntries(
        Object.entries(studentRecord?.grades?.[termKey] ?? {}).map(([id, tasks]) => [id, toTaskList(tasks).map((task) => ({ ...task }))])
    );
    const record = { grades: { [termKey]: termGrades } };

    const points = ordered.map((slot, index) => {
        const id = slot.criterion.id;
        if (slot.task) {
            const copy = (termGrades[id] ?? []).find((task) => task.id === slot.task.id);
            const max = toNumber(copy?.maxScore) ?? 100;
            if (copy) copy.studentReportedScore = (slot.percent * max) / 100;
        } else {
            termGrades[id] = [...(termGrades[id] ?? []), { id: `plan-${index}`, maxScore: 100, studentReportedScore: slot.percent }];
        }
        return {
            step: startStep + index + 1,
            planGrade: calculateUnofficialGrade(record, termKey, rule),
            label: slot.label,
            criterionName: slot.criterion.name,
            percent: slot.percent,
            isExpected: !slot.criterion.usesRequired,
        };
    });

    return { plan, points, fillPercent };
}

// One history line per subject the student is enrolled in, for one term.
// semesterId (optional) keeps only that semester's subjects.
// Each entry: { classId, subjectCode, subjectName, target, points, reachedIndex }
export function getCoursesHistory(db, studentId, termKey, semesterId = null) {
    return (db?.classes ?? []).flatMap((classItem) => {
        if (semesterId && getClassSemesterId(classItem) !== semesterId) return [];
        const record = classItem.studentRecords?.find((item) => item.studentId === studentId);
        if (!record) return [];

        const subject = db.subjects?.find((item) => item.id === classItem.subjectId);
        const rule = db.computationRules?.find((item) => item.id === classItem.computationRuleId);
        const target = getTermTarget(record, termKey);
        const points = getGradeHistory(record, rule, termKey);
        return [{
            classId: classItem.id,
            subjectCode: subject?.subjectCode ?? "Unknown subject",
            subjectName: subject?.subjectName ?? "",
            target,
            points,
            reachedIndex: getTargetReachedIndex(points, target),
        }];
    });
}

// Axis settings for the history charts.
// y: starts 10 points below the lowest value (rounded down to a multiple of
//    10, never below 0). Ticks stop at 100%, but the axis goes a little
//    higher so a line sitting at 100% isn't cut in half by the chart's edge.
// x: one tick per task while there are 12 or fewer, otherwise about 10 ticks.
export function getChartScale(values, steps) {
    const numbers = values.filter((value) => Number.isFinite(value));
    const lowest = numbers.length ? Math.min(...numbers) : 0;
    const yMin = Math.max(0, Math.floor((lowest - 10) / 10) * 10);
    const yTicks = [];
    const yStep = 100 - yMin > 50 ? 20 : 10;
    for (let tick = 100; tick >= yMin; tick -= yStep) yTicks.unshift(tick);

    const lastStep = Math.max(steps, 1);
    const xStep = lastStep <= 12 ? 1 : Math.ceil(lastStep / 10);
    const xTicks = [];
    for (let tick = 1; tick <= lastStep; tick += xStep) xTicks.push(tick);
    if (xTicks[xTicks.length - 1] !== lastStep) xTicks.push(lastStep);

    const yTop = 100 + Math.max(2, (100 - yTicks[0]) * 0.06);
    return { yDomain: [yTicks[0], yTop], yTicks, xDomain: [1, Math.max(lastStep, 2)], xTicks };
}
