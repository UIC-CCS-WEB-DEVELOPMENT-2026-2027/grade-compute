// src/utils/grades.js
// CompUGrade grading engine.
// All math uses the rule's effectiveMultipliers (project-master-context.txt, 6B).
// The hierarchy object is for display only and is never read here.

const CLASSWORK_CATEGORIES = ["AT", "TLA"];

// Scores may be stored as numbers or as text from inputs ("45", "").
// Returns a number, or null when the score is empty or invalid.
function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
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
// Each category's grade is the average of its task percentages, so every
// task counts equally regardless of its maxScore. Only categories with at
// least one score are included, so the result is the grade so far.
function calculateTermGrade(studentRecord, term, computationRule, includeSelfReported) {
    const termGrades = studentRecord?.grades?.[term?.toLowerCase()];
    const multipliers = computationRule?.effectiveMultipliers;
    if (!termGrades || !multipliers) return null;

    const weightedGrades = [];

    for (const category of CLASSWORK_CATEGORIES) {
        const weight = toNumber(multipliers[category]);
        const percentages = (termGrades[category] ?? [])
            .map((task) => taskPercentage(task, includeSelfReported))
            .filter((percentage) => percentage !== null);

        if (weight !== null && percentages.length > 0) {
            weightedGrades.push({ grade: average(percentages), weight });
        }
    }

    const examWeight = toNumber(multipliers.Exam);
    const examPercentage = taskPercentage(termGrades.Exam, includeSelfReported);
    if (examWeight !== null && examPercentage !== null) {
        weightedGrades.push({ grade: examPercentage, weight: examWeight });
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

export function getOfficialAssessments(termGrades) {
    if (!termGrades) return [];

    const tasks = [
        ...(termGrades.AT ?? []).filter((task) => !task.isCustomTask),
        ...(termGrades.TLA ?? []).filter((task) => !task.isCustomTask),
    ];
    if (termGrades.Exam) tasks.push(termGrades.Exam);

    return tasks.filter(
        (task) => task.officialScore !== null && task.officialScore !== undefined
    );
}