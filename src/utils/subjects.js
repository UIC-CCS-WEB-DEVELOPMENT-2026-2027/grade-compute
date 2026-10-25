// src/utils/subjects.js
// Subject helpers shared by the Dashboard and My Subjects pages: semesters,
// the student's enrolled subjects, and adding a subject.
// Pure functions only (no React, no localStorage). Save results with saveDb().
import {
    calculateOfficialFinalGrade,
    calculateUnofficialFinalGrade,
} from "./grades.js";
import { nextId } from "./rules.js";

export const PASSING_GRADE = 75;

// ---------------------------------------------------------------------------
// Semesters
// ---------------------------------------------------------------------------

const SEMESTERS = [
    { id: "first", semester: "First Semester", startMonth: 7, endMonth: 11 },
    { id: "second", semester: "Second Semester", startMonth: 0, endMonth: 4 },
    { id: "summer", semester: "Summer", startMonth: 5, endMonth: 6 },
];

function getAcademicYearStart(year, month) {
    return month >= 7 ? year : year - 1;
}

// Semester options for the given date (defaults to today).
export function getSemesterOptions(date = new Date()) {
    const month = date.getMonth();
    const start = getAcademicYearStart(date.getFullYear(), month);
    const academicYear = `${start}–${start + 1}`;
    return SEMESTERS.map((semester) => ({
        ...semester,
        id: `${semester.id}-${academicYear}`,
        academicYear,
        isCurrent: month >= semester.startMonth && month <= semester.endMonth,
    }));
}

export function getCurrentSemester(date = new Date()) {
    const options = getSemesterOptions(date);
    return options.find((option) => option.isCurrent) ?? options[0];
}

// Which semester option a class belongs to. Classes saved without a
// semester count as the first semester of the current academic year.
export function getClassSemesterId(classItem, date = new Date()) {
    const academicYear = getCurrentSemester(date).academicYear;
    const semesterName = classItem.semester ?? SEMESTERS[0].semester;
    const year = classItem.academicYear ?? academicYear;
    const semester = SEMESTERS.find((option) => option.semester === semesterName);
    return semester ? `${semester.id}-${year}` : undefined;
}

// ---------------------------------------------------------------------------
// Enrolled subjects
// ---------------------------------------------------------------------------

// One row per subject the student is enrolled in (optionally one semester).
// grades: official = professor scores only; expected = official scores with
// the student's own scores filling the gaps (grades-guide.txt). Both are the
// final grade so far, with the three terms counting equally.
export function getEnrolledSubjects(db, studentId, semesterId = null) {
    return (db?.classes ?? []).flatMap((classItem) => {
        if (semesterId && getClassSemesterId(classItem) !== semesterId) return [];
        const record = classItem.studentRecords?.find((item) => item.studentId === studentId);
        const subject = db.subjects?.find((item) => item.id === classItem.subjectId);
        if (!record || !subject) return [];

        const rule = db.computationRules?.find((item) => item.id === classItem.computationRuleId);
        const officialGrade = calculateOfficialFinalGrade(record, rule);
        const expectedGrade = calculateUnofficialFinalGrade(record, rule);
        const professor =
            classItem.professorName ??
            db.users?.find((user) => user.id === classItem.professorId)?.name ??
            "Awaiting assignment";

        // Status follows the expected grade: it already prefers official
        // scores, so it is the most complete picture of where the student is.
        const statusGrade = expectedGrade;
        const status = statusGrade === null
            ? "none"
            : statusGrade >= PASSING_GRADE ? "passing" : "below";

        return [{
            classId: classItem.id,
            subjectCode: subject.subjectCode,
            subjectName: subject.subjectName,
            professor,
            officialGrade,
            expectedGrade,
            status,
        }];
    });
}

// ---------------------------------------------------------------------------
// Adding a subject
// ---------------------------------------------------------------------------

// The rule the Add Subject form starts on: the rule of the student's most
// recently added subject (students usually add several subjects from the
// same school), or the first rule.
export function getInitialRuleId(db, studentId) {
    const rules = db?.computationRules ?? [];
    const lastUsed = [...(db?.classes ?? [])]
        .reverse()
        .find((classItem) =>
            classItem.studentRecords?.some((record) => record.studentId === studentId) &&
            rules.some((rule) => rule.id === classItem.computationRuleId)
        )?.computationRuleId;
    return lastUsed ?? rules[0]?.id ?? "";
}

// values: { subjectCode, subjectName, professorName, section, computationRuleId }
// Returns { ok, db, classItem } or { ok: false, fieldErrors | formError }.
export function addSubject(db, studentId, values, date = new Date()) {
    const code = String(values.subjectCode ?? "").trim().toUpperCase();
    const name = String(values.subjectName ?? "").trim();
    const instructor = String(values.professorName ?? "").trim();
    const programSection = String(values.section ?? "").trim();

    // Subjects are shared by all students; enrollments (classes with a
    // studentRecord) are per student. Only block a code this student
    // already has, so different students can add the same subject.
    const subjectsByCode = (db?.subjects ?? []).filter(
        (subject) => String(subject.subjectCode ?? "").toUpperCase() === code
    );
    const alreadyEnrolled = (db?.classes ?? []).some((classItem) =>
        subjectsByCode.some((subject) => subject.id === classItem.subjectId) &&
        classItem.studentRecords?.some((record) => record.studentId === studentId)
    );
    if (alreadyEnrolled) {
        return { ok: false, fieldErrors: { subjectCode: "You already have a subject with that code." } };
    }

    const rules = db?.computationRules ?? [];
    const rule = values.computationRuleId
        ? rules.find((item) => item.id === values.computationRuleId)
        : rules[0];
    if (!rule) {
        return values.computationRuleId
            ? { ok: false, fieldErrors: { computationRuleId: "Choose a grading rule for this subject." } }
            : { ok: false, formError: "Create a grading rule on the Grade Rules page before adding subjects." };
    }

    const semester = getCurrentSemester(date);
    // Reuse the shared subject when the code and name both match;
    // otherwise add a new one (the same code can mean different courses
    // at different schools).
    const existingSubject = subjectsByCode.find(
        (subject) => String(subject.subjectName ?? "").trim().toLowerCase() === name.toLowerCase()
    );
    const subjectId = existingSubject?.id ?? nextId(db.subjects ?? [], "SUB");
    const classId = nextId(db.classes ?? [], "C");
    const requestId = nextId(db.verificationQueue ?? [], "REQ");
    const subject = existingSubject ?? {
        id: subjectId,
        subjectCode: code,
        subjectName: name,
        defaultComputationRuleId: rule.id,
    };
    const classItem = {
        id: classId,
        subjectId,
        semester: semester.semester,
        academicYear: semester.academicYear,
        programSection,
        units: 3,
        professorId: null,
        professorName: instructor,
        status: "pending",
        computationRuleId: rule.id,
        studentRecords: [
            {
                studentId,
                targetGradeSandbox: { desiredFinalGrade: 90 },
                // Tasks are added per criterion of the rule, so terms start empty.
                grades: { prelim: {}, midterm: {}, finals: {} },
            },
        ],
    };
    const request = {
        id: requestId,
        requestedByStudentId: studentId,
        subjectId,
        subjectCode: code,
        subjectName: name,
        programSection,
        requestedProfessorId: null,
        requestedProfessorName: instructor,
        computationRuleId: rule.id,
        status: "pending",
        createdAt: date.toISOString(),
    };

    return {
        ok: true,
        classItem,
        db: {
            ...db,
            subjects: existingSubject ? db.subjects : [...(db.subjects ?? []), subject],
            classes: [...(db.classes ?? []), classItem],
            verificationQueue: [...(db.verificationQueue ?? []), request],
        },
    };
}
