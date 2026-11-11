// Characterization tests for migrations.js (stored data, schema v1 -> v2).
import { describe, expect, it } from "vitest";
import { makeSeedDb, makeStandardRule, makeTask } from "@/test/fixtures.js";
import { migrateDb, needsMigration, SCHEMA_VERSION } from "./migrations.js";

// A database in the old format: no schemaVersion, a rule with "hierarchy",
// and each term's exam stored as a single object.
function makeV1Db() {
    return {
        users: [{ id: "U1", role: "student" }],
        computationRules: [
            {
                id: "CR-1",
                ruleName: "Old Rule",
                hierarchy: { classwork: 0.6, classworkSplit: { AT: 0.5 } },
                effectiveMultipliers: { AT: 0.3, TLA: 0.3, Exam: 0.4 },
            },
        ],
        classes: [
            {
                id: "C101",
                computationRuleId: "CR-1",
                studentRecords: [
                    {
                        studentId: "U1",
                        grades: {
                            // An empty exam placeholder becomes an empty list.
                            prelim: {
                                AT: [makeTask("a", 20, 18)],
                                Exam: {
                                    id: "C101-PRELIM-EXAM",
                                    maxScore: 100,
                                    officialScore: null,
                                    studentReportedScore: null,
                                },
                            },
                            // A scored exam becomes a one-task list.
                            midterm: {
                                AT: [],
                                Exam: { id: "C101-MIDTERM-EXAM", maxScore: 100, officialScore: 85 },
                            },
                            // An unscored exam with another kind of id is kept.
                            finals: {
                                Exam: {
                                    id: "final-project",
                                    maxScore: 50,
                                    isCustomTask: true,
                                    sequenceNumber: 4,
                                },
                            },
                        },
                    },
                ],
            },
        ],
    };
}

describe("needsMigration", () => {
    it("is true for data older than the current schema", () => {
        expect(SCHEMA_VERSION).toBe(2);
        expect(needsMigration({})).toBe(true);
        expect(needsMigration({ schemaVersion: 1 })).toBe(true);
        expect(needsMigration({ schemaVersion: 2 })).toBe(false);
        expect(needsMigration({ schemaVersion: 3 })).toBe(false);
    });

    it("is false for anything that is not an object", () => {
        expect(needsMigration(null)).toBe(false);
        expect(needsMigration(undefined)).toBe(false);
        expect(needsMigration("text")).toBe(false);
    });
});

describe("migrateDb", () => {
    it("returns current data untouched", () => {
        const db = makeSeedDb();
        expect(migrateDb(db)).toBe(db);
        expect(migrateDb(null)).toBeNull();
    });

    it("rebuilds a legacy rule as a criteria tree with tags and schools", () => {
        const [rule] = migrateDb(makeV1Db()).computationRules;
        expect(rule).toEqual({
            id: "CR-1",
            ruleName: "Old Rule",
            tags: [],
            schools: [],
            criteria: [
                {
                    id: "classwork",
                    name: "Classwork",
                    weight: 0.6,
                    children: [
                        { id: "AT", name: "AT", weight: 0.5, children: [] },
                        { id: "TLA", name: "TLA", weight: 0.5, children: [] },
                    ],
                },
                { id: "Exam", name: "Exam", weight: 0.4, children: [] },
            ],
            effectiveMultipliers: { AT: 0.3, TLA: 0.3, Exam: 0.4 },
        });
    });

    it("keeps a rule that already has criteria, and only adds what is missing", () => {
        const db = makeV1Db();
        db.computationRules = [
            {
                ...makeStandardRule(),
                tags: undefined,
                schools: undefined,
                hierarchy: { classwork: 0.1 },
            },
        ];
        const [rule] = migrateDb(db).computationRules;
        expect(rule).toEqual({ ...makeStandardRule(), tags: [], schools: [] });
    });

    it("turns each single exam object into a task list", () => {
        const grades = migrateDb(makeV1Db()).classes[0].studentRecords[0].grades;
        expect(grades.prelim).toEqual({ AT: [makeTask("a", 20, 18)], Exam: [] });
        expect(grades.midterm.Exam).toEqual([
            {
                id: "C101-MIDTERM-EXAM",
                maxScore: 100,
                officialScore: 85,
                sequenceNumber: 1,
                isCustomTask: false,
            },
        ]);
        expect(grades.finals.Exam).toEqual([
            { id: "final-project", maxScore: 50, isCustomTask: true, sequenceNumber: 4 },
        ]);
    });

    it("leaves terms alone when the exam is already a list or is missing", () => {
        const db = makeV1Db();
        db.classes[0].studentRecords[0].grades = {
            prelim: { Exam: [makeTask("e", 100, 90)] },
            midterm: { AT: [] },
        };
        const grades = migrateDb(db).classes[0].studentRecords[0].grades;
        expect(grades).toEqual({ prelim: { Exam: [makeTask("e", 100, 90)] }, midterm: { AT: [] } });
    });

    it("sets the schema version and keeps everything else", () => {
        const db = makeV1Db();
        const upgraded = migrateDb(db);
        expect(upgraded.schemaVersion).toBe(2);
        expect(upgraded.users).toBe(db.users);
        expect(upgraded.classes[0]).toMatchObject({ id: "C101", computationRuleId: "CR-1" });
    });

    it("does not change the data it was given, and running it twice changes nothing more", () => {
        const db = makeV1Db();
        const upgraded = migrateDb(db);
        expect(db).toEqual(makeV1Db());
        expect(migrateDb(upgraded)).toBe(upgraded);
    });

    it("handles a database with no rules or classes", () => {
        expect(migrateDb({})).toEqual({ schemaVersion: 2, computationRules: [], classes: [] });
    });
});
