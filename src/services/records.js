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
