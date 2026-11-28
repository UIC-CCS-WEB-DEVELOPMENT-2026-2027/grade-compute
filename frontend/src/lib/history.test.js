// Characterization tests for history.js (grade history and plan points).
import { describe, expect, it } from "vitest";
import { makeMixedRecord, makeSeedDb, makeStandardRule, makeTask } from "@/test/fixtures.js";
import {
    getChartScale,
    getCoursesHistory,
    getEntryAccuracy,
    getGradeHistory,
    getPlanPoints,
    getScoredTasks,
    getTargetReachedIndex,
    PASSING_GRADE,
    scoreTime,
    getTargetGap,
    isOnTarget,
    isSpotOn,
} from "./history.js";

const rule = makeStandardRule();

// The mixed record with score times: t1 entered first, then a3, then a1.
// a2 has no time, so it comes first.
function makeTimedRecord() {
    const record = makeMixedRecord();
    const { AT, TLA } = record.grades.prelim;
    AT[0].officialScoredAt = "2026-09-10T00:00:00.000Z";
    AT[2].studentScoredAt = "2026-09-05T00:00:00.000Z";
    TLA[0].studentScoredAt = "2026-09-01T00:00:00.000Z";
    TLA[0].officialScoredAt = "2026-09-20T00:00:00.000Z";
    return record;
}

describe("scoreTime", () => {
    it("is the earlier of the student and official score times", () => {
        expect(
            scoreTime({
                studentScoredAt: "2026-09-05T00:00:00.000Z",
                officialScoredAt: "2026-09-01T00:00:00.000Z",
            }),
        ).toBe(Date.parse("2026-09-01T00:00:00.000Z"));
        expect(scoreTime({ officialScoredAt: "2026-09-10T00:00:00.000Z" })).toBe(
            Date.parse("2026-09-10T00:00:00.000Z"),
        );
    });

    it("falls back to createdAt, then to the time in a CUSTOM-<ms> id", () => {
        expect(
            scoreTime({ createdAt: "2026-08-20T00:00:00.000Z", id: "CUSTOM-1790000000000" }),
        ).toBe(Date.parse("2026-08-20T00:00:00.000Z"));
        expect(scoreTime({ id: "CUSTOM-1790000000000" })).toBe(1790000000000);
    });

    it("is null when no time is known", () => {
        expect(scoreTime({ id: "AT-1" })).toBeNull();
        expect(scoreTime({ id: "CUSTOM-123" })).toBeNull();
        expect(scoreTime({ studentScoredAt: "not a date" })).toBeNull();
        expect(scoreTime(null)).toBeNull();
    });
});

describe("getScoredTasks", () => {
    it("keeps rule order when no task has a time", () => {
        const tasks = getScoredTasks(makeMixedRecord(), rule, "prelim");
        expect(tasks.map((item) => item.task.id)).toEqual(["a1", "a2", "a3", "t1"]);
    });

    it("puts tasks without a time first, then orders the rest by first score time", () => {
        const tasks = getScoredTasks(makeTimedRecord(), rule, "prelim");
        expect(tasks.map((item) => item.task.id)).toEqual(["a2", "t1", "a3", "a1"]);
    });

    it("puts sandbox draft scores after every real score, in rule order", () => {
        const record = makeTimedRecord();
        const { AT, TLA, Exam } = record.grades.prelim;
        Exam[0] = { ...Exam[0], studentReportedScore: "70", isDraftScore: true };
        TLA[1] = { ...TLA[1], studentReportedScore: "30", isDraftScore: true };
        // A drafted task that had a real score and time still goes with the drafts.
        AT[2] = { ...AT[2], studentReportedScore: "8", isDraftScore: true };
        const tasks = getScoredTasks(record, rule, "prelim");
        expect(tasks.map((item) => item.task.id)).toEqual(["a2", "t1", "a1", "a3", "t2", "e1"]);
    });

    it("describes each scored task", () => {
        const [a2, t1] = getScoredTasks(makeTimedRecord(), rule, "prelim");
        expect(a2).toMatchObject({
            criterionId: "AT",
            criterionName: "AT",
            label: "AT 2",
            score: 45,
            maxScore: 50,
            percent: 90,
            isOfficial: false,
            replacedEntry: null,
            sortKey: [0, null, 0, 1],
        });
        expect(t1).toMatchObject({
            criterionId: "TLA",
            label: "TLA 1",
            score: 80,
            percent: 80,
            isOfficial: true,
            replacedEntry: { score: 60, maxScore: 100, percent: 60 },
            sortKey: [0, Date.parse("2026-09-01T00:00:00.000Z"), 1, 0],
        });
    });

    it("labels a task with its title and description", () => {
        const record = makeSeedDb().classes[0].studentRecords[0];
        expect(getScoredTasks(record, rule, "prelim").map((item) => item.label)).toEqual([
            "AT 1 - Chapter 4 Quiz",
            "AT 2 - Pop Quiz",
        ]);
    });

    it("does not treat an equal student entry as replaced", () => {
        const record = { grades: { prelim: { AT: [makeTask("a", 20, 18, 18)] } } };
        expect(getScoredTasks(record, rule, "prelim")[0].replacedEntry).toBeNull();
    });

    it("skips empty tasks, tasks without a usable maxScore, and criteria not in the rule", () => {
        const record = {
            grades: {
                prelim: {
                    AT: [makeTask("a", 20), makeTask("b", 0, 5), makeTask("c", 20, 10)],
                    Removed: [makeTask("r", 20, 20)],
                },
            },
        };
        expect(getScoredTasks(record, rule, "prelim").map((item) => item.task.id)).toEqual(["c"]);
    });
});

describe("getGradeHistory", () => {
    it("gives the expected term grade after each scored task", () => {
        const points = getGradeHistory(makeTimedRecord(), rule, "prelim");
        expect(points.map((point) => point.taskId)).toEqual(["a2", "t1", "a3", "a1"]);
        expect(points.map((point) => point.step)).toEqual([1, 2, 3, 4]);
        expect(points[0].grade).toBeCloseTo(90, 10);
        expect(points[1].grade).toBeCloseTo(87, 10);
        expect(points[2].grade).toBeCloseTo(73, 10);
        expect(points[3].grade).toBeCloseTo(77.66666666666669, 10);
    });

    it("describes each point", () => {
        const points = getGradeHistory(makeTimedRecord(), rule, "prelim");
        expect(points[1]).toMatchObject({
            step: 2,
            label: "TLA 1",
            termLabel: "Prelim",
            criterionId: "TLA",
            criterionName: "TLA",
            taskId: "t1",
            percent: 80,
            isOfficial: true,
            replacedEntry: { score: 60, maxScore: 100, percent: 60 },
        });
        expect(points[0]).toMatchObject({
            isOfficial: false,
            replacedEntry: null,
            ghostGrade: null,
        });
    });

    it("adds a ghost grade where an official score replaced the student entry", () => {
        const timed = getGradeHistory(makeTimedRecord(), rule, "prelim");
        expect(timed[1].ghostGrade).toBeCloseTo(81, 10);

        const untimed = getGradeHistory(makeMixedRecord(), rule, "prelim");
        expect(untimed[3].grade).toBeCloseTo(77.66666666666669, 10);
        expect(untimed[3].ghostGrade).toBeCloseTo(71.66666666666667, 10);
    });

    it("returns no points without a record or a rule, or for an empty term", () => {
        expect(getGradeHistory(null, rule, "prelim")).toEqual([]);
        expect(getGradeHistory(makeMixedRecord(), null, "prelim")).toEqual([]);
        expect(getGradeHistory(makeMixedRecord(), rule, "midterm")).toEqual([]);
    });
});

describe("getEntryAccuracy", () => {
    it("is null when no entry was replaced", () => {
        expect(getEntryAccuracy([])).toBeNull();
        expect(getEntryAccuracy([{ percent: 90, replacedEntry: null }])).toBeNull();
    });

    it("averages the gap between official and student percentages", () => {
        const points = getGradeHistory(makeTimedRecord(), rule, "prelim");
        expect(getEntryAccuracy(points)).toEqual({ count: 1, averageGap: 20, averageDistance: 20 });

        expect(
            getEntryAccuracy([
                { percent: 80, replacedEntry: { percent: 60 } },
                { percent: 70, replacedEntry: { percent: 80 } },
                { percent: 50, replacedEntry: null },
            ]),
        ).toEqual({ count: 2, averageGap: 5, averageDistance: 15 });
    });
});

describe("getTargetReachedIndex", () => {
    it("is the last index when the last point is at or above the target", () => {
        expect(getTargetReachedIndex([{ grade: 80 }, { grade: 90 }], 90)).toBe(1);
        expect(getTargetReachedIndex([{ grade: 95 }], 90)).toBe(0);
    });

    it("is -1 when an earlier peak later dropped below the target", () => {
        expect(getTargetReachedIndex([{ grade: 95 }, { grade: 80 }], 90)).toBe(-1);
    });

    it("is -1 without points, a target or a grade", () => {
        expect(getTargetReachedIndex([], 90)).toBe(-1);
        expect(getTargetReachedIndex([{ grade: 95 }], null)).toBe(-1);
        expect(getTargetReachedIndex([{ grade: 95 }], undefined)).toBe(-1);
        expect(getTargetReachedIndex([{ grade: null }], 90)).toBe(-1);
    });

    it("can read another key", () => {
        expect(getTargetReachedIndex([{ planGrade: 91 }], 90, "planGrade")).toBe(0);
        expect(getTargetReachedIndex([{ planGrade: 91 }], 90)).toBe(-1);
    });
});

describe("getPlanPoints", () => {
    it('"required": fills the remaining tasks with the required %', () => {
        const { plan, points, fillPercent } = getPlanPoints(
            makeMixedRecord(),
            rule,
            "prelim",
            80,
            4,
        );
        expect(plan.status).toBe("required");
        expect(fillPercent).toBe(84.04);
        expect(points).toHaveLength(2);
        expect(points[0]).toMatchObject({
            step: 5,
            label: "TLA 2",
            criterionName: "TLA",
            percent: 84.04,
            isExpected: false,
        });
        expect(points[1]).toMatchObject({
            step: 6,
            label: "Exam 1",
            criterionName: "Exam",
            percent: 84.04,
        });
        expect(points[0].planGrade).toBeCloseTo(78.27266666666668, 10);
        expect(points[1].planGrade).toBeCloseTo(80.00286666666668, 10);
    });

    it('"impossible": fills the remaining tasks with 100%', () => {
        const { plan, points, fillPercent } = getPlanPoints(
            makeMixedRecord(),
            rule,
            "prelim",
            90,
            4,
        );
        expect(plan.status).toBe("impossible");
        expect(fillPercent).toBe(100);
        expect(points[0].planGrade).toBeCloseTo(80.66666666666667, 10);
        expect(points[1].planGrade).toBeCloseTo(86.46666666666667, 10);
    });

    it('"reached": fills the remaining tasks with the current term grade', () => {
        const { plan, points, fillPercent } = getPlanPoints(
            makeMixedRecord(),
            rule,
            "prelim",
            40,
            4,
        );
        expect(plan.status).toBe("reached");
        expect(fillPercent).toBeCloseTo(77.66666666666669, 10);
        expect(points[0].planGrade).toBeCloseTo(77.31666666666668, 10);
        expect(points[1].planGrade).toBeCloseTo(77.42166666666668, 10);
    });

    it("takes one task from each criterion in turn and puts criteria with an expected % last", () => {
        const record = makeMixedRecord();
        record.targetGradeSandbox.terms = {
            prelim: { criteria: { AT: { upcoming: 2 }, Exam: { expected: 80 } } },
        };
        const { plan, points, fillPercent } = getPlanPoints(record, rule, "prelim", 80, 4);

        expect(plan.required).toBe(83.26);
        expect(fillPercent).toBe(83.26);
        expect(
            points.map((point) => [point.step, point.label, point.percent, point.isExpected]),
        ).toEqual([
            [5, "Upcoming AT task 1", 83.26, false],
            [6, "TLA 2", 83.26, false],
            [7, "Upcoming AT task 2", 83.26, false],
            [8, "Exam 1", 80, true],
        ]);
        expect(points[0].planGrade).toBeCloseTo(78.8205, 10);
        expect(points[1].planGrade).toBeCloseTo(79.3095, 10);
        expect(points[2].planGrade).toBeCloseTo(80.0018, 10);
        expect(points[3].planGrade).toBeCloseTo(80.00126, 10);
    });

    it("a single upcoming task has no number in its label, and steps start at 1 by default", () => {
        const record = makeSeedDb().classes[0].studentRecords[0];
        const { points, fillPercent } = getPlanPoints(record, rule, "midterm", 90);
        expect(fillPercent).toBe(90);
        expect(points.map((point) => [point.step, point.label])).toEqual([
            [1, "Upcoming AT task"],
            [2, "Upcoming TLA task"],
            [3, "Upcoming Exam task"],
        ]);
        points.forEach((point) => expect(point.planGrade).toBeCloseTo(90, 10));
    });

    it('returns no points when the plan is "complete" or "empty"', () => {
        const complete = makeMixedRecord();
        complete.targetGradeSandbox.terms = {
            prelim: { criteria: { TLA: { expected: 70 }, Exam: { expected: 80 } } },
        };
        expect(getPlanPoints(complete, rule, "prelim", 90)).toMatchObject({
            points: [],
            fillPercent: null,
        });
        expect(getPlanPoints(complete, rule, "prelim", 90).plan.status).toBe("complete");

        const empty = getPlanPoints(makeMixedRecord(), null, "prelim", 90);
        expect(empty).toMatchObject({ points: [], fillPercent: null });
        expect(empty.plan.status).toBe("empty");
    });

    it("does not change the record it was given", () => {
        const record = makeMixedRecord();
        getPlanPoints(record, rule, "prelim", 80);
        expect(record).toEqual(makeMixedRecord());
    });
});

describe("getCoursesHistory", () => {
    it("returns one history line per enrolled subject", () => {
        const courses = getCoursesHistory(makeSeedDb(), "U1", "prelim");
        expect(courses).toHaveLength(1);
        expect(courses[0]).toMatchObject({
            classId: "C101",
            subjectCode: "IT101",
            subjectName: "Computer Systems Servicing",
            target: 90,
            reachedIndex: 1,
        });
        expect(
            courses[0].points.map((point) => [
                point.step,
                point.label,
                point.taskId,
                point.isOfficial,
            ]),
        ).toEqual([
            [1, "AT 1 - Chapter 4 Quiz", "AT-1", true],
            [2, "AT 2 - Pop Quiz", "AT-2", false],
        ]);
        courses[0].points.forEach((point) => expect(point.grade).toBeCloseTo(90, 10));
    });

    it("has no points for a term without scores", () => {
        const [course] = getCoursesHistory(makeSeedDb(), "U1", "finals");
        expect(course).toMatchObject({ points: [], reachedIndex: -1, target: 90 });
    });

    it("filters by semester and by student", () => {
        expect(getCoursesHistory(makeSeedDb(), "U1", "prelim", "first-2026–2027")).toHaveLength(1);
        expect(getCoursesHistory(makeSeedDb(), "U1", "prelim", "second-2026–2027")).toEqual([]);
        expect(getCoursesHistory(makeSeedDb(), "U2", "prelim")).toEqual([]);
        expect(getCoursesHistory(null, "U1", "prelim")).toEqual([]);
    });

    it("keeps a class whose subject or rule is missing", () => {
        const db = makeSeedDb();
        db.subjects = [];
        db.computationRules = [];
        expect(getCoursesHistory(db, "U1", "prelim")[0]).toMatchObject({
            subjectCode: "Unknown subject",
            subjectName: "",
            points: [],
        });
    });
});

describe("getChartScale", () => {
    it("starts the y axis 10 below the lowest value, rounded down to a multiple of 10", () => {
        const scale = getChartScale([90, 77.6], 4);
        expect(scale.yTicks).toEqual([60, 70, 80, 90, 100]);
        expect(scale.yDomain[0]).toBe(60);
        expect(scale.yDomain[1]).toBeCloseTo(102.4, 10);
        expect(scale.xDomain).toEqual([1, 4]);
        expect(scale.xTicks).toEqual([1, 2, 3, 4]);
    });

    it("uses ticks of 20 when the y range is over 50", () => {
        expect(getChartScale([35, 100], 30)).toMatchObject({ yTicks: [20, 40, 60, 80, 100] });
        expect(getChartScale([8], 13)).toMatchObject({
            yTicks: [0, 20, 40, 60, 80, 100],
            yDomain: [0, 106],
        });
    });

    it("keeps a small gap above 100", () => {
        expect(getChartScale([100], 12)).toMatchObject({ yTicks: [90, 100], yDomain: [90, 102] });
    });

    it("shows one x tick per task up to 12 tasks, then about 10 ticks", () => {
        expect(getChartScale([100], 12).xTicks).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        expect(getChartScale([8], 13).xTicks).toEqual([1, 3, 5, 7, 9, 11, 13]);
        expect(getChartScale([35, 100], 30)).toMatchObject({
            xDomain: [1, 30],
            xTicks: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 30],
        });
    });

    it("handles no values and no steps", () => {
        expect(getChartScale([], 0)).toEqual({
            yDomain: [0, 106],
            yTicks: [0, 20, 40, 60, 80, 100],
            xDomain: [1, 2],
            xTicks: [1],
        });
        expect(getChartScale([null, NaN, undefined], 1).yTicks).toEqual([0, 20, 40, 60, 80, 100]);
    });

    it("re-exports the passing grade", () => {
        expect(PASSING_GRADE).toBe(75);
    });
});

describe("target gap and accuracy thresholds", () => {
    it("measures the latest grade against the target", () => {
        expect(getTargetGap(92.5, 90)).toBe(2.5);
        expect(getTargetGap(80, 90)).toBe(-10);
        expect(getTargetGap(null, 90)).toBeNull();
        expect(getTargetGap(80, null)).toBeNull();
    });

    it("treats a gap under 0.005 as on target", () => {
        expect(isOnTarget(0.004)).toBe(true);
        expect(isOnTarget(-0.004)).toBe(true);
        expect(isOnTarget(0.005)).toBe(false);
    });

    it("treats an average gap under 0.05 as spot on", () => {
        expect(isSpotOn(0.049)).toBe(true);
        expect(isSpotOn(-0.049)).toBe(true);
        expect(isSpotOn(0.05)).toBe(false);
    });
});
