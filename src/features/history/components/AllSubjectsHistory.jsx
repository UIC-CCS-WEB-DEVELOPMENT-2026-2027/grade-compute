// src/components/student/AllSubjectsHistory.jsx
// Dashboard chart: one line per subject for the chosen term (this
// semester's subjects), each with its target as a dashed line in the same
// color, the 75% passing line, and a "target reached" marker on the latest
// task when it is at or above the target. Chips show or
// hide subjects. Clicking a point opens that subject at that task.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Line, ReferenceLine } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { resolveColor } from "@/lib/dom/cssColor";
import { getCriteriaColor } from "@/lib/rules";
import { getChartScale, getCoursesHistory, PASSING_GRADE } from "@/lib/history";
import { TERMS, getTermLabel } from "@/lib/terms";
import { HistoryTooltip } from "./HistoryTooltip";
import { usePointHover } from "@/features/history/hooks/usePointHover";
import { formatGrade } from "@/lib/format";
import { HistoryChartFrame } from "./HistoryChartFrame";
import { HistoryLegend } from "./HistoryLegend";
import { HistoryTable } from "./HistoryTable";

// Strong colors first so the first lines read well on white.
const LINE_COLOR_ORDER = [1, 4, 3, 5, 2, 8, 7, 6];

function lineColor(index) {
    return resolveColor(getCriteriaColor(LINE_COLOR_ORDER[index % LINE_COLOR_ORDER.length]));
}

// One subject's dot. Hovering it shows a tooltip for this point only;
// clicking opens the task.
function SubjectDot({ cx, cy, payload, course, reached, surface, success, onSelect, hover }) {
    if (
        cx === undefined ||
        cy === undefined ||
        payload?.grade === null ||
        payload?.grade === undefined
    )
        return null;
    const key = `${course.classId}-${payload.step}`;
    return (
        <g className="cursor-pointer">
            {reached && (
                <circle cx={cx} cy={cy} r={9} fill="none" stroke={success} strokeWidth={2} />
            )}
            {payload.isOfficial ? (
                <circle cx={cx} cy={cy} r={4} fill={course.color} />
            ) : (
                <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={surface}
                    stroke={course.color}
                    strokeWidth={2}
                />
            )}
            <circle
                cx={cx}
                cy={cy}
                r={11}
                fill="transparent"
                onMouseEnter={(event) =>
                    hover.show(event, key, {
                        point: payload,
                        kind: "real",
                        seriesName: `${course.subjectCode} · target ${course.target}%`,
                        color: course.color,
                    })
                }
                onMouseLeave={() => hover.hide(key)}
                onClick={() => onSelect(payload)}
            />
        </g>
    );
}

// db: the database. studentId: the signed-in student.
// semesterId: only this semester's subjects. initialTerm: "prelim" etc.
export function AllSubjectsHistory({ db, studentId, semesterId, initialTerm = "prelim" }) {
    const navigate = useNavigate();
    const { plotRef, store, show, hide } = usePointHover();
    // What each dot needs to open and close the tooltip.
    const hover = { show, hide };
    const [termKey, setTermKey] = useState(initialTerm);
    const [hiddenIds, setHiddenIds] = useState(() => new Set());
    const termLabel = getTermLabel(termKey);

    const courses = getCoursesHistory(db, studentId, termKey, semesterId).map((course, index) => ({
        ...course,
        color: lineColor(index),
    }));
    const visible = courses.filter((course) => !hiddenIds.has(course.classId));
    const plotted = visible.filter((course) => course.points.length > 0);
    const scale = getChartScale(
        [
            ...plotted.flatMap((course) => course.points.map((point) => point.grade)),
            ...plotted.map((course) => course.target),
            PASSING_GRADE,
        ],
        Math.max(1, ...plotted.map((course) => course.points.length)),
    );
    const colors = {
        surface: resolveColor("var(--card)"),
        success: resolveColor("var(--success)"),
    };
    const allShown = hiddenIds.size === 0;

    function toggle(classId) {
        setHiddenIds((current) => {
            const next = new Set(current);
            if (next.has(classId)) next.delete(classId);
            else next.add(classId);
            return next;
        });
    }

    function openTask(course, point) {
        const task = point.taskId ? `&task=${encodeURIComponent(point.taskId)}` : "";
        navigate(`/student/subject/${course.classId}?term=${termKey}${task}`);
    }

    const legend = (
        <HistoryLegend
            items={[
                {
                    mark: "h-0.75 w-4.5 rounded-xs bg-primary",
                    text: "Grade so far (filled dot: official, hollow: yours)",
                },
                {
                    mark: "w-4.5 border-t-2 border-dashed border-foreground",
                    text: "Target, in the subject's color",
                },
                {
                    mark: "w-4.5 border-t-2 border-dotted border-destructive",
                    text: "Passing grade",
                },
                { mark: "size-2.5 rounded-full border-2 border-success", text: "Target reached" },
            ]}
        />
    );

    const table = visible
        .filter((course) => course.points.length > 0)
        .map((course) => (
            <HistoryTable
                key={course.classId}
                caption={`${course.subjectCode} ${course.subjectName} · target ${course.target}%`}
                points={course.points}
                actionLabel="Open task"
                onSelect={(point) => openTask(course, point)}
            />
        ));

    return (
        <Card className="mt-7 gap-3.5" role="region" aria-labelledby="all-history-title">
            <CardHeader className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 id="all-history-title" className="m-0 type-section-title text-foreground">
                        {termLabel} Grade History
                    </h2>
                    <CardDescription className="mt-1 max-w-prose">
                        Each subject&apos;s {termLabel} grade after every scored task. Dashed lines
                        are targets in the subject&apos;s color. Click a point to open that task.
                    </CardDescription>
                </div>
                <ToggleGroup
                    aria-label="Term shown"
                    value={[termKey]}
                    onValueChange={(value) => {
                        if (value[0]) setTermKey(value[0]);
                    }}
                    className="flex-wrap gap-0.5 rounded-full border border-border bg-muted p-0.5"
                >
                    {TERMS.map((term) => (
                        <ToggleGroupItem
                            key={term.key}
                            value={term.key}
                            className="rounded-full px-3.5 font-normal text-muted-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground"
                        >
                            {term.label}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
                {courses.length === 0 ? (
                    <p className="m-0 rounded-lg border border-dashed border-border px-5 py-7 text-center type-small text-muted-foreground">
                        Add a subject below and its grade history will show here.
                    </p>
                ) : (
                    <>
                        <div
                            className="flex flex-wrap gap-2"
                            role="group"
                            aria-label="Subjects shown in the chart"
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full font-normal text-primary"
                                onClick={() =>
                                    setHiddenIds(
                                        allShown
                                            ? new Set(courses.map((course) => course.classId))
                                            : new Set(),
                                    )
                                }
                            >
                                {allShown ? "Hide all" : "Show all"}
                            </Button>
                            {courses.map((course) => (
                                <Toggle
                                    key={course.classId}
                                    variant="outline"
                                    pressed={!hiddenIds.has(course.classId)}
                                    onPressedChange={() => toggle(course.classId)}
                                    title={course.subjectName}
                                    className="group/chip rounded-full bg-card px-3 font-normal text-muted-foreground aria-pressed:border-primary aria-pressed:bg-secondary aria-pressed:text-foreground"
                                >
                                    <i
                                        className="size-2.5 rounded-full bg-(--chip-color) opacity-35 group-aria-pressed/chip:opacity-100"
                                        style={{ "--chip-color": course.color }}
                                        aria-hidden="true"
                                    />
                                    {course.subjectCode}
                                    <small className="type-caption font-normal text-muted-foreground">
                                        {course.points.length === 0
                                            ? "no scores"
                                            : course.reachedIndex >= 0
                                              ? "target reached"
                                              : `target ${course.target}%`}
                                    </small>
                                </Toggle>
                            ))}
                        </div>

                        <HistoryChartFrame
                            scale={scale}
                            plotRef={plotRef}
                            ariaLabel={`${termLabel} grade after each task for ${plotted
                                .map(
                                    (course) =>
                                        `${course.subjectCode} (latest ${formatGrade(course.points.at(-1)?.grade)}, target ${course.target}%)`,
                                )
                                .join(", ")}. The same data is in the table below.`}
                            overlay={<HistoryTooltip store={store} />}
                            emptyMessage={
                                plotted.length > 0
                                    ? null
                                    : visible.length === 0
                                      ? "Choose at least one subject above to see its line."
                                      : `The subjects you chose have no scored tasks for ${termLabel} yet.`
                            }
                            legend={legend}
                            table={table}
                        >
                            {plotted.map((course) => (
                                <ReferenceLine
                                    key={`target-${course.classId}`}
                                    y={course.target}
                                    stroke={course.color}
                                    strokeDasharray="7 5"
                                    strokeWidth={1.5}
                                />
                            ))}
                            {plotted.map((course) => {
                                const reachedStep =
                                    course.reachedIndex >= 0
                                        ? course.points[course.reachedIndex].step
                                        : null;
                                const dotProps = {
                                    course,
                                    surface: colors.surface,
                                    success: colors.success,
                                    onSelect: (point) => openTask(course, point),
                                    hover,
                                };
                                return (
                                    <Line
                                        key={course.classId}
                                        data={course.points}
                                        dataKey="grade"
                                        name={course.subjectCode}
                                        type="linear"
                                        stroke={course.color}
                                        strokeWidth={2.5}
                                        dot={(props) => (
                                            <SubjectDot
                                                key={`${course.classId}-${props.index}`}
                                                {...props}
                                                {...dotProps}
                                                reached={props.payload?.step === reachedStep}
                                            />
                                        )}
                                        activeDot={false}
                                        isAnimationActive={false}
                                        connectNulls={false}
                                    />
                                );
                            })}
                        </HistoryChartFrame>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
