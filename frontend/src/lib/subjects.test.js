// Characterization tests for subjects.js: semesters, enrolled subjects,
// adding a subject. The date is frozen at 11 Nov 2026 (src/test/setup.js).
import { describe, expect, it } from "vitest";
import { FIXED_NOW_ISO } from "@/test/fixedDate.js";
import { makeSeedDb, makeTask } from "@/test/fixtures.js";
import {
    addSubject,
    getClassSemesterId,
    getCurrentSemester,
    getEnrolledSubjects,
    getInitialRuleId,
    getSemesterOptions,
    PASSING_GRADE,
    removeEnrollment,
} from "./subjects.js";

const FIRST = "first-2026–2027";
const SECOND = "second-2026–2027";
const SUMMER = "summer-2026–2027";

describe("semesters", () => {
    it("lists the three semesters of the current academic year", () => {
        expect(getSemesterOptions()).toEqual([
            {
                id: FIRST,
                semester: "First Semester",
                startMonth: 7,
                endMonth: 11,
                academicYear: "2026–2027",
                isCurrent: true,
            },
            {
                id: SECOND,
                semester: "Second Semester",
                startMonth: 0,
                endMonth: 4,
                academicYear: "2026–2027",
                isCurrent: false,
            },
            {
                id: SUMMER,
                semester: "Summer",
                startMonth: 5,
                endMonth: 6,
                academicYear: "2026–2027",
                isCurrent: false,
            },
        ]);
    });

    it("picks the current semester from the month", () => {
        const current = (year, month) => getCurrentSemester(new Date(year, month, 15)).id;
        expect(current(2026, 7)).toBe(FIRST); // August
        expect(current(2026, 11)).toBe(FIRST); // December
        expect(current(2027, 0)).toBe(SECOND); // January
        expect(current(2027, 4)).toBe(SECOND); // May
        expect(current(2027, 5)).toBe(SUMMER); // June
        expect(current(2027, 6)).toBe(SUMMER); // July
        expect(current(2027, 7)).toBe("first-2027–2028"); // next August
    });

    it("uses the frozen date by default", () => {
        expect(getCurrentSemester().id).toBe(FIRST);
    });

    it("reads the semester saved on a class", () => {
        const classItem = { semester: "Second Semester", academicYear: "2025–2026" };
        expect(getClassSemesterId(classItem)).toBe("second-2025–2026");
        expect(getClassSemesterId({ semester: "Summer" })).toBe(SUMMER);
    });

    it("returns undefined for a semester name it does not know", () => {
        expect(
            getClassSemesterId({ semester: "Trimester 1", academicYear: "2026–2027" }),
        ).toBeUndefined();
    });

    it("a class without a semester follows the date (docs/AUDIT.md B12)", () => {
        const seedClass = makeSeedDb().classes[0];
        expect(getClassSemesterId(seedClass)).toBe(FIRST);
        // In February it is still "first", while the current semester is "second".
        const february = new Date(2027, 1, 15);
        expect(getClassSemesterId(seedClass, february)).toBe(FIRST);
        expect(getCurrentSemester(february).id).toBe(SECOND);
        // The next academic year it moves to that year's first semester.
        expect(getClassSemesterId(seedClass, new Date(2027, 8, 15))).toBe("first-2027–2028");
    });
});

describe("getEnrolledSubjects", () => {
    it("returns one row per enrolled subject, with both final grades and a status", () => {
        const rows = getEnrolledSubjects(makeSeedDb(), "U1");
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
            classId: "C101",
            subjectCode: "IT101",
            subjectName: "Computer Systems Servicing",
            professor: "Prof. Maria Santos",
            status: "passing",
        });
        expect(rows[0].officialGrade).toBeCloseTo(90, 10);
        expect(rows[0].expectedGrade).toBeCloseTo(90, 10);
    });

    it("filters by semester", () => {
        expect(getEnrolledSubjects(makeSeedDb(), "U1", FIRST)).toHaveLength(1);
        expect(getEnrolledSubjects(makeSeedDb(), "U1", SECOND)).toEqual([]);
    });

    it("returns nothing for a student without a record, or without a database", () => {
        expect(getEnrolledSubjects(makeSeedDb(), "U2")).toEqual([]);
        expect(getEnrolledSubjects(null, "U1")).toEqual([]);
    });

    it("skips a class whose subject is missing", () => {
        const db = makeSeedDb();
        db.subjects = [];
        expect(getEnrolledSubjects(db, "U1")).toEqual([]);
    });

    it('status follows the expected grade: 75 passes, below 75 does not, null is "none"', () => {
        expect(PASSING_GRADE).toBe(75);
        const statusFor = (tasks) => {
            const db = makeSeedDb();
            db.classes[0].studentRecords[0].grades = { prelim: { AT: tasks } };
            return getEnrolledSubjects(db, "U1")[0];
        };
        expect(statusFor([makeTask("a", 100, null, 75)])).toMatchObject({
            status: "passing",
            officialGrade: null,
        });
        expect(statusFor([makeTask("a", 100, null, 74.99)]).status).toBe("below");
        expect(statusFor([])).toMatchObject({
            status: "none",
            officialGrade: null,
            expectedGrade: null,
        });
    });

    it('professor: the class name wins, then the user, then "Awaiting assignment"', () => {
        const db = makeSeedDb();
        db.classes[0].professorName = "Prof. Typed Name";
        expect(getEnrolledSubjects(db, "U1")[0].professor).toBe("Prof. Typed Name");

        const unassigned = makeSeedDb();
        unassigned.classes[0].professorId = null;
        expect(getEnrolledSubjects(unassigned, "U1")[0].professor).toBe("Awaiting assignment");
    });
});

describe("getInitialRuleId", () => {
    it("starts on the rule of the most recently added subject", () => {
        const db = makeSeedDb();
        db.computationRules.push({ ...db.computationRules[0], id: "CR-2", ruleName: "Other" });
        db.classes.push({ ...db.classes[0], id: "C-102", computationRuleId: "CR-2" });
        expect(getInitialRuleId(db, "U1")).toBe("CR-2");
    });

    it('falls back to the first rule, then to ""', () => {
        expect(getInitialRuleId(makeSeedDb(), "U9")).toBe("CR-1");
        expect(getInitialRuleId({ computationRules: [], classes: [] }, "U1")).toBe("");
        expect(getInitialRuleId(null, "U1")).toBe("");
    });
});

describe("addSubject", () => {
    const values = {
        subjectCode: " cs201 ",
        subjectName: " Data Structures ",
        professorName: " Prof. Lee ",
        section: " BSCS-2B ",
        computationRuleId: "CR-1",
    };

    it("adds a subject, a pending class in the current semester and a verification request", () => {
        const db = makeSeedDb();
        const result = addSubject(db, "U1", values);

        expect(result.ok).toBe(true);
        expect(result.classItem).toEqual({
            id: "C-102",
            subjectId: "SUB-2",
            semester: "First Semester",
            academicYear: "2026–2027",
            programSection: "BSCS-2B",
            units: 3,
            professorId: null,
            professorName: "Prof. Lee",
            status: "pending",
            computationRuleId: "CR-1",
            studentRecords: [
                {
                    studentId: "U1",
                    targetGradeSandbox: { desiredFinalGrade: 90 },
                    grades: { prelim: {}, midterm: {}, finals: {} },
                },
            ],
        });
        expect(result.db.subjects[1]).toEqual({
            id: "SUB-2",
            subjectCode: "CS201",
            subjectName: "Data Structures",
            defaultComputationRuleId: "CR-1",
        });
        expect(result.db.classes).toHaveLength(2);
        expect(result.db.classes[1]).toBe(result.classItem);
        expect(result.db.verificationQueue[1]).toEqual({
            id: "REQ-2",
            requestedByStudentId: "U1",
            subjectId: "SUB-2",
            subjectCode: "CS201",
            subjectName: "Data Structures",
            programSection: "BSCS-2B",
            requestedProfessorId: null,
            requestedProfessorName: "Prof. Lee",
            computationRuleId: "CR-1",
            status: "pending",
            createdAt: FIXED_NOW_ISO,
        });
    });

    it("does not change the database it was given", () => {
        const db = makeSeedDb();
        addSubject(db, "U1", values);
        expect(db).toEqual(makeSeedDb());
    });

    it("rejects a code the student already has, in any letter case", () => {
        const result = addSubject(makeSeedDb(), "U1", { ...values, subjectCode: "it101" });
        expect(result).toEqual({
            ok: false,
            fieldErrors: { subjectCode: "You already have a subject with that code." },
        });
    });

    it("lets another student add the same subject and reuses it when code and name match", () => {
        const db = makeSeedDb();
        const result = addSubject(db, "U9", {
            ...values,
            subjectCode: "IT101",
            subjectName: "computer systems servicing",
        });
        expect(result.ok).toBe(true);
        expect(result.db.subjects).toBe(db.subjects);
        expect(result.classItem.subjectId).toBe("SUB-1");
    });

    it("adds a new subject when the code matches but the name differs", () => {
        const result = addSubject(makeSeedDb(), "U9", {
            ...values,
            subjectCode: "IT101",
            subjectName: "Networking",
        });
        expect(result.db.subjects.map((subject) => subject.id)).toEqual(["SUB-1", "SUB-2"]);
        expect(result.classItem.subjectId).toBe("SUB-2");
    });

    it("uses the first rule when none is chosen", () => {
        const result = addSubject(makeSeedDb(), "U1", { ...values, computationRuleId: "" });
        expect(result.classItem.computationRuleId).toBe("CR-1");
    });

    it("reports a rule that does not exist", () => {
        expect(addSubject(makeSeedDb(), "U1", { ...values, computationRuleId: "CR-9" })).toEqual({
            ok: false,
            fieldErrors: { computationRuleId: "Choose a grading rule for this subject." },
        });
    });

    it("reports when there are no rules at all", () => {
        const db = makeSeedDb();
        db.computationRules = [];
        expect(addSubject(db, "U1", { ...values, computationRuleId: "" })).toEqual({
            ok: false,
            formError: "Create a grading rule on the Grade Rules page before adding subjects.",
        });
    });

    it("does not check that the fields are filled in", () => {
        const result = addSubject(makeSeedDb(), "U1", { computationRuleId: "CR-1" });
        expect(result.ok).toBe(true);
        expect(result.db.subjects[1]).toMatchObject({ subjectCode: "", subjectName: "" });
    });
});

describe("removeEnrollment", () => {
    const remove = (db, overrides = {}) =>
        removeEnrollment(db, {
            classId: "C101",
            studentId: "U1",
            subjectCode: "IT101",
            subjectName: "Computer Systems Servicing",
            ...overrides,
        });

    it("removes the class, its unused subject and the student's pending request", () => {
        const db = makeSeedDb();
        const next = remove(db);
        expect(next.classes).toEqual([]);
        expect(next.subjects).toEqual([]);
        expect(next.verificationQueue).toEqual(
            db.verificationQueue.filter(
                (request) =>
                    !(
                        request.requestedByStudentId === "U1" &&
                        request.subjectId === "SUB-1" &&
                        request.status === "pending"
                    ),
            ),
        );
        expect(next.users).toBe(db.users);
    });

    it("keeps a class that other students still have, and its subject", () => {
        const db = makeSeedDb();
        db.classes[0].studentRecords.push({ studentId: "U9", grades: {} });
        const next = remove(db);
        expect(next.classes).toHaveLength(1);
        expect(next.classes[0].studentRecords.map((record) => record.studentId)).toEqual(["U9"]);
        expect(next.subjects).toBe(db.subjects);
    });

    it("matches a request without a subject id by code and name, ignoring case and spaces", () => {
        const db = makeSeedDb();
        db.verificationQueue = [
            {
                id: "REQ-A",
                requestedByStudentId: "U1",
                subjectId: null,
                subjectCode: " it101 ",
                subjectName: "computer systems servicing",
                status: "pending",
            },
            {
                id: "REQ-B",
                requestedByStudentId: "U1",
                subjectId: null,
                subjectCode: "CS201",
                subjectName: "Other",
                status: "pending",
            },
            { id: "REQ-C", requestedByStudentId: "U2", subjectId: "SUB-1", status: "pending" },
            { id: "REQ-D", requestedByStudentId: "U1", subjectId: "SUB-1", status: "approved" },
        ];
        expect(remove(db).verificationQueue.map((request) => request.id)).toEqual([
            "REQ-B",
            "REQ-C",
            "REQ-D",
        ]);
    });

    it("returns null for an unknown class and leaves the db unchanged", () => {
        const db = makeSeedDb();
        const before = structuredClone(db);
        expect(remove(db, { classId: "C999" })).toBeNull();
        remove(db);
        expect(db).toEqual(before);
    });
});
