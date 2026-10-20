export function getOfficialAssessments(termGrades) {
    if (!termGrades) return [];

    const tasks = [
        ...(termGrades.AT ?? []).filter((task) => !task.isCustomTask),
        ...(termGrades.TLA ?? []).filter((task) => !task.isCustomTask),
    ];
    if (termGrades.Exam) tasks.push(termGrades.Exam);

    return tasks.filter(
        (task) => task.officialScore !== null && task.officialScore !== undefined
    );
}

export function calculateOfficialGrade(studentRecord, term, computationRule) {
    const termGrades = studentRecord?.grades?.[term.toLowerCase()];
    if (!termGrades) return null;

    const hierarchy = computationRule?.hierarchy;
    const classworkWeight = hierarchy?.classwork ?? 0.7;
    const examWeight = hierarchy?.exam ?? 0.3;
    const assessmentWeight =
        classworkWeight * (hierarchy?.classworkSplit?.AT ?? 0.7);
    const activityWeight =
        classworkWeight * (hierarchy?.classworkSplit?.TLA ?? 0.3);
    const weightedGrades = [];

    for (const [category, weight] of [
        ["AT", assessmentWeight],
        ["TLA", activityWeight],
    ]) {
        const scoredTasks = (termGrades[category] ?? []).filter(
            (task) =>
                !task.isCustomTask &&
                task.officialScore !== null &&
                task.officialScore !== undefined
        );
        const possiblePoints = scoredTasks.reduce(
            (total, task) => total + Number(task.maxScore),
            0
        );
        if (possiblePoints > 0) {
            const earnedPoints = scoredTasks.reduce(
                (total, task) => total + Number(task.officialScore),
                0
            );
            weightedGrades.push({
                grade: (earnedPoints / possiblePoints) * 100,
                weight,
            });
        }
    }

    const exam = termGrades.Exam;
    if (
        exam?.officialScore !== null &&
        exam?.officialScore !== undefined &&
        Number(exam.maxScore) > 0
    ) {
        weightedGrades.push({
            grade: (Number(exam.officialScore) / Number(exam.maxScore)) * 100,
            weight: examWeight,
        });
    }

    const totalWeight = weightedGrades.reduce(
        (total, item) => total + item.weight,
        0
    );
    if (totalWeight === 0) return null;

    const weightedTotal = weightedGrades.reduce(
        (total, item) => total + item.grade * item.weight,
        0
    );
    return weightedTotal / totalWeight;
}
