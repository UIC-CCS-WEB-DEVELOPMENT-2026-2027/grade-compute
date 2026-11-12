// src/components/student/HistoryChart.jsx
// One subject's term grade after each scored task (solid line), with:
// - the target and the 75% passing grade as reference lines,
// - a faded dot where an official score replaced your own entry,
// - a "Target reached" marker on the latest task when it is at or above the
//   target (on the plan's last task when only the plan gets there),
// - optionally the sandbox plan for the remaining tasks (dotted line).
// Used on Subject Detail (SubjectGradeHistory) and in the sandbox.
// Data comes from utils/history.js.
import { Line, ReferenceLine } from "recharts";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { resolveColor } from "@/lib/dom/cssColor";
import { getChartScale, getTargetReachedIndex, PASSING_GRADE } from "@/lib/history";
import { HistoryChartFrame } from "./HistoryChartFrame";
import { HistoryTooltip } from "./HistoryTooltip";
import { usePointHover } from "@/features/history/hooks/usePointHover";
import { formatGrade } from "@/lib/format";

// A dot grows when hovered (CSS only, so the chart is not redrawn).
const DOT_MARK =
    "origin-center transform-fill transition group-hover/dot:scale-140 motion-reduce:transition-none";

// Keep the "Target reached" label inside the chart: below the point when
// the point is near the top edge, and inward at the first/last step.
function labelY(cy, gap) {
    return cy - gap < 34 ? cy + gap + 10 : cy - gap;
}

function labelAnchor(step, lastStep) {
    if (step <= 1) return "start";
    if (step >= lastStep) return "end";
    return "middle";
}

// Invisible circle over each dot: makes it easy to hover, click or tap, and
// opens the tooltip for that one point only.
function HitArea({ cx, cy, hoverKey, data, hover, onClick }) {
    return (
        <circle
            cx={cx}
            cy={cy}
            r={12}
            fill="transparent"
            onMouseEnter={(event) => hover.show(event, hoverKey, data)}
            onMouseLeave={() => hover.hide(hoverKey)}
            onClick={onClick}
        />
    );
}

// Real scores: filled dot for official, hollow accent dot for your own.
// The latest task gets a ring and a label when it is at the target.
function RealDot({ cx, cy, payload, colors, reachedStep, lastStep, onSelect, hover }) {
    if (
        cx === undefined ||
        cy === undefined ||
        payload?.grade === null ||
        payload?.grade === undefined
    )
        return null;
    const clickable = Boolean(onSelect && payload.taskId);
    const key = `real-${payload.step}`;
    return (
        <g className={cn("group/dot", clickable && "cursor-pointer")}>
            {payload.step === reachedStep && (
                <>
                    <circle
                        cx={cx}
                        cy={cy}
                        r={11}
                        fill="none"
                        stroke={colors.success}
                        strokeWidth={2}
                    />
                    <text
                        x={cx}
                        y={labelY(cy, 16)}
                        textAnchor={labelAnchor(payload.step, lastStep)}
                        fill={colors.success}
                        fontSize={12}
                        fontWeight={700}
                    >
                        Target reached
                    </text>
                </>
            )}
            {payload.isOfficial ? (
                <circle className={DOT_MARK} cx={cx} cy={cy} r={5} fill={colors.official} />
            ) : (
                <circle
                    className={DOT_MARK}
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={colors.surface}
                    stroke={colors.accent}
                    strokeWidth={2.5}
                />
            )}
            <HitArea
                cx={cx}
                cy={cy}
                hoverKey={key}
                data={{ point: payload, kind: "real" }}
                hover={hover}
                onClick={clickable ? () => onSelect(payload) : undefined}
            />
        </g>
    );
}

// Your own entry that an official score replaced: a faded hollow dot.
function GhostDot({ cx, cy, payload, colors, hover }) {
    if (
        cx === undefined ||
        cy === undefined ||
        payload?.ghostGrade === null ||
        payload?.ghostGrade === undefined
    )
        return null;
    const key = `ghost-${payload.step}`;
    return (
        <g className="group/dot">
            <circle
                className={cn(DOT_MARK, "opacity-55 group-hover/dot:opacity-95")}
                cx={cx}
                cy={cy}
                r={4.5}
                fill={colors.surface}
                stroke={colors.accent}
                strokeWidth={2}
                strokeDasharray="2 2"
            />
            <HitArea
                cx={cx}
                cy={cy}
                hoverKey={key}
                data={{ point: payload, kind: "ghost" }}
                hover={hover}
            />
        </g>
    );
}

// Planned (simulated) tasks: small hollow dots on the dotted line.
function PlanDot({ cx, cy, payload, colors, reachedStep, lastStep, hover }) {
    if (cx === undefined || cy === undefined || !payload?.isPlan) return null;
    const key = `plan-${payload.step}`;
    return (
        <g className="group/dot">
            {payload.step === reachedStep && (
                <text
                    x={cx}
                    y={labelY(cy, 12)}
                    textAnchor={labelAnchor(payload.step, lastStep)}
                    fill={colors.success}
                    fontSize={12}
                    fontWeight={700}
                >
                    Target reached
                </text>
            )}
            <circle
                className={DOT_MARK}
                cx={cx}
                cy={cy}
                r={4}
                fill={colors.surface}
                stroke={colors.plan}
                strokeWidth={2}
            />
            <HitArea
                cx={cx}
                cy={cy}
                hoverKey={key}
                data={{ point: payload, kind: "plan" }}
                hover={hover}
            />
        </g>
    );
}

// The legend marks, drawn like the lines and dots on the chart.
const LEGEND_MARKS = {
    official: "size-2.5 rounded-full bg-foreground",
    self: "size-2.5 rounded-full border-2 border-self-reported bg-card",
    ghost: "size-2.5 rounded-full border-2 border-dashed border-self-reported bg-card opacity-60",
    plan: "w-4.5 border-0 border-t-2 border-dashed border-muted-foreground",
    target: "w-4.5 border-0 border-t-2 border-dashed border-foreground",
    passing: "w-4.5 border-0 border-t-2 border-dotted border-destructive",
};

// points: real history (getGradeHistory). planPoints: getPlanPoints().points.
// showPlan: draw planPoints. emphasizePlan: thicker plan line (sandbox).
// target / targetLabel: the dashed target line. termLabel: e.g. "Prelim".
// onSelect(point): called when a real point is clicked (go to that task).
// heightClass: the plot height as a Tailwind class.
export function HistoryChart({
    points,
    planPoints = [],
    showPlan = false,
    emphasizePlan = false,
    target,
    targetLabel = "Target",
    termLabel,
    onSelect,
    heightClass = "h-75",
}) {
    const { plotRef, store, show, hide } = usePointHover();
    // What each dot needs to open and close the tooltip.
    const hover = { show, hide };
    const plan = showPlan ? planPoints : [];
    if (points.length === 0 && plan.length === 0) {
        return (
            <p className="m-0 rounded-lg border border-dashed border-border px-5 py-7 text-center type-small text-muted-foreground">
                No scored tasks for {termLabel} yet. Add a score in Current Term Records and it will
                appear here.
            </p>
        );
    }

    const colors = {
        line: resolveColor("var(--primary)"),
        official: resolveColor("var(--foreground)"),
        accent: resolveColor("var(--self-reported)"),
        surface: resolveColor("var(--card)"),
        plan: resolveColor(emphasizePlan ? "var(--primary)" : "var(--muted-foreground)"),
        success: resolveColor("var(--success)"),
        target: resolveColor("var(--foreground)"),
    };

    // One row per step. The last real step also starts the plan line, so
    // the dotted line continues from where the solid one ends.
    const rows = points.map((point) => ({ ...point }));
    if (plan.length && rows.length) rows[rows.length - 1].planGrade = rows[rows.length - 1].grade;
    plan.forEach((point) => rows.push({ ...point, isPlan: true }));

    const reachedIndex = getTargetReachedIndex(points, target);
    const reachedStep = reachedIndex >= 0 ? points[reachedIndex].step : null;
    const planReachedIndex =
        reachedStep === null ? getTargetReachedIndex(plan, target, "planGrade") : -1;
    const planReachedStep = planReachedIndex >= 0 ? plan[planReachedIndex].step : null;

    const scale = getChartScale(
        [
            ...points.flatMap((point) => [point.grade, point.ghostGrade]),
            ...plan.map((point) => point.planGrade),
            target,
            PASSING_GRADE,
        ],
        rows.length,
    );
    const latest = points.length ? points[points.length - 1].grade : null;
    const gap = latest === null || target === null ? null : latest - target;
    const hasGhosts = points.some(
        (point) => point.ghostGrade !== null && point.ghostGrade !== undefined,
    );

    const legendItems = [
        ["official", "Official score"],
        ["self", "Your score"],
        hasGhosts && ["ghost", "Your entry before the official score"],
        plan.length > 0 && ["plan", "Plan for remaining tasks"],
        target !== null && ["target", `${targetLabel} ${formatGrade(target)}`],
        ["passing", `Passing ${PASSING_GRADE}%`],
    ].filter(Boolean);
    const legend = (
        <p className="m-0 flex flex-wrap gap-2 type-caption font-normal text-muted-foreground">
            {legendItems.map(([mark, text]) => (
                <span
                    key={mark}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-1"
                >
                    <i className={cn("inline-block", LEGEND_MARKS[mark])} aria-hidden="true" />{" "}
                    {text}
                </span>
            ))}
        </p>
    );

    const table = (
        <Table className="rounded-lg border border-border">
            <TableCaption className="mt-0 mb-2 caption-top text-left text-foreground">
                {termLabel} grade after each task
            </TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead>Step</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Grade so far</TableHead>
                    {onSelect && (
                        <TableHead>
                            <span className="sr-only">Go to task</span>
                        </TableHead>
                    )}
                </TableRow>
            </TableHeader>
            <TableBody>
                {points.map((point) => (
                    <TableRow key={`real-${point.step}`}>
                        <TableCell>{point.step}</TableCell>
                        <TableCell className="whitespace-normal">
                            {point.criterionName} · {point.label}
                        </TableCell>
                        <TableCell className="whitespace-normal">
                            {point.percent.toFixed(1)}%{" "}
                            {point.isOfficial ? "(official)" : "(yours)"}
                            {point.replacedEntry &&
                                ` · you entered ${point.replacedEntry.percent.toFixed(1)}%`}
                        </TableCell>
                        <TableCell>{formatGrade(point.grade)}</TableCell>
                        {onSelect && (
                            <TableCell className="text-right">
                                {point.taskId && (
                                    <Button
                                        variant="link"
                                        className="h-auto p-0 tap:min-h-11"
                                        onClick={() => onSelect(point)}
                                    >
                                        Go to task
                                    </Button>
                                )}
                            </TableCell>
                        )}
                    </TableRow>
                ))}
                {plan.map((point) => (
                    <TableRow key={`plan-${point.step}`} className="text-muted-foreground italic">
                        <TableCell>{point.step}</TableCell>
                        <TableCell className="whitespace-normal">
                            {point.criterionName} · {point.label} (planned)
                        </TableCell>
                        <TableCell className="whitespace-normal">
                            {formatGrade(point.percent)}{" "}
                            {point.isExpected ? "(your estimate)" : "(needed)"}
                        </TableCell>
                        <TableCell>{formatGrade(point.planGrade)}</TableCell>
                        {onSelect && <TableCell />}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    return (
        <div className="flex flex-col gap-3">
            {latest !== null && (
                <p className="m-0 rounded-lg border border-border bg-muted px-3 py-2.5 type-small text-muted-foreground">
                    <strong className="type-section-title text-primary tabular-nums">
                        {formatGrade(latest)}
                    </strong>{" "}
                    after {points.length} task
                    {points.length === 1 ? "" : "s"}
                    {target !== null && (
                        <>
                            {" · "}
                            {targetLabel.toLowerCase()} {formatGrade(target)}
                            {" · "}
                            <span className={gap >= 0 ? "text-success" : "text-destructive"}>
                                {Math.abs(gap) < 0.005
                                    ? "on target"
                                    : gap > 0
                                      ? `${gap.toFixed(2)} points above`
                                      : `${Math.abs(gap).toFixed(2)} points below`}
                            </span>
                        </>
                    )}
                </p>
            )}

            <HistoryChartFrame
                scale={scale}
                plotRef={plotRef}
                ariaLabel={`${termLabel} grade after each task${latest !== null ? `, latest ${formatGrade(latest)}` : ""}${target !== null ? `, ${targetLabel.toLowerCase()} ${formatGrade(target)}` : ""}${plan.length ? `, with a plan for ${plan.length} remaining tasks ending at ${formatGrade(plan[plan.length - 1].planGrade)}` : ""}. The same data is in the table below.`}
                overlay={<HistoryTooltip store={store} />}
                legend={legend}
                table={table}
                heightClass={heightClass}
                marginTop={26}
            >
                {target !== null && (
                    <ReferenceLine
                        y={target}
                        stroke={colors.target}
                        strokeDasharray="7 5"
                        strokeWidth={1.5}
                    />
                )}
                {plan.length > 0 && (
                    <Line
                        data={rows}
                        dataKey="planGrade"
                        type="linear"
                        stroke={colors.plan}
                        strokeWidth={emphasizePlan ? 3 : 2}
                        strokeDasharray="6 5"
                        dot={
                            <PlanDot
                                colors={colors}
                                reachedStep={planReachedStep}
                                lastStep={rows.length}
                                hover={hover}
                            />
                        }
                        activeDot={false}
                        isAnimationActive={false}
                        connectNulls={false}
                    />
                )}
                {hasGhosts && (
                    <Line
                        data={rows}
                        dataKey="ghostGrade"
                        stroke="none"
                        dot={<GhostDot colors={colors} hover={hover} />}
                        activeDot={false}
                        isAnimationActive={false}
                        legendType="none"
                    />
                )}
                <Line
                    data={rows}
                    dataKey="grade"
                    type="linear"
                    stroke={colors.line}
                    strokeWidth={3}
                    dot={
                        <RealDot
                            colors={colors}
                            reachedStep={reachedStep}
                            lastStep={rows.length}
                            onSelect={onSelect}
                            hover={hover}
                        />
                    }
                    activeDot={false}
                    isAnimationActive={false}
                    connectNulls={false}
                />
            </HistoryChartFrame>
        </div>
    );
}
