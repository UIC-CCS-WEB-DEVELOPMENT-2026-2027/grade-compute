// Student records live inside their class: db.classes[].studentRecords[].

// Returns a new db in which one student's record in one class is replaced by
// update(record). Every other class and record is kept as it is (same
// objects). The caller saves the result and shows its own errors.
export function updateStudentRecord(db, classId, studentId, update) {
    return {
        ...db,
        classes: db.classes.map((item) =>
            item.id !== classId
                ? item
                : {
                      ...item,
                      studentRecords: item.studentRecords.map((record) =>
                          record.studentId !== studentId ? record : update(record),
                      ),
                  },
        ),
    };
}

// One student's view of one class: the class, its subject, the student's
// record in it and its grading rule. Each is undefined when it isn't found
// (no class, no record for this student, a missing subject or rule).
// db may be null (no stored data yet).
export function getStudentClass(db, classId, studentId) {
    const classItem = db?.classes?.find((item) => item.id === classId);
    return {
        classItem,
        subject: db?.subjects?.find((item) => item.id === classItem?.subjectId),
        record: classItem?.studentRecords?.find((item) => item.studentId === studentId),
        rule: db?.computationRules?.find((item) => item.id === classItem?.computationRuleId),
    };
}
