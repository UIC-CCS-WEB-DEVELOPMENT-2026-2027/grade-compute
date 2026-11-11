import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { TargetIcon } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { PageFooter } from "@/components/layout/PageFooter";
import { CurrentTermRecords } from "@/features/term-records/components/CurrentTermRecords";
import { DraftInput } from "@/components/DraftInput";
import { GradeGauge } from "@/components/GradeGauge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { TermNavigation } from "@/features/term-records/components/TermNavigation";
import { SubjectGradeHistory } from "@/features/history/components/SubjectGradeHistory";
import { getDb, saveDb } from "@/services/db";
import { updateStudentRecord } from "@/services/records";
import congratulationAudio from "@/assets/congrats-voice.mp3";
import {
    calculateOfficialGrade,
    calculateUnofficialGrade,
    getOfficialAssessments,
} from "@/lib/grades";
import { getAchievement, getCelebrationMessage } from "@/lib/celebration";
import { getSpaceSplitInitials } from "@/lib/format";
import { getSubjectDetailTarget } from "@/lib/targets";
import { getTermLabel, toTermKey } from "@/lib/terms";
import { getActiveStudentId } from "@/services/session";
import { focusTaskRow } from "@/lib/dom/focusTask";
import { useDb } from "@/hooks/useDb";
import { cn } from "@/lib/utils";
import "./SubjectDetail.css";

const CONFETTI_COLORS = ["#406093", "#e9c936", "#5ca878", "#f47b62", "#8a6bd1"];
const CONFETTI_PIECES = Array.from({ length: 44 }, (_, index) => ({
    left: `${(index * 37) % 100}%`,
    delay: `${(index % 11) * 0.08}s`,
    duration: `${2.3 + (index % 7) * 0.22}s`,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    rotation: `${(index * 53) % 360}deg`,
}));

export function SubjectDetail() {
    // The selected term lives in the URL (?term=midterm), so the sandbox
    // can link back to the same term.
    const [searchParams, setSearchParams] = useSearchParams();
    const termKey = toTermKey(searchParams.get("term"));
    const term = getTermLabel(termKey);
    // ?task=<id> (from a Dashboard chart click): scroll to that task once.
    const focusTaskId = searchParams.get("task");
    const [celebration, setCelebration] = useState("");
    const [targetGradeError, setTargetGradeError] = useState("");
    const [dbData, setDbData] = useDb();
    const studentId = getActiveStudentId(dbData);
    const previousAchievement = useRef(null);
    const celebrationAudioRef = useRef(null);
    const { subjectId } = useParams();

    useEffect(() => {
        const currentDb = dbData;
        const currentClass = currentDb?.classes?.find((item) => item.id === subjectId);
        const currentRecord = currentClass?.studentRecords?.find(
            (record) => record.studentId === studentId,
        );
        const currentRule = currentDb?.computationRules?.find(
            (rule) => rule.id === currentClass?.computationRuleId,
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

    const classItem = dbData?.classes?.find((item) => item.id === subjectId);
    const subject = dbData?.subjects?.find((item) => item.id === classItem?.subjectId);
    const professor =
        classItem?.professorName ??
        dbData?.users?.find((user) => user.id === classItem?.professorId)?.name ??
        "Awaiting professor assignment";
    const studentRecord = classItem?.studentRecords?.find(
        (record) => record.studentId === studentId,
    );
    const computationRule = dbData?.computationRules?.find(
        (rule) => rule.id === classItem?.computationRuleId,
    );

    if (!classItem || !subject || !studentRecord) {
        return (
            <div className="subject-detail-layout">
                <Sidebar />
                <div className="subject-detail-main">
                    <main className="student-dashboard">
                        <h1>Subject not found</h1>
                        <p>This subject is not available for your account.</p>
                    </main>
                </div>
            </div>
        );
    }

    const selectedTermKey = term.toLowerCase();
    const selectedTerm = studentRecord.grades?.[selectedTermKey];
    const officialTasks = getOfficialAssessments(selectedTerm);
    const officialAverage = calculateOfficialGrade(studentRecord, term, computationRule);
    const expectedAverage = calculateUnofficialGrade(studentRecord, term, computationRule);
    const targetGrade = getSubjectDetailTarget(studentRecord, selectedTermKey);

    function updateTargetGrade(value) {
        if (value === "") return;
        const nextGrade = Number(value);
        if (!Number.isFinite(nextGrade) || nextGrade < 0 || nextGrade > 100) return;

        const currentDb = getDb();
        if (!currentDb) return;
        const updatedDb = updateStudentRecord(currentDb, classItem.id, studentId, (record) => ({
            ...record,
            targetGradeSandbox: {
                ...(record.targetGradeSandbox ?? {}),
                terms: {
                    ...(record.targetGradeSandbox?.terms ?? {}),
                    [selectedTermKey]: {
                        ...(record.targetGradeSandbox?.terms?.[selectedTermKey] ?? {}),
                        desiredFinalGrade: nextGrade,
                    },
                },
            },
        }));

        try {
            saveDb(updatedDb);
            setDbData(updatedDb);
            setTargetGradeError("");
        } catch (error) {
            setTargetGradeError(`Unable to save target grade: ${error.message}`);
        }
    }

    return (
        <div className="subject-detail-layout">
            <audio ref={celebrationAudioRef} src={congratulationAudio} preload="auto" />
            <Sidebar />
            <div className="subject-detail-main">
                <Header />

                <main className="student-dashboard">
                    {/* Term Navigation */}
                    <TermNavigation
                        termKey={termKey}
                        onTermChange={(nextTerm) =>
                            setSearchParams({ term: nextTerm }, { replace: true })
                        }
                        note="Official scores and draft notes are separate for each term."
                    />

                    {/* Subject Heading */}
                    <section className="mb-8 w-full">
                        <div className="mb-2 type-caption tracking-wide text-muted-foreground">
                            FIRST SEMESTER · 2026–2027
                        </div>

                        <div className="mb-5 flex items-start justify-between gap-5 max-md:flex-col max-md:gap-4">
                            <div>
                                <h1 className="m-0 mb-3 type-page-title text-foreground">
                                    {subject.subjectCode} - {subject.subjectName}
                                </h1>

                                <div className="flex flex-wrap items-center gap-2 type-small text-muted-foreground">
                                    <Avatar size="sm">
                                        <AvatarFallback className="bg-secondary font-semibold text-primary">
                                            {getSpaceSplitInitials(professor)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span>{professor}</span>
                                    <span className="text-border">·</span>
                                    <span>{classItem.units ?? 3} units</span>
                                </div>
                            </div>
                            <Link
                                className={cn(
                                    buttonVariants({ variant: "outline" }),
                                    "shrink-0 rounded-full border-primary bg-secondary text-primary no-underline hover:bg-primary hover:text-primary-foreground max-md:h-control-touch",
                                )}
                                to={`/student/subject/${classItem.id}/sandbox?term=${termKey}`}
                            >
                                <TargetIcon data-icon="inline-start" aria-hidden="true" />
                                Target grade sandbox
                            </Link>
                        </div>

                        {/* Official Grade Summary */}
                        <Card className="grid gap-4 border-highlight bg-highlight-soft p-4 shadow-none md:grid-cols-2 xl:flex xl:flex-row xl:items-center xl:px-5">
                            <div
                                className="flex min-w-0 flex-wrap items-center justify-evenly gap-3 md:col-span-2 xl:flex-[1.7] xl:justify-start xl:gap-4"
                                aria-label={`${term} grades`}
                            >
                                <Field className="w-auto shrink-0 gap-1.5 max-sm:w-full">
                                    <FieldLabel
                                        htmlFor="subject-target-grade"
                                        className="font-semibold text-foreground"
                                    >
                                        Target grade
                                    </FieldLabel>
                                    <InputGroup className="w-24 border-highlight-strong bg-card max-md:h-control-touch">
                                        {/* Saved on blur / Enter, so a half-typed target
                                        (e.g. "8" on the way to "85") can't trigger
                                        the celebration. */}
                                        <DraftInput
                                            as={InputGroupInput}
                                            id="subject-target-grade"
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="1"
                                            value={targetGrade}
                                            aria-label={`${term} target grade`}
                                            onCommit={updateTargetGrade}
                                            className="font-bold"
                                        />
                                        <InputGroupAddon align="inline-end">
                                            <InputGroupText
                                                className="text-highlight-text"
                                                aria-hidden="true"
                                            >
                                                %
                                            </InputGroupText>
                                        </InputGroupAddon>
                                    </InputGroup>
                                    <small className="max-w-32 type-small text-highlight-text max-sm:max-w-none">
                                        Yellow marker shows your target
                                    </small>
                                    {targetGradeError && (
                                        <small
                                            className="max-w-32 type-small text-destructive"
                                            role="alert"
                                        >
                                            {targetGradeError}
                                        </small>
                                    )}
                                </Field>
                                <GradeGauge
                                    label={`${term} official`}
                                    grade={officialAverage}
                                    target={targetGrade}
                                    ariaLabelPrefix="Official grade"
                                    ariaDecimals={2}
                                    focusable
                                    className="shrink-0"
                                    details="Professor-recorded scores only. These grades are locked."
                                />
                                <GradeGauge
                                    label={`${term} expected`}
                                    grade={expectedAverage}
                                    target={targetGrade}
                                    tone="expected"
                                    ariaLabelPrefix="Expected grade"
                                    ariaDecimals={2}
                                    focusable
                                    className="shrink-0"
                                    details="Includes student-reported draft scores with official scores taking priority."
                                />
                            </div>

                            <Separator orientation="vertical" className="hidden h-12 xl:block" />

                            <div className="flex min-w-0 flex-col gap-2 xl:flex-1">
                                <p className="m-0 flex items-center gap-2 type-small text-muted-foreground">
                                    <span className="size-2 shrink-0 rounded-full bg-self-reported" />
                                    {officialTasks.length} official assessment
                                    {officialTasks.length === 1 ? "" : "s"} recorded
                                </p>

                                <small className="type-small text-muted-foreground">
                                    Official records never include sandbox drafts.
                                </small>
                            </div>

                            <div className="flex min-w-0 flex-col gap-2.5 border-t border-highlight pt-3 type-small text-muted-foreground md:border-0 md:pt-0 xl:flex-1">
                                <span className="flex items-center gap-2">
                                    <i className="size-2 shrink-0 rounded-full bg-official" />
                                    Locked official scores
                                </span>

                                <span className="flex items-center gap-2">
                                    <i className="size-2 shrink-0 rounded-full bg-self-reported" />
                                    Private sandbox drafts
                                </span>
                            </div>
                        </Card>
                    </section>

                    {/* Current Term Records */}
                    <CurrentTermRecords classId={classItem.id} term={term} />

                    <SubjectGradeHistory classId={classItem.id} termKey={termKey} />
                </main>
                <PageFooter />
            </div>
            {celebration && (
                <div
                    className="grade-celebration-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setCelebration("");
                    }}
                >
                    <div className="grade-celebration-confetti" aria-hidden="true">
                        {CONFETTI_PIECES.map((piece, index) => (
                            <span
                                key={index}
                                style={{
                                    "--confetti-left": piece.left,
                                    "--confetti-delay": piece.delay,
                                    "--confetti-duration": piece.duration,
                                    "--confetti-color": piece.color,
                                    "--confetti-rotation": piece.rotation,
                                }}
                            />
                        ))}
                    </div>
                    <section
                        className="grade-celebration-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="grade-celebration-title"
                    >
                        <button
                            type="button"
                            className="grade-celebration-close"
                            aria-label="Close congratulations"
                            onClick={() => setCelebration("")}
                        >
                            ×
                        </button>
                        <span className="grade-celebration-sparkle" aria-hidden="true">
                            ✦
                        </span>
                        <p className="grade-celebration-eyebrow">TARGET ACHIEVED</p>
                        <h2 id="grade-celebration-title">Congratulations!</h2>
                        <p>{celebration}</p>
                        <span className="grade-celebration-trophy" aria-hidden="true">
                            🏆
                        </span>
                    </section>
                </div>
            )}
        </div>
    );
}
