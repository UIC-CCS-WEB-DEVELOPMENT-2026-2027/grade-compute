import { Link, useParams } from "react-router-dom";
import { TargetIcon } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { CurrentTermRecords } from "@/features/term-records/components/CurrentTermRecords";
import { DraftInput } from "@/components/DraftInput";
import { GradeGauge } from "@/components/GradeGauge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupText } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { TermNavigation } from "@/components/TermNavigation";
import { SubjectGradeHistory } from "@/features/history/components/SubjectGradeHistory";
import { CelebrationDialog } from "@/features/subjects/components/CelebrationDialog";
import { useSubjectDetail } from "@/features/subjects/hooks/useSubjectDetail";
import congratulationAudio from "@/assets/congrats-voice.mp3";
import { getSpaceSplitInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SubjectDetail() {
    const { subjectId } = useParams();
    const {
        found,
        termKey,
        term,
        setTermKey,
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
        closeCelebration,
        celebrationAudioRef,
    } = useSubjectDetail(subjectId);

    if (!found) {
        return (
            <PageShell showHeader={false} showFooter={false}>
                <h1 className="type-page-title">Subject not found</h1>
                <p>This subject is not available for your account.</p>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <audio ref={celebrationAudioRef} src={congratulationAudio} preload="auto" />
            {/* Term Navigation */}
            <TermNavigation
                termKey={termKey}
                onTermChange={setTermKey}
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
                <Card className="@container grid gap-4 border-highlight bg-highlight-soft px-(--card-spacing) shadow-none md:grid-cols-2 xl:flex xl:flex-row xl:items-center">
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
            {celebration && <CelebrationDialog message={celebration} onClose={closeCelebration} />}
        </PageShell>
    );
}
