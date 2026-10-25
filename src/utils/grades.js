// src/utils/grades.js
// CompUGrade grading engine.
// All math uses the rule's effectiveMultipliers (project-master-context.txt, 6B).
// effectiveMultipliers is keyed by the id of each deepest criterion, and each
// term stores its tasks under those same ids:
//   rule.effectiveMultipliers = { AT: 0.49, TLA: 0.21, Exam: 0.3 }
//   studentRecord.grades.prelim = { AT: [tasks], TLA: [tasks], Exam: [tasks] }

const TERM_KEYS = ["prelim", "midterm", "finals"];

// Scores may be stored as numbers or as text from inputs ("45", "").
// Returns a number, or null when the score is empty or invalid.
function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

// Every criterion holds a list of tasks. Older data stored the exam as a
// single object; treat that as a one-task list.
export function toTaskList(value) {
    if (Array.isArray(value)) return value;
    return value && typeof value === "object" && ("maxScore" in value || "id" in value) ? [value] : [];
}

// Official mode: only officialScore counts, and custom tasks are skipped.
// Unofficial mode follows the 3-State logic: officialScore if present,
// otherwise studentReportedScore, otherwise the task is empty.
function pickScore(task, includeSelfReported) {
    if (!includeSelfReported && task?.isCustomTask) return null;

    const official = toNumber(task?.officialScore);
    if (official !== null) return official;

    return includeSelfReported ? toNumber(task?.studentReportedScore) : null;
}

// A task's score as a percentage of its maxScore, or null if it has no usable score.
function taskPercentage(task, includeSelfReported) {
    const maxScore = toNumber(task?.maxScore);
    if (maxScore === null || maxScore <= 0) return null;

    const score = pickScore(task, includeSelfReported);
    return score === null ? null : (score / maxScore) * 100;
}

function average(values) {
    return values.reduce((total, value) => total + value, 0) / values.length;
}

// Shared engine for both grade types.
// Each criterion's grade is the average of its task percentages, so every
// task counts equally regardless of its maxScore. Only criteria with at
// least one score are included, so the result is the grade so far.
function calculateTermGrade(studentRecord, term, computationRule, includeSelfReported) {
    const termGrades = studentRecord?.grades?.[term?.toLowerCase()];
    const multipliers = computationRule?.effectiveMultipliers;
    if (!termGrades || !multipliers) return null;

    const weightedGrades = [];
    for (const [criterionId, weightValue] of Object.entries(multipliers)) {
        const weight = toNumber(weightValue);
        const percentages = toTaskList(termGrades[criterionId])
            .map((task) => taskPercentage(task, includeSelfReported))
            .filter((percentage) => percentage !== null);

        if (weight !== null && weight > 0 && percentages.length > 0) {
            weightedGrades.push({ grade: average(percentages), weight });
        }
    }

    const totalWeight = weightedGrades.reduce((total, item) => total + item.weight, 0);
    if (totalWeight === 0) return null;

    const weightedTotal = weightedGrades.reduce(
        (total, item) => total + item.grade * item.weight,
        0
    );
    return weightedTotal / totalWeight;
}

// Grade from professor-entered scores only.
export function calculateOfficialGrade(studentRecord, term, computationRule) {
    return calculateTermGrade(studentRecord, term, computationRule, false);
}

// Grade including self-reported scores and custom tasks.
// Official scores still take priority over self-reported ones.
export function calculateUnofficialGrade(studentRecord, term, computationRule) {
    return calculateTermGrade(studentRecord, term, computationRule, true);
}

// Final grade: the three terms count equally (grade-rules-spec.txt, PART 10).
// Only terms that have a grade are averaged, so this is the final grade so far.
function calculateFinalGrade(studentRecord, computationRule, includeSelfReported) {
    const termGrades = TERM_KEYS.map((term) =>
        calculateTermGrade(studentRecord, term, computationRule, includeSelfReported)
    ).filter((grade) => grade !== null);
    return termGrades.length > 0 ? average(termGrades) : null;
}

export function calculateOfficialFinalGrade(studentRecord, computationRule) {
    return calculateFinalGrade(studentRecord, computationRule, false);
}

export function calculateUnofficialFinalGrade(studentRecord, computationRule) {
    return calculateFinalGrade(studentRecord, computationRule, true);
}

// Professor-entered (non-custom) tasks of a term that have an official score.
export function getOfficialAssessments(termGrades) {
    if (!termGrades) return [];

    return Object.values(termGrades)
        .flatMap(toTaskList)
        .filter(
            (task) =>
                !task.isCustomTask &&
                task.officialScore !== null &&
                task.officialScore !== undefined
        );
}
