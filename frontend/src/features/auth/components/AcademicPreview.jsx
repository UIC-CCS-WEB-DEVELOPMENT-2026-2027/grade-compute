// The decorative grade-progress card on the login page's hero: five sample
// bars rising to a target, with notes around them. It is an illustration,
// so it is hidden from screen readers apart from its label.
import { cn } from "@/lib/utils";
import graduationCap from "@/assets/graduation-cap.svg";
import targetStar from "@/assets/target-star.svg";
import openTargetButton from "@/assets/open-target-button.svg";
import openArrow from "@/assets/open-arrow.svg";
import greenStatusDot from "@/assets/green-status-dot.svg";
import notificationCheckBadge from "@/assets/notification-check-badge.svg";
import notificationCheck from "@/assets/notification-check.svg";
import dottedHeaderDivider from "@/assets/dotted-header-divider.svg";
import chartLowerRule from "@/assets/chart-lower-rule.svg";

// Each bar's height (24, 41, 54, 72 and 89px) and grow delay (180ms, then
// 120ms more per bar).
const previewScores = [
    {
        value: 84,
        height: "h-6",
        delay: "animate-delay-180",
        label: "Quiz 1",
        bar: "from-self-reported/40 to-self-reported/30",
    },
    {
        value: 88,
        height: "h-10.25",
        delay: "animate-delay-300",
        label: "Lab 1",
        bar: "from-self-reported/70 to-self-reported/55",
    },
    {
        value: 91,
        height: "h-13.5",
        delay: "animate-delay-420",
        label: "Quiz 2",
        bar: "from-self-reported to-self-reported/80",
    },
    {
        value: 93,
        height: "h-18",
        delay: "animate-delay-540",
        label: "Midterm",
        bar: "from-primary to-self-reported",
    },
    {
        value: 95,
        height: "h-22.25",
        delay: "animate-delay-660",
        label: "Target",
        bar: "from-self-reported-foreground to-primary shadow-card",
    },
];

export function AcademicPreview() {
    return (
        <div
            className="relative mt-8 ml-6 w-full max-w-114 pb-7 animate-auth-float motion-reduce:animate-none max-xl:ml-3"
            aria-label="Example grade progress, from 84 percent to a 95 percent target"
        >
            <div className="relative min-h-63 w-full -rotate-6 rounded-lg border border-border bg-card px-4 pt-4 pb-7 shadow-hover">
                <div className="flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-md bg-secondary">
                        <img className="block" src={graduationCap} alt="" />
                    </span>
                    <div className="grid flex-1 gap-px">
                        <small className="type-caption text-primary">YOU'RE VERY ON TRACK</small>
                        <span className="type-caption font-normal text-muted-foreground">
                            A plan for your Q1 target
                        </span>
                    </div>
                    <span className="relative grid size-6 place-items-center" aria-hidden="true">
                        <img className="absolute inset-0" src={openTargetButton} alt="" />
                        <img className="relative" src={openArrow} alt="" />
                    </span>
                </div>
                <img className="mt-3 mb-2 block max-w-full" src={dottedHeaderDivider} alt="" />
                <div className="flex items-center gap-3">
                    <span className="type-caption font-normal text-muted-foreground">
                        My grade target
                    </span>
                    <em className="flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-1.5 py-0.5 type-caption not-italic text-success">
                        <img src={greenStatusDot} alt="" /> On Track
                    </em>
                    <strong className="ml-auto flex items-center gap-1 type-card-title text-primary">
                        96% <img src={targetStar} alt="" />
                    </strong>
                </div>
                <div
                    className="relative mt-3 flex h-32 items-end gap-4 px-3 pt-1"
                    aria-hidden="true"
                >
                    {previewScores.map(({ value, height, delay, label, bar }) => (
                        <div
                            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                            key={label}
                        >
                            <div className={cn("group/bar relative mb-2 w-full", height)}>
                                <small className="absolute -top-6 left-0 w-full text-center type-caption font-normal text-muted-foreground">
                                    {value}%
                                </small>
                                <span className="block size-full origin-bottom transition duration-850 ease-auth group-hover/bar:scale-y-108 group-hover/bar:brightness-112 group-hover/bar:saturate-115">
                                    <i
                                        className={cn(
                                            "block size-full origin-bottom animate-auth-bar-grow rounded-t-md bg-linear-to-b",
                                            delay,
                                            bar,
                                        )}
                                    />
                                </span>
                            </div>
                            <span className="type-caption font-normal text-muted-foreground">
                                {label}
                            </span>
                        </div>
                    ))}
                    <img
                        className="absolute bottom-5 left-0 max-w-full"
                        src={chartLowerRule}
                        alt=""
                    />
                </div>
            </div>
            <div className="absolute -right-24 bottom-0 flex animate-auth-note-enter items-center gap-1.5 rounded-md border border-primary bg-card px-2.5 py-2 type-caption font-normal text-muted-foreground shadow-card motion-reduce:animate-none max-xl:-right-6">
                <span
                    className="relative grid size-5.5 shrink-0 place-items-center"
                    aria-hidden="true"
                >
                    <img className="absolute inset-0" src={notificationCheckBadge} alt="" />
                    <img className="relative" src={notificationCheck} alt="" />
                </span>
                <div>Make Your Target Grade a Reality</div>
            </div>
        </div>
    );
}
