import { describe, expect, it } from "vitest";
import { updateStudentRecord } from "./records.js";

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
