// Everything Subject Detail needs apart from its markup:
// - the selected term, kept in the URL (?term=midterm) so the sandbox can
//   link back to the same term;
// - ?task=<id> (from a Dashboard chart click): scroll to that task once;
// - the class, its subject, professor, grades and target;
// - saving the target typed in the target box;
// - the target-reached celebration: the message, its 6-second close and
//   the audio (lib/celebration.js decides when it fires).
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDb } from "@/hooks/useDb";
import { getAchievement, getCelebrationMessage } from "@/lib/celebration";
import { focusTaskRow } from "@/lib/dom/focusTask";
import {
    calculateOfficialGrade,
    calculateUnofficialGrade,
    getOfficialAssessments,
} from "@/lib/grades";
import { getSubjectDetailTarget, parseTargetInput, setTermTarget } from "@/lib/targets";
import { getTermLabel, toTermKey } from "@/lib/terms";
import { getDb, saveDb } from "@/services/db";
import { getStudentClass, updateStudentRecord } from "@/services/records";
import { getActiveStudentId } from "@/services/session";

export function useSubjectDetail(subjectId) {
    const [searchParams, setSearchParams] = useSearchParams();
    const termKey = toTermKey(searchParams.get("term"));
    const term = getTermLabel(termKey);
    const focusTaskId = searchParams.get("task");
    const [celebration, setCelebration] = useState("");
    const [targetGradeError, setTargetGradeError] = useState("");
    const [dbData, setDbData] = useDb();
    const studentId = getActiveStudentId(dbData);
    const previousAchievement = useRef(null);
    const celebrationAudioRef = useRef(null);

    useEffect(() => {
        const { record: currentRecord, rule: currentRule } = getStudentClass(
            dbData,
            subjectId,
            studentId,
        );
        if (!currentRecord) return;

        const currentTerm = term.toLowerCase();
        const currentTarget = getSubjectDetailTarget(currentRecord, currentTerm);
        const officialGrade = calculateOfficialGrade(currentRecord, term, currentRule);
        const expectedGrade = calculateUnofficialGrade(currentRecord, term, currentRule);
        const achievement = getAchievement(officialGrade, expectedGrade, currentTarget);
        const key = `${subjectId}:${currentTerm}`;
        const previous = previousAchievement.current;

        const message = getCelebrationMessage(previous?.key === key ? previous : null, achievement);
        if (message) setCelebration(message);

        previousAchievement.current = { key, ...achievement };
    }, [dbData, subjectId, term, studentId]);

    useEffect(() => {
        if (!focusTaskId) return;
        focusTaskRow(focusTaskId);
        setSearchParams(
            (params) => {
                const next = new URLSearchParams(params);
                next.delete("task");
                return next;
            },
            { replace: true },
        );
    }, [focusTaskId, setSearchParams]);

    useEffect(() => {
        if (!celebration) return undefined;
        const timeoutId = window.setTimeout(() => setCelebration(""), 6000);
        return () => window.clearTimeout(timeoutId);
    }, [celebration]);

    useEffect(() => {
        const audio = celebrationAudioRef.current;
        if (!audio) return undefined;

        if (!celebration) {
            audio.pause();
            audio.currentTime = 0;
            return undefined;
        }

        audio.currentTime = 0;
        audio.play().catch((error) => {
            if (error.name !== "NotAllowedError") {
                console.error("Unable to play the grade celebration audio.", error);
            }
        });

        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }, [celebration]);

    const {
        classItem,
        subject,
        record: studentRecord,
        rule: computationRule,
    } = getStudentClass(dbData, subjectId, studentId);
    const professor =
        classItem?.professorName ??
        dbData?.users?.find((user) => user.id === classItem?.professorId)?.name ??
        "Awaiting professor assignment";
    const found = Boolean(classItem && subject && studentRecord);

    const selectedTermKey = term.toLowerCase();
    const officialTasks = found
        ? getOfficialAssessments(studentRecord.grades?.[selectedTermKey])
        : [];
    const officialAverage = found
        ? calculateOfficialGrade(studentRecord, term, computationRule)
        : null;
    const expectedAverage = found
        ? calculateUnofficialGrade(studentRecord, term, computationRule)
        : null;
    const targetGrade = found ? getSubjectDetailTarget(studentRecord, selectedTermKey) : null;

    function updateTargetGrade(value) {
        const nextGrade = parseTargetInput(value);
        if (nextGrade === null) return;

        const currentDb = getDb();
        if (!currentDb) return;
        const updatedDb = updateStudentRecord(currentDb, classItem.id, studentId, (record) =>
            setTermTarget(record, selectedTermKey, nextGrade),
        );

        try {
            saveDb(updatedDb);
            setDbData(updatedDb);
            setTargetGradeError("");
        } catch (error) {
            setTargetGradeError(`Unable to save target grade: ${error.message}`);
        }
    }

    return {
        found,
        termKey,
        term,
        setTermKey: (nextTerm) => setSearchParams({ term: nextTerm }, { replace: true }),
        classItem,
        subject,
        professor,
        officialTasks,
        officialAverage,
        expectedAverage,
        targetGrade,
        updateTargetGrade,
        targetGradeError,
        celebration,
        closeCelebration: () => setCelebration(""),
        celebrationAudioRef,
    };
}
