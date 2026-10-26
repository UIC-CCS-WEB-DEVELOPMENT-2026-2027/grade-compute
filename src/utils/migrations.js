// src/utils/migrations.js
// Upgrades data saved in older formats, so browsers that already have
// "compugrade_db" in localStorage keep working after a format change.
// Called by db.js. Safe to run more than once.
import { buildRuleMath, ruleToTree, TERM_KEYS } from "./rules.js";
import { toTaskList } from "./grades.js";

export const SCHEMA_VERSION = 3;

// Version 2 (flexible criteria):
// - Rules store a "criteria" tree instead of the fixed "hierarchy" object,
//   and gain "tags" and "schools" lists.
// - Every criterion holds a list of tasks. The old single Exam object
//   becomes a one-task list (an empty exam placeholder becomes []).
function migrateToV2(db) {
    const computationRules = (db.computationRules ?? []).map((rule) => {
        const math = Array.isArray(rule.criteria) ? null : buildRuleMath(ruleToTree(rule));
        const upgraded = {
            ...rule,
            tags: rule.tags ?? [],
            schools: rule.schools ?? [],
            ...(math?.ok ? { criteria: math.criteria, effectiveMultipliers: math.effectiveMultipliers } : {}),
        };
        delete upgraded.hierarchy;
        return upgraded;
    });

    const classes = (db.classes ?? []).map((classItem) => ({
        ...classItem,
        studentRecords: (classItem.studentRecords ?? []).map((record) => {
            const grades = { ...(record.grades ?? {}) };
            TERM_KEYS.forEach((term) => {
                const termGrades = grades[term];
                if (!termGrades || Array.isArray(termGrades.Exam) || !("Exam" in termGrades)) return;

                const exam = termGrades.Exam;
                const hasScore = [exam?.officialScore, exam?.studentReportedScore].some(
                    (score) => score !== null && score !== undefined && score !== ""
                );
                grades[term] = {
                    ...termGrades,
                    Exam: hasScore || !exam?.id?.endsWith?.("-EXAM")
                        ? toTaskList(exam).map((task) => ({
                            ...task,
                            sequenceNumber: task.sequenceNumber ?? 1,
                            isCustomTask: task.isCustomTask ?? false,
                        }))
                        : [],
                };
            });
            return { ...record, grades };
        }),
    }));

    return { ...db, schemaVersion: 2, computationRules, classes };
}

function migrateStandardRuleCopyWeights(db) {
    const computationRules = (db.computationRules ?? []).map((rule) => {
        if (rule.ruleName !== "Standard IT Rule (70/30) (Copy)") return rule;

        const tree = ruleToTree(rule);
        const classwork = tree.children?.find((criterion) => criterion.name === "Classwork");
        const exam = tree.children?.find((criterion) => criterion.name === "Exam");
        const at = classwork?.children?.find((criterion) => criterion.name === "AT");
        const tla = classwork?.children?.find((criterion) => criterion.name === "TLA");
        if (
            !classwork
            || !exam
            || !at
            || !tla
            || tree.children.length !== 2
            || classwork.children.length !== 2
        ) return rule;

        const updatedTree = {
            ...tree,
            children: tree.children.map((criterion) => {
                if (criterion.id === classwork.id) {
                    return {
                        ...criterion,
                        share: 7000,
                        children: criterion.children.map((child) => ({
                            ...child,
                            share: child.id === at.id ? 7000 : child.id === tla.id ? 3000 : child.share,
                        })),
                    };
                }
                return { ...criterion, share: 3000 };
            }),
        };
        const math = buildRuleMath(updatedTree);
        return math.ok
            ? { ...rule, criteria: math.criteria, effectiveMultipliers: math.effectiveMultipliers }
            : rule;
    });

    return { ...db, schemaVersion: 3, computationRules };
}

export function needsMigration(db) {
    return Boolean(db) && typeof db === "object" && (db.schemaVersion ?? 1) < SCHEMA_VERSION;
}

export function migrateDb(db) {
    if (!needsMigration(db)) return db;
    let upgraded = db;
    if ((upgraded.schemaVersion ?? 1) < 2) upgraded = migrateToV2(upgraded);
    if (upgraded.schemaVersion < 3) upgraded = migrateStandardRuleCopyWeights(upgraded);
    return upgraded;
}
