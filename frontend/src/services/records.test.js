import { describe, expect, it } from "vitest";
import { makeSeedDb } from "@/test/fixtures";
import { getStudentClass, updateStudentRecord } from "./records.js";

function makeDb() {
    return {
        users: [{ id: "U1" }],
        classes: [
            {
                id: "C1",
                studentRecords: [
                    { studentId: "U1", grades: { prelim: {} } },
                    { studentId: "U2", grades: { prelim: {} } },
                ],
            },
            { id: "C2", studentRecords: [{ studentId: "U1", grades: {} }] },
        ],
    };
}

describe("updateStudentRecord", () => {
    it("replaces only the matching record in the matching class", () => {
        const db = makeDb();
        const next = updateStudentRecord(db, "C1", "U1", (record) => ({ ...record, marked: true }));

        expect(next.classes[0].studentRecords[0]).toEqual({
            studentId: "U1",
            grades: { prelim: {} },
            marked: true,
        });
        expect(next.classes[0].studentRecords[1]).toBe(db.classes[0].studentRecords[1]);
        expect(next.classes[1]).toBe(db.classes[1]);
        expect(next.users).toBe(db.users);
    });

    it("does not change the db it was given", () => {
        const db = makeDb();
        const before = structuredClone(db);
        updateStudentRecord(db, "C1", "U1", (record) => ({ ...record, marked: true }));
        expect(db).toEqual(before);
    });

    it("passes the current record to update", () => {
        const db = makeDb();
        let seen = null;
        updateStudentRecord(db, "C2", "U1", (record) => {
            seen = record;
            return record;
        });
        expect(seen).toBe(db.classes[1].studentRecords[0]);
    });

    it("returns an equal db when nothing matches", () => {
        const db = makeDb();
        const next = updateStudentRecord(db, "C9", "U1", () => ({}));
        expect(next).toEqual(db);
        expect(next).not.toBe(db);
        expect(updateStudentRecord(db, "C1", "U9", () => ({}))).toEqual(db);
    });
});

describe("getStudentClass", () => {
    it("finds the class, its subject, the student's record and the rule", () => {
        const db = makeSeedDb();
        const result = getStudentClass(db, "C101", "U1");
        expect(result.classItem).toBe(db.classes[0]);
        expect(result.subject).toBe(db.subjects[0]);
        expect(result.record).toBe(db.classes[0].studentRecords[0]);
        expect(result.rule).toBe(db.computationRules[0]);
    });

    it("has no record for a student who isn't in the class", () => {
        const db = makeSeedDb();
        const result = getStudentClass(db, "C101", "U9");
        expect(result.classItem).toBe(db.classes[0]);
        expect(result.record).toBeUndefined();
    });

    it("finds nothing for an unknown class or a missing database", () => {
        expect(getStudentClass(makeSeedDb(), "C999", "U1")).toEqual({
            classItem: undefined,
            subject: undefined,
            record: undefined,
            rule: undefined,
        });
        expect(getStudentClass(null, "C101", "U1")).toEqual({
            classItem: undefined,
            subject: undefined,
            record: undefined,
            rule: undefined,
        });
    });

    it("leaves the subject or rule undefined when they are missing", () => {
        const db = makeSeedDb();
        db.subjects = [];
        db.computationRules = [];
        const result = getStudentClass(db, "C101", "U1");
        expect(result.record).toBe(db.classes[0].studentRecords[0]);
        expect(result.subject).toBeUndefined();
        expect(result.rule).toBeUndefined();
    });
});
