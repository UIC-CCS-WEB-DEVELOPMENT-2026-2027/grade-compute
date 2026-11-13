// The Subject Detail celebration: shown when a grade reaches the term's
// target while the student is on the page.

export const CELEBRATION_MESSAGES = {
    both: "Both your official and expected grades reached the target!",
    official: "Your official grade reached the target!",
    expected: "Your expected grade reached the target!",
};

// Whether each grade has reached the target. A missing grade never has.
export function getAchievement(officialGrade, expectedGrade, target) {
    return {
        officialReached: officialGrade !== null && officialGrade >= target,
        expectedReached: expectedGrade !== null && expectedGrade >= target,
    };
}

// The message to celebrate with, or null. Only a grade that has just reached
// the target counts: previous is the achievement the student last saw for
// this subject and term (null when the page has only just opened).
export function getCelebrationMessage(previous, next) {
    if (!previous) return null;
    const officialJustReached = !previous.officialReached && next.officialReached;
    const expectedJustReached = !previous.expectedReached && next.expectedReached;
    if (officialJustReached && expectedJustReached) return CELEBRATION_MESSAGES.both;
    if (officialJustReached) return CELEBRATION_MESSAGES.official;
    if (expectedJustReached) return CELEBRATION_MESSAGES.expected;
    return null;
}
