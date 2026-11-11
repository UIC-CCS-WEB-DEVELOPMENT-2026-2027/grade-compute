// Characterization tests: these record what grades.js returns today,
// right or wrong (docs/REFACTOR_WORKFLOW.md, Phase 2).
import { describe, expect, it } from 'vitest';
import { FIXED_NOW_ISO } from '../test/fixedDate.js';
import { makeMixedRecord, makeSeedDb, makeStandardRule, makeTask } from '../test/fixtures.js';
import {
  calculateOfficialFinalGrade,
  calculateOfficialGrade,
  calculateUnofficialFinalGrade,
  calculateUnofficialGrade,
  getOfficialAssessments,
  toTaskList,
  withStudentScore,
} from './grades.js';

const rule = makeStandardRule();

// A record with one criterion's tasks in prelim.
function recordWith(prelim) {
  return { grades: { prelim } };
}

describe('toTaskList', () => {
  it('returns arrays as they are', () => {
    const tasks = [makeTask('a', 10)];
    expect(toTaskList(tasks)).toBe(tasks);
  });

  it('wraps a legacy single task object in a list', () => {
    const exam = { id: 'EX', maxScore: 100 };
    expect(toTaskList(exam)).toEqual([exam]);
    expect(toTaskList({ maxScore: 50 })).toEqual([{ maxScore: 50 }]);
  });

  it('returns an empty list for anything else', () => {
    expect(toTaskList(null)).toEqual([]);
    expect(toTaskList(undefined)).toEqual([]);
    expect(toTaskList({})).toEqual([]);
    expect(toTaskList('AT')).toEqual([]);
    expect(toTaskList(5)).toEqual([]);
  });
});

describe('the three task states', () => {
  it('official grade counts only official scores and skips custom tasks', () => {
    // AT 90 (a1 only), TLA 80 -> (90 x 0.49 + 80 x 0.21) / 0.70
    expect(calculateOfficialGrade(makeMixedRecord(), 'prelim', rule)).toBeCloseTo(87, 10);
  });

  it('expected grade fills gaps with self-reported scores and includes custom tasks', () => {
    // AT mean(90, 90, 50), TLA 80 (official wins over the 60 the student entered)
    expect(calculateUnofficialGrade(makeMixedRecord(), 'prelim', rule)).toBeCloseTo(77.66666666666667, 10);
  });

  it('a self-reported score is ignored by the official grade', () => {
    const record = recordWith({ AT: [makeTask('a', 20, null, 15)] });
    expect(calculateOfficialGrade(record, 'prelim', rule)).toBeNull();
    expect(calculateUnofficialGrade(record, 'prelim', rule)).toBe(75);
  });

  it('an official score on a custom task counts only in the expected grade', () => {
    const record = recordWith({ AT: [makeTask('a', 20, 10, null, { isCustomTask: true })] });
    expect(calculateOfficialGrade(record, 'prelim', rule)).toBeNull();
    expect(calculateUnofficialGrade(record, 'prelim', rule)).toBe(50);
  });

  it('an empty task is not counted', () => {
    const record = recordWith({ AT: [makeTask('a', 20, 20), makeTask('b', 20)] });
    expect(calculateOfficialGrade(record, 'prelim', rule)).toBe(100);
    expect(calculateUnofficialGrade(record, 'prelim', rule)).toBe(100);
  });

  it('a score of 0 is a score, not empty', () => {
    const record = recordWith({ AT: [makeTask('a', 20, 0), makeTask('b', 20, 20)] });
    expect(calculateOfficialGrade(record, 'prelim', rule)).toBe(50);
  });
});

describe('score parsing', () => {
  it('reads scores and maxScore stored as text', () => {
    const record = recordWith({ AT: [makeTask('a', '50', '45')] });
    expect(calculateOfficialGrade(record, 'prelim', rule)).toBe(90);
  });

  it('treats "", null, undefined and non-numbers as empty', () => {
    const record = recordWith({
      AT: [
        makeTask('a', 20, ''),
        makeTask('b', 20, undefined),
        makeTask('c', 20, 'abc'),
        makeTask('d', 20, null),
      ],
    });
    expect(calculateOfficialGrade(record, 'prelim', rule)).toBeNull();
  });

  it('an official score of "" falls back to the self-reported score', () => {
    const record = recordWith({ AT: [makeTask('a', 20, '', 10)] });
    expect(calculateUnofficialGrade(record, 'prelim', rule)).toBe(50);
  });

  it('skips tasks whose maxScore is missing, zero, negative or not a number', () => {
    const record = recordWith({
      AT: [
        makeTask('a', 0, 5),
        makeTask('b', -10, 5),
        makeTask('c', null, 5),
        makeTask('d', 'x', 5),
        makeTask('e', 10, 5),
      ],
    });
    expect(calculateOfficialGrade(record, 'prelim', rule)).toBe(50);
  });

  it('does not clamp a score above maxScore', () => {
    const record = recordWith({ AT: [makeTask('a', 20, 25)] });
    expect(calculateOfficialGrade(record, 'prelim', rule)).toBe(125);
  });
});

describe('criterion and term grade', () => {
  it('every task counts equally, whatever its maxScore', () => {
    const record = recordWith({ AT: [makeTask('a', 10, 10), makeTask('b', 100, 0)] });
    expect(calculateOfficialGrade(record, 'prelim', rule)).toBe(50);
  });

  it('weights criteria by effectiveMultipliers', () => {
    const record = recordWith({
      AT: [makeTask('a', 100, 100)],
      TLA: [makeTask('t', 100, 50)],
      Exam: [makeTask('e', 100, 80)],
    });
    // 100 x 0.49 + 50 x 0.21 + 80 x 0.30
    expect(calculateOfficialGrade(record, 'prelim', rule)).toBeCloseTo(83.5, 10);
  });

  it('renormalises over the criteria that have a score ("grade so far")', () => {
    const record = recordWith({ AT: [makeTask('a', 100, 60)], TLA: [], Exam: [makeTask('e', 100)] });
    expect(calculateOfficialGrade(record, 'prelim', rule)).toBeCloseTo(60, 10);
  });

  it('ignores tasks stored under criteria that are not in the rule', () => {
    const record = recordWith({ Removed: [makeTask('r', 100, 100)], AT: [makeTask('a', 100, 40)] });
    expect(calculateOfficialGrade(record, 'prelim', rule)).toBeCloseTo(40, 10);
  });

  it('ignores criteria whose weight is 0, negative or not a number', () => {
    const custom = { effectiveMultipliers: { A: 0, B: -1, C: 'x', D: '0.5' } };
    const record = recordWith({
      A: [makeTask('a', 100, 10)],
      B: [makeTask('b', 100, 20)],
      C: [makeTask('c', 100, 30)],
      D: [makeTask('d', 100, 40)],
    });
    expect(calculateOfficialGrade(record, 'prelim', custom)).toBe(40);
  });

  it('reads a legacy single-object exam', () => {
    const record = recordWith({ Exam: { id: 'EX', maxScore: 100, officialScore: 70 } });
    expect(calculateOfficialGrade(record, 'prelim', rule)).toBeCloseTo(70, 10);
  });

  it('accepts the term name in any letter case', () => {
    expect(calculateOfficialGrade(makeMixedRecord(), 'Prelim', rule)).toBeCloseTo(87, 10);
    expect(calculateOfficialGrade(makeMixedRecord(), 'PRELIM', rule)).toBeCloseTo(87, 10);
  });

  it('returns null when nothing can be computed', () => {
    expect(calculateOfficialGrade(null, 'prelim', rule)).toBeNull();
    expect(calculateOfficialGrade({}, 'prelim', rule)).toBeNull();
    expect(calculateOfficialGrade(makeMixedRecord(), 'prelim', null)).toBeNull();
    expect(calculateOfficialGrade(makeMixedRecord(), 'prelim', {})).toBeNull();
    expect(calculateOfficialGrade(makeMixedRecord(), 'midterm', rule)).toBeNull();
    expect(calculateOfficialGrade(makeMixedRecord(), 'summer', rule)).toBeNull();
    expect(calculateOfficialGrade(makeMixedRecord(), undefined, rule)).toBeNull();
  });
});

describe('final grade', () => {
  it('is the mean of the terms that have a grade', () => {
    const record = {
      grades: {
        prelim: { AT: [makeTask('a', 100, 90)] },
        midterm: { AT: [makeTask('b', 100, 70)] },
        finals: { AT: [] },
      },
    };
    expect(calculateOfficialFinalGrade(record, rule)).toBeCloseTo(80, 10);
    expect(calculateUnofficialFinalGrade(record, rule)).toBeCloseTo(80, 10);
  });

  it('uses each grade type for its own final grade', () => {
    const record = makeMixedRecord();
    expect(calculateOfficialFinalGrade(record, rule)).toBeCloseTo(87, 10);
    expect(calculateUnofficialFinalGrade(record, rule)).toBeCloseTo(77.66666666666667, 10);
  });

  it('is null when no term has a grade', () => {
    expect(calculateOfficialFinalGrade({ grades: {} }, rule)).toBeNull();
    expect(calculateUnofficialFinalGrade(null, rule)).toBeNull();
  });

  it('seed student U1: official 90, expected 90', () => {
    const db = makeSeedDb();
    const record = db.classes[0].studentRecords[0];
    expect(calculateOfficialFinalGrade(record, db.computationRules[0])).toBeCloseTo(90, 10);
    expect(calculateUnofficialFinalGrade(record, db.computationRules[0])).toBeCloseTo(90, 10);
  });
});

describe('withStudentScore', () => {
  it('saves the score and stamps the first score time', () => {
    const task = makeTask('a', 20);
    expect(withStudentScore(task, '15')).toEqual({
      ...task,
      studentReportedScore: '15',
      studentScoredAt: FIXED_NOW_ISO,
    });
  });

  it('keeps the original score time when the score changes', () => {
    const task = makeTask('a', 20, null, 10, { studentScoredAt: '2026-09-01T00:00:00.000Z' });
    expect(withStudentScore(task, 12).studentScoredAt).toBe('2026-09-01T00:00:00.000Z');
  });

  it('clears the score time when the score is cleared', () => {
    const task = makeTask('a', 20, null, 10, { studentScoredAt: '2026-09-01T00:00:00.000Z' });
    expect(withStudentScore(task, '')).toMatchObject({ studentReportedScore: '', studentScoredAt: null });
    expect(withStudentScore(task, null)).toMatchObject({ studentReportedScore: null, studentScoredAt: null });
    expect(withStudentScore(task, undefined).studentScoredAt).toBeNull();
  });

  it('a score of 0 is a score and gets a time', () => {
    expect(withStudentScore(makeTask('a', 20), 0).studentScoredAt).toBe(FIXED_NOW_ISO);
  });

  it('does not change the task it was given', () => {
    const task = makeTask('a', 20);
    withStudentScore(task, 5);
    expect(task.studentReportedScore).toBeNull();
  });
});

describe('getOfficialAssessments', () => {
  it('lists non-custom tasks whose official score is not null or undefined', () => {
    const termGrades = makeMixedRecord().grades.prelim;
    expect(getOfficialAssessments(termGrades).map((task) => task.id)).toEqual(['a1', 't1']);
  });

  it('counts an official score of "" as official (docs/AUDIT.md B10)', () => {
    const termGrades = { AT: [makeTask('a', 20, ''), makeTask('b', 20, 0), makeTask('c', 20)] };
    expect(getOfficialAssessments(termGrades).map((task) => task.id)).toEqual(['a', 'b']);
  });

  it('skips custom tasks even when they have an official score', () => {
    const termGrades = { AT: [makeTask('a', 20, 10, null, { isCustomTask: true })] };
    expect(getOfficialAssessments(termGrades)).toEqual([]);
  });

  it('returns an empty list when there are no term grades', () => {
    expect(getOfficialAssessments(null)).toEqual([]);
    expect(getOfficialAssessments(undefined)).toEqual([]);
  });
});
