// Characterization tests for sandbox.js (Target Grade Sandbox maths).
import { describe, expect, it } from "vitest";
import { makeMixedRecord, makeSeedDb, makeStandardRule, makeTask } from "@/test/fixtures.js";
import {
    getCriterionSettings,
    getSandboxPlan,
    MAX_UPCOMING,
    requiredScore,
    roundUp2,
    setDraftScore,
    taskPercent,
    updateSandboxSettings,
    withDraftScores,
} from "./sandbox.js";

const rule = makeStandardRule();

function withTermSettings(record, settings, term = "prelim") {
    return {
        ...record,
        targetGradeSandbox: { ...record.targetGradeSandbox, terms: { [term]: settings } },
    };
}

describe("roundUp2", () => {
    it("rounds up to 2 decimals, with a tiny tolerance for exact values", () => {
        expect(roundUp2(84.999)).toBe(85);
        expect(roundUp2(85)).toBe(85);
        expect(roundUp2(85.001)).toBe(85.01);
        expect(roundUp2(33.333333)).toBe(33.34);
        expect(roundUp2(0.004)).toBe(0.01);
        expect(roundUp2(100.0000000001)).toBe(100.01);
    });
});

describe("taskPercent", () => {
    it("uses the official score, else the self-reported score", () => {
        expect(taskPercent(makeTask("a", 20, 18, 10))).toBe(90);
        expect(taskPercent(makeTask("a", 20, null, 10))).toBe(50);
        expect(taskPercent(makeTask("a", 20, "", "10"))).toBe(50);
    });

    it("includes custom tasks, even with an official score", () => {
        expect(taskPercent(makeTask("a", 50, null, 45, { isCustomTask: true }))).toBe(90);
        expect(taskPercent(makeTask("a", 50, 25, null, { isCustomTask: true }))).toBe(50);
    });

    it("is null without a score or without a usable maxScore", () => {
        expect(taskPercent(makeTask("a", 20))).toBeNull();
        expect(taskPercent(makeTask("a", 0, 5))).toBeNull();
        expect(taskPercent(makeTask("a", null, 5))).toBeNull();
        expect(taskPercent(null)).toBeNull();
    });
});

describe("getCriterionSettings", () => {
    it("defaults to 1 upcoming task when the criterion has no tasks, otherwise 0", () => {
        expect(getCriterionSettings({}, "prelim", "AT", 0)).toEqual({
            upcoming: 1,
            expected: null,
        });
        expect(getCriterionSettings({}, "prelim", "AT", 3)).toEqual({
            upcoming: 0,
            expected: null,
        });
        expect(getCriterionSettings(null, "prelim", "AT", 0)).toEqual({
            upcoming: 1,
            expected: null,
        });
    });

    it("rounds and clamps upcoming to 0–20 and clamps expected to 0–100", () => {
        const settings = (criteria) =>
            getCriterionSettings(
                { targetGradeSandbox: { terms: { prelim: { criteria } } } },
                "prelim",
                "AT",
                0,
            );
        expect(settings({ AT: { upcoming: 2.6, expected: 120 } })).toEqual({
            upcoming: 3,
            expected: 100,
        });
        expect(settings({ AT: { upcoming: 50, expected: -5 } })).toEqual({
            upcoming: 20,
            expected: 0,
        });
        expect(settings({ AT: { upcoming: -3, expected: "75.5" } })).toEqual({
            upcoming: 0,
            expected: 75.5,
        });
        expect(settings({ AT: { upcoming: "", expected: "" } })).toEqual({
            upcoming: 1,
            expected: null,
        });
        expect(MAX_UPCOMING).toBe(20);
    });

    it("reads the legacy upcomingAT, upcomingTLA and expectedExamScore settings", () => {
        const record = {
            targetGradeSandbox: {
                terms: { prelim: { upcomingAT: 2, upcomingTLA: 4, expectedExamScore: 80 } },
            },
        };
        expect(getCriterionSettings(record, "prelim", "AT", 5)).toEqual({
            upcoming: 2,
            expected: null,
        });
        expect(getCriterionSettings(record, "prelim", "TLA", 5)).toEqual({
            upcoming: 4,
            expected: null,
        });
        expect(getCriterionSettings(record, "prelim", "Exam", 5)).toEqual({
            upcoming: 0,
            expected: 80,
        });
        expect(getCriterionSettings(record, "prelim", "Other", 5)).toEqual({
            upcoming: 0,
            expected: null,
        });
    });

    it("saved criterion settings win over the legacy ones", () => {
        const record = {
            targetGradeSandbox: {
                terms: {
                    prelim: {
                        upcomingAT: 2,
                        expectedExamScore: 80,
                        criteria: { AT: { upcoming: 5 }, Exam: { expected: null } },
                    },
                },
            },
        };
        expect(getCriterionSettings(record, "prelim", "AT", 5)).toEqual({
            upcoming: 5,
            expected: null,
        });
        expect(getCriterionSettings(record, "prelim", "Exam", 5)).toEqual({
            upcoming: 0,
            expected: null,
        });
    });
});

describe("getSandboxPlan", () => {
    it("describes each criterion of the rule", () => {
        const plan = getSandboxPlan(makeMixedRecord(), rule, "prelim", 80);
        const summary = plan.criteria.map(({ tasks, ...rest }) => ({
            ...rest,
            taskCount: tasks.length,
        }));

        expect(summary[0]).toMatchObject({
            id: "AT",
            name: "AT",
            path: ["Classwork", "AT"],
            scoredCount: 3,
            openTasks: 0,
            upcoming: 0,
            expected: null,
            slots: 0,
            usesRequired: false,
            counted: true,
            requiredPart: 0,
            taskCount: 3,
        });
        expect(summary[0].weight).toBeCloseTo(0.49, 10);
        expect(summary[0].scoredAverage).toBeCloseTo(76.66666666666667, 10);
        expect(summary[0].fixedPart).toBeCloseTo(76.66666666666667, 10);

        expect(summary[1]).toMatchObject({
            id: "TLA",
            path: ["Classwork", "TLA"],
            scoredCount: 1,
            scoredAverage: 80,
            openTasks: 1,
            slots: 1,
            usesRequired: true,
            counted: true,
            fixedPart: 40,
            requiredPart: 0.5,
        });
        expect(summary[2]).toMatchObject({
            id: "Exam",
            path: ["Exam"],
            scoredCount: 0,
            scoredAverage: null,
            openTasks: 1,
            slots: 1,
            usesRequired: true,
            counted: true,
            fixedPart: 0,
            requiredPart: 1,
        });
        expect(plan.criteria[1].tasks.map((item) => item.percent)).toEqual([80, null]);
    });

    it('status "required": the percentage needed on each remaining task', () => {
        const plan = getSandboxPlan(makeMixedRecord(), rule, "prelim", 80);
        expect(plan).toMatchObject({
            status: "required",
            target: 80,
            required: 84.04,
            requiredSlots: 2,
        });
        expect(plan.requiredRaw).toBeCloseTo(84.03292181069959, 10);
        expect(plan.projected).toBeCloseTo(80.00286666666668, 10);
        expect(plan.best).toBeCloseTo(86.46666666666667, 10);
        expect(plan.worst).toBeCloseTo(45.96666666666667, 10);
    });

    it('status "impossible": even 100% on every remaining task is not enough', () => {
        // The target defaults to the record's 90.
        const plan = getSandboxPlan(makeMixedRecord(), rule, "prelim");
        expect(plan).toMatchObject({
            status: "impossible",
            target: 90,
            required: null,
            requiredSlots: 2,
        });
        expect(plan.requiredRaw).toBeCloseTo(108.72427983539094, 10);
        expect(plan.projected).toBeCloseTo(86.46666666666667, 10);
    });

    it('status "reached": the target is met even with 0% on the remaining tasks', () => {
        const plan = getSandboxPlan(makeMixedRecord(), rule, "prelim", 40);
        expect(plan).toMatchObject({ status: "reached", required: 0, requiredSlots: 2 });
        expect(plan.requiredRaw).toBeCloseTo(-14.73251028806585, 10);
        expect(plan.projected).toBeCloseTo(45.96666666666667, 10);
    });

    it('status "complete": every open task has an expected %, so nothing uses the required value', () => {
        const record = withTermSettings(makeMixedRecord(), {
            criteria: { TLA: { expected: 70 }, Exam: { expected: 80 } },
        });
        const plan = getSandboxPlan(record, rule, "prelim");
        expect(plan).toMatchObject({
            status: "complete",
            required: null,
            requiredRaw: null,
            requiredSlots: 0,
        });
        // AT 76.67 x 0.49 + TLA (80 + 70) / 2 x 0.21 + Exam 80 x 0.30
        expect(plan.projected).toBeCloseTo(77.31666666666668, 10);
        expect(plan.best).toBeCloseTo(plan.projected, 10);
        expect(plan.worst).toBeCloseTo(plan.projected, 10);
        expect(plan.criteria[1]).toMatchObject({
            usesRequired: false,
            expected: 70,
            fixedPart: 75,
            requiredPart: 0,
        });
    });

    it('status "empty": no tasks and no upcoming tasks', () => {
        const record = withTermSettings(
            { grades: { prelim: {} } },
            { criteria: { AT: { upcoming: 0 }, TLA: { upcoming: 0 }, Exam: { upcoming: 0 } } },
        );
        expect(getSandboxPlan(record, rule, "prelim")).toMatchObject({
            status: "empty",
            target: 90,
            required: null,
            requiredRaw: null,
            requiredSlots: 0,
            projected: null,
            best: null,
            worst: null,
        });
    });

    it("a term with no tasks plans one upcoming task per criterion", () => {
        const record = makeSeedDb().classes[0].studentRecords[0];
        const plan = getSandboxPlan(record, rule, "midterm");
        expect(plan).toMatchObject({
            status: "required",
            required: 90,
            requiredSlots: 3,
            worst: 0,
        });
        expect(plan.best).toBeCloseTo(100, 10);
        expect(plan.criteria.map((criterion) => criterion.upcoming)).toEqual([1, 1, 1]);
    });

    it("seed student U1, prelim: 90% needed on the 2 remaining tasks", () => {
        const record = makeSeedDb().classes[0].studentRecords[0];
        const plan = getSandboxPlan(record, rule, "prelim");
        expect(plan).toMatchObject({
            status: "required",
            target: 90,
            required: 90,
            requiredSlots: 2,
        });
        expect(plan.projected).toBeCloseTo(90, 10);
        expect(plan.best).toBeCloseTo(95.1, 10);
        expect(plan.worst).toBeCloseTo(44.1, 10);
    });

    it("upcoming tasks add slots to a criterion that already has scores", () => {
        const record = withTermSettings(makeMixedRecord(), { criteria: { AT: { upcoming: 2 } } });
        const at = getSandboxPlan(record, rule, "prelim", 80).criteria[0];
        expect(at).toMatchObject({ slots: 2, upcoming: 2, usesRequired: true, requiredPart: 0.4 });
        expect(at.fixedPart).toBeCloseTo(46, 10);
    });

    it("leaves out a criterion with no tasks and no upcoming tasks, and renormalises", () => {
        const record = withTermSettings(
            { grades: { prelim: { AT: [makeTask("a", 100, 60)] } } },
            { criteria: { TLA: { upcoming: 0 }, Exam: { upcoming: 0 } } },
        );
        const plan = getSandboxPlan(record, rule, "prelim", 90);
        expect(plan.status).toBe("complete");
        expect(plan.projected).toBeCloseTo(60, 10);
        expect(plan.criteria.map((criterion) => criterion.counted)).toEqual([true, false, false]);
    });

    it('returns "empty" without a rule or a record', () => {
        expect(getSandboxPlan(makeMixedRecord(), null, "prelim").status).toBe("empty");
        expect(getSandboxPlan(null, rule, "prelim")).toMatchObject({
            status: "required",
            required: 90,
        });
    });
});

describe("requiredScore", () => {
    it("converts a percentage to a raw score, rounded up and capped at maxScore", () => {
        expect(requiredScore(84.04, 50)).toBe(42.02);
        expect(requiredScore(100, 20)).toBe(20);
        expect(requiredScore(120, 50)).toBe(50);
        expect(requiredScore(50, "40")).toBe(20);
        expect(requiredScore(33.33, 30)).toBe(10);
    });

    it("is null without a percentage or a usable maxScore", () => {
        expect(requiredScore(null, 20)).toBeNull();
        expect(requiredScore(50, 0)).toBeNull();
        expect(requiredScore(50, null)).toBeNull();
        expect(requiredScore(50, "x")).toBeNull();
    });
});

describe("updateSandboxSettings", () => {
    it("saves a sandbox target for one term and keeps everything else", () => {
        const record = makeMixedRecord();
        const updated = updateSandboxSettings(record, "prelim", { sandboxDesiredFinalGrade: 85 });
        expect(updated.targetGradeSandbox).toEqual({
            desiredFinalGrade: 90,
            terms: { prelim: { sandboxDesiredFinalGrade: 85, criteria: {} } },
        });
        expect(updated.grades).toBe(record.grades);
        expect(record.targetGradeSandbox).toEqual({ desiredFinalGrade: 90 });
    });

    it("merges criterion settings with the saved ones", () => {
        const record = withTermSettings(makeMixedRecord(), {
            desiredFinalGrade: 88,
            criteria: { AT: { upcoming: 2, expected: 70 }, TLA: { upcoming: 1 } },
        });
        const updated = updateSandboxSettings(record, "prelim", {
            criteria: { AT: { expected: null }, Exam: { upcoming: 3 } },
        });
        expect(updated.targetGradeSandbox.terms.prelim).toEqual({
            desiredFinalGrade: 88,
            criteria: {
                AT: { upcoming: 2, expected: null },
                TLA: { upcoming: 1 },
                Exam: { upcoming: 3 },
            },
        });
    });

    it("keeps the other terms", () => {
        const record = withTermSettings(
            makeMixedRecord(),
            { sandboxDesiredFinalGrade: 70 },
            "midterm",
        );
        const updated = updateSandboxSettings(record, "prelim", { sandboxDesiredFinalGrade: 85 });
        expect(updated.targetGradeSandbox.terms.midterm).toEqual({ sandboxDesiredFinalGrade: 70 });
    });
});

// Draft scores (the approved B9 fix): stored per term, used only by the sandbox.
describe("setDraftScore", () => {
    it("stores the typed text for one task and keeps the other settings", () => {
        const record = withTermSettings(makeMixedRecord(), {
            criteria: { AT: { upcoming: 2 } },
            draftScores: { e1: "70" },
        });
        const next = setDraftScore(record, "prelim", "t2", "30");
        expect(next.targetGradeSandbox.terms.prelim).toEqual({
            criteria: { AT: { upcoming: 2 } },
            draftScores: { e1: "70", t2: "30" },
        });
        expect(next.targetGradeSandbox.desiredFinalGrade).toBe(90);
        expect(next.grades).toBe(record.grades);
    });

    it("stores a cleared box as an empty string", () => {
        const next = setDraftScore(makeMixedRecord(), "midterm", "a2", "");
        expect(next.targetGradeSandbox.terms).toEqual({ midterm: { draftScores: { a2: "" } } });
    });
});

describe("withDraftScores", () => {
    const drafted = (drafts, term = "prelim") =>
        withDraftScores(withTermSettings(makeMixedRecord(), { draftScores: drafts }, term), term);
    const task = (record, criterionId, id) =>
        record.grades.prelim[criterionId].find((item) => item.id === id);

    it("returns the same record when the term has no drafts", () => {
        const record = makeMixedRecord();
        expect(withDraftScores(record, "prelim")).toBe(record);
        const empty = withTermSettings(record, { draftScores: {} });
        expect(withDraftScores(empty, "prelim")).toBe(empty);
    });

    it("puts each draft in place of the self-reported score", () => {
        const record = drafted({ t2: "30", a3: "8" });
        expect(task(record, "TLA", "t2").studentReportedScore).toBe("30");
        expect(task(record, "AT", "a3").studentReportedScore).toBe("8");
        expect(task(record, "AT", "a2").studentReportedScore).toBe(45);
    });

    it("marks drafted tasks so the chart can draw them after the real scores", () => {
        const record = drafted({ t2: "30" });
        expect(task(record, "TLA", "t2").isDraftScore).toBe(true);
        expect(task(record, "AT", "a2")).not.toHaveProperty("isDraftScore");
    });

    it("keeps official tasks as they are", () => {
        const record = drafted({ a1: "1", t1: "1" });
        expect(task(record, "AT", "a1")).toEqual(makeMixedRecord().grades.prelim.AT[0]);
        expect(task(record, "TLA", "t1")).toEqual(makeMixedRecord().grades.prelim.TLA[0]);
    });

    it("treats an empty draft as no score in the plan", () => {
        const plan = getSandboxPlan(drafted({ a3: "" }), rule, "prelim", 90);
        const at = plan.criteria.find((criterion) => criterion.id === "AT");
        expect(at.scoredCount).toBe(2);
        expect(at.openTasks).toBe(1);
    });

    it("changes only this term and never the stored record", () => {
        const source = withTermSettings(makeMixedRecord(), { draftScores: { t2: "30" } });
        const before = structuredClone(source);
        const record = withDraftScores(source, "prelim");
        expect(source).toEqual(before);
        expect(record.grades.midterm).toBe(source.grades.midterm);
        expect(withDraftScores(source, "midterm")).toBe(source);
    });

    it("handles an exam stored as a single task object", () => {
        const record = withTermSettings(makeMixedRecord(), { draftScores: { e1: "70" } });
        record.grades.prelim.Exam = makeTask("e1", 100);
        expect(withDraftScores(record, "prelim").grades.prelim.Exam.studentReportedScore).toBe(
            "70",
        );
    });
});
