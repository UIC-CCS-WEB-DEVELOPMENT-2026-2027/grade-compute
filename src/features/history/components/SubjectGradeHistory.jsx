// src/components/student/SubjectGradeHistory.jsx
// "<Term> Grade History" section on Subject Detail, under Current Term
// Records. Follows the selected term. Shows the sandbox plan for the
// remaining tasks (on at first, can be turned off) and links to the
// sandbox. Clicking a point scrolls to that task.
import { useState } from "react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { focusTaskRow } from "@/lib/dom/focusTask";
import { getEntryAccuracy, getGradeHistory, getPlanPoints } from "@/lib/history";
import { getTermTarget } from "@/lib/targets";
import { getActiveStudentId } from "@/services/session";
import { getTermLabel } from "@/lib/terms";
import { HistoryChart } from "./HistoryChart";
import { formatGrade } from "@/lib/format";
import { useDb } from "@/hooks/useDb";

export function SubjectGradeHistory({ classId, termKey }) {
    // Live, so it redraws when a score is saved (Current Term Records saves on blur).
    const [dbData] = useDb();
    const [showPlan, setShowPlan] = useState(true);

    const studentId = getActiveStudentId(dbData);
    const classItem = dbData?.classes?.find((item) => item.id === classId);
    const record = classItem?.studentRecords?.find((item) => item.studentId === studentId);
    const rule = dbData?.computationRules?.find((item) => item.id === classItem?.computationRuleId);
    const termLabel = getTermLabel(termKey);
    if (!record || !rule) return null;

    const points = getGradeHistory(record, rule, termKey);
    const target = getTermTarget(record, termKey);
    const { plan, points: planPoints } = getPlanPoints(
        record,
        rule,
        termKey,
        target,
        points.length,
    );
    const accuracy = getEntryAccuracy(points);
    const sandboxLink = `/student/subject/${classId}/sandbox?term=${termKey}`;

    return (
        <Card className="mt-7 gap-3.5" role="region" aria-labelledby="subject-history-title">
            <CardHeader className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2
                        id="subject-history-title"
                        className="m-0 type-section-title text-foreground"
                    >
                        {termLabel} Grade History
                    </h2>
                    <CardDescription className="mt-1 max-w-prose">
                        Your {termLabel} grade after each scored task. Official scores replace your
                        own entries. Click a point to jump to its task.
                    </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {planPoints.length > 0 && (
                        <Toggle
                            variant="outline"
                            pressed={showPlan}
                            onPressedChange={setShowPlan}
                            className="rounded-full bg-card px-3.5 text-primary aria-pressed:border-primary aria-pressed:bg-secondary aria-pressed:text-primary max-md:h-control-touch"
                        >
                            {showPlan ? "Hide plan" : "Show plan"}
                        </Toggle>
                    )}
                    <Link
                        className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "rounded-full border-primary bg-secondary px-3.5 text-primary no-underline hover:bg-primary hover:text-primary-foreground max-md:h-control-touch",
                        )}
                        to={sandboxLink}
                    >
                        Plan in sandbox
                    </Link>
                </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-3.5">
                <HistoryChart
                    points={points}
                    planPoints={planPoints}
                    showPlan={showPlan}
                    target={target}
                    targetLabel="Target"
                    termLabel={termLabel}
                    onSelect={(point) => focusTaskRow(point.taskId)}
                />

                {showPlan && planPoints.length > 0 && (
                    <p className="m-0 type-small text-muted-foreground *:text-foreground">
                        {plan.status === "required" && (
                            <>
                                Plan: score <strong>{formatGrade(plan.required)}</strong> on each
                                remaining task to end at your target.{" "}
                            </>
                        )}
                        {plan.status === "impossible" && (
                            <>
                                Plan: even 100% on every remaining task ends at{" "}
                                <strong>{formatGrade(plan.best)}</strong>.{" "}
                            </>
                        )}
                        {plan.status === "reached" && (
                            <>
                                You&apos;re already above target. The plan assumes you keep scoring
                                around your current grade.{" "}
                            </>
                        )}
                        Remaining tasks come from your sandbox settings; their order is a guess, so
                        the end point is what matters.
                    </p>
                )}

                {accuracy && (
                    <p className="m-0 type-small text-muted-foreground *:text-foreground">
                        Your own entries were{" "}
                        <strong>
                            {Math.abs(accuracy.averageGap) < 0.05
                                ? "spot on"
                                : `${Math.abs(accuracy.averageGap).toFixed(1)} points ${accuracy.averageGap < 0 ? "higher" : "lower"}`}
                        </strong>
                        {Math.abs(accuracy.averageGap) < 0.05 ? " compared with" : " than"} the
                        official scores that replaced them ({accuracy.count} task
                        {accuracy.count === 1 ? "" : "s"}).
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
