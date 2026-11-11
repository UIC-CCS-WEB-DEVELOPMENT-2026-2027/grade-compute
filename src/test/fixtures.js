// Shared inputs for the characterization tests.
import seedDb from "../utils/db.json";

// A fresh copy of the seed database (src/utils/db.json) for each test.
export function makeSeedDb() {
    return structuredClone(seedDb);
}

// The seed rule CR-1: Classwork 70% (AT 70%, TLA 30%) + Exam 30%.
// effectiveMultipliers = { AT: 0.49, TLA: 0.21, Exam: 0.3 }
export function makeStandardRule() {
    return structuredClone(seedDb.computationRules[0]);
}

export function makeTask(
    id,
    maxScore,
    officialScore = null,
    studentReportedScore = null,
    extra = {},
) {
    return {
        id,
        maxScore,
        officialScore,
        studentReportedScore,
        isCustomTask: false,
        ...extra,
    };
}

// A student record whose prelim term mixes all three task states:
//   AT:   a1 official 18/20 (90%), a2 custom self-reported 45/50 (90%),
//         a3 self-reported 5/10 (50%)
//   TLA:  t1 official 80/100 over a self-reported 60, t2 empty
//   Exam: e1 empty
export function makeMixedRecord() {
    return {
        studentId: "U1",
        targetGradeSandbox: { desiredFinalGrade: 90 },
        grades: {
            prelim: {
                AT: [
                    makeTask("a1", 20, 18),
                    makeTask("a2", 50, null, 45, { isCustomTask: true }),
                    makeTask("a3", 10, null, 5),
                ],
                TLA: [makeTask("t1", 100, 80, 60), makeTask("t2", 40)],
                Exam: [makeTask("e1", 100)],
            },
            midterm: { AT: [], TLA: [], Exam: [] },
            finals: { AT: [], TLA: [], Exam: [] },
        },
    };
}
