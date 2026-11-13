import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { TargetIcon, XIcon } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { CurrentTermRecords } from "@/features/term-records/components/CurrentTermRecords";
import { DraftInput } from "@/components/DraftInput";
import { GradeGauge } from "@/components/GradeGauge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { getStudentClass, updateStudentRecord } from "@/services/records";
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

// Confetti in the palette tokens.
const CONFETTI_COLORS = [
    "var(--color-criteria-1)",
    "var(--color-criteria-2)",
    "var(--success)",
    "var(--color-criteria-4)",
    "var(--color-criteria-3)",
];
const CONFETTI_PIECES = Array.from({ length: 44 }, (_, index) => ({
    left: `${(index * 37) % 100}%`,
    delay: `${(index % 11) * 0.08}s`,
    duration: `${2.3 + (index % 7) * 0.22}s`,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
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

    if (!classItem || !subject || !studentRecord) {
        return (
            <PageShell showHeader={false} showFooter={false}>
                <h1 className="type-page-title">Subject not found</h1>
                <p>This subject is not available for your account.</p>
            </PageShell>
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
        <PageShell>
            <audio ref={celebrationAudioRef} src={congratulationAudio} preload="auto" />
            {/* Term Navigation */}
            <TermNavigation
                termKey={termKey}
                onTermChange={(nextTerm) => setSearchParams({ term: nextTerm }, { replace: true })}
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
                            <Avatar>
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
                            "shrink-0 rounded-full border-primary bg-secondary text-primary no-underline hover:bg-primary hover:text-primary-foreground",
                        )}
                        to={`/student/subject/${classItem.id}/sandbox?term=${termKey}`}
                    >
                        <TargetIcon data-icon="inline-start" aria-hidden="true" />
                        Target grade sandbox
                    </Link>
                </div>

                {/* Official Grade Summary */}
                <Card className="@container grid gap-4 border-highlight bg-highlight-soft p-4 shadow-none md:grid-cols-2 xl:flex xl:flex-row xl:items-center xl:px-5">
                    <div
                        className="flex min-w-0 flex-wrap items-center justify-evenly gap-3 md:col-span-2 xl:flex-17 xl:justify-start xl:gap-4"
                        aria-label={`${term} grades`}
                    >
                        <Field className="w-auto shrink-0 gap-1.5 @max-lg:w-full">
                            <FieldLabel
                                htmlFor="subject-target-grade"
                                className="font-semibold text-foreground"
                            >
                                Target grade
                            </FieldLabel>
                            <InputGroup className="w-24 border-highlight-strong bg-card">
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

                    <div className="flex min-w-0 flex-col gap-2 xl:flex-10">
                        <p className="m-0 flex items-center gap-2 type-small text-muted-foreground">
                            <span className="size-2 shrink-0 rounded-full bg-self-reported" />
                            {officialTasks.length} official assessment
                            {officialTasks.length === 1 ? "" : "s"} recorded
                        </p>

                        <small className="type-small text-muted-foreground">
                            Official records never include sandbox drafts.
                        </small>
                    </div>

                    <div className="flex min-w-0 flex-col gap-2.5 border-t border-highlight pt-3 type-small text-muted-foreground md:border-0 md:pt-0 xl:flex-10">
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
            {celebration && (
                <CelebrationDialog message={celebration} onClose={() => setCelebration("")} />
            )}
        </PageShell>
    );
}

// The "target achieved" message. It is mounted only while there is a
// message, so it disappears at once when closed, as before.
function CelebrationDialog({ message, onClose }) {
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            {/* The popup fills the screen so the confetti can fall over the
            whole page. A press outside the card closes it. */}
            <DialogContent
                showCloseButton={false}
                className="inset-0 size-full max-w-none translate-x-0 translate-y-0 place-items-center overflow-hidden rounded-none border-0 bg-transparent p-5 shadow-none sm:max-w-none"
                onMouseDown={(event) => {
                    if (event.target === event.currentTarget) onClose();
                }}
            >
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    {CONFETTI_PIECES.map((piece, index) => (
                        <span
                            key={index}
                            className="absolute -top-4 h-3.5 w-2 animate-celebration-confetti rounded-xs opacity-0 motion-reduce:animate-none"
                            // Each piece's place, color and timing.
                            style={{
                                left: piece.left,
                                background: piece.color,
                                "--confetti-delay": piece.delay,
                                "--confetti-duration": piece.duration,
                            }}
                        />
                    ))}
                </div>
                <div className="relative w-full max-w-md animate-celebration-card-in rounded-2xl border border-card bg-card bg-linear-to-b from-highlight/40 to-transparent to-50% px-8 pt-10 pb-8 text-center text-foreground shadow-dialog motion-reduce:animate-none">
                    <DialogClose
                        render={
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="absolute top-2 right-2.5 text-muted-foreground"
                                aria-label="Close congratulations"
                            />
                        }
                    >
                        <XIcon aria-hidden="true" />
                    </DialogClose>
                    <span
                        className="block animate-celebration-sparkle text-4xl leading-none text-highlight-text motion-reduce:animate-none"
                        aria-hidden="true"
                    >
                        ✦
                    </span>
                    <p className="mt-3.5 mb-1 type-caption font-extrabold tracking-widest text-highlight-text">
                        TARGET ACHIEVED
                    </p>
                    <DialogTitle className="m-0 type-section-title text-primary">
                        Congratulations!
                    </DialogTitle>
                    <DialogDescription className="mt-2.5 type-body text-muted-foreground">
                        {message}
                    </DialogDescription>
                    <span
                        className="mt-4 block animate-celebration-trophy text-4xl motion-reduce:animate-none"
                        aria-hidden="true"
                    >
                        🏆
                    </span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
