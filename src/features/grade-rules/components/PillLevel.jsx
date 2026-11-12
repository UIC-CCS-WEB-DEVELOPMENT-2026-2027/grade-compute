// src/components/shared/PillLevel.jsx
// One row of the pill editor: the children of a single criterion drawn as a
// segmented slider. Each section shows a dot per 10% of the level, a slider
// handle sits in the gap between sections, and the typed percentage sits
// under each section. All math comes from src/utils/rules.js.
import { useRef, useState } from "react";
import { PencilIcon, PlusIcon, XIcon } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group";
import {
    TOTAL_SHARE,
    addCriterion,
    canAddCriterion,
    canDeleteCriterion,
    canSplitCriterion,
    deleteCriterion,
    dragHandle,
    findCriterion,
    formatPercent,
    getLevelSegments,
    getPreviewSegments,
    renameCriterion,
    setCriterionPercent,
    shareToPercent,
    splitCriterion,
} from "@/lib/rules";
import { cn } from "@/lib/utils";

// The small add, rename and delete buttons (24px). Below lg, rename and
// delete are 44px; add keeps its size beside the name and gets a 44px
// touch area instead, so narrow names don't truncate.
// Disabled ones still take the pointer, so their tooltip (the reason) shows.
const ICON_BUTTON =
    "bg-card text-muted-foreground disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-40";

export function PillLevel({ tree, levelId, depth, structureLocked, onChange }) {
    const level = findCriterion(tree, levelId);
    const segments = getLevelSegments(tree, levelId);

    const [draft, setDraft] = useState(null); // { id, value } while typing a percentage
    const [renaming, setRenaming] = useState(null); // { id, value } while renaming
    const [previewId, setPreviewId] = useState(null);
    const [warning, setWarning] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    // The criterion waiting for "Delete … and all of its subcriteria?". It is
    // kept while the dialog closes, so the question doesn't change.
    const [pendingDelete, setPendingDelete] = useState(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const okRef = useRef(null);

    const barRefs = useRef({});
    const dragIndex = useRef(null);
    const skipCommit = useRef(false);
    const lastPointerType = useRef("mouse");

    if (!level || segments.length === 0) return null;

    function apply(result) {
        if (result.ok) {
            setWarning("");
            if (result.tree !== tree) onChange(result.tree);
        } else {
            setWarning(result.error);
        }
        return result.ok;
    }

    // ---- Typing a percentage ------------------------------------------------

    function commitPercent() {
        if (skipCommit.current) {
            skipCommit.current = false;
            setDraft(null);
            return;
        }
        if (!draft) return;
        apply(setCriterionPercent(tree, draft.id, draft.value));
        setDraft(null);
    }

    function handlePercentKey(event) {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
            skipCommit.current = true;
            event.currentTarget.blur();
        }
    }

    // ---- Dragging a handle (mouse and touch via Pointer Events) --------------

    function startDrag(event, index) {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragIndex.current = index;
        setIsDragging(true);
        setPreviewId(null);
    }

    function moveDrag(event) {
        const index = dragIndex.current;
        if (index === null) return;

        const children = level.children;
        const left = children[index];
        const right = children[index + 1];
        const leftBox = barRefs.current[left.id]?.getBoundingClientRect();
        const rightBox = barRefs.current[right.id]?.getBoundingClientRect();
        if (!leftBox || !rightBox) return;

        // Map the pointer onto the two sections being resized. This stays
        // accurate even when narrow sections are held at their minimum width.
        const span = rightBox.right - leftBox.left;
        if (span <= 0) return;
        const local = Math.min(1, Math.max(0, (event.clientX - leftBox.left) / span));
        const before = children.slice(0, index).reduce((total, child) => total + child.share, 0);
        const ratio = (before + local * (left.share + right.share)) / TOTAL_SHARE;

        apply(dragHandle(tree, levelId, index, ratio));
    }

    function endDrag() {
        dragIndex.current = null;
        setIsDragging(false);
    }

    // Arrow keys move a focused handle by 1% (10% with Shift); Home and End
    // jump to the limits. The handle stops at the 1% minimum on either side.
    function handleSliderKey(event, index) {
        const steps = { ArrowLeft: -100, ArrowDown: -100, ArrowRight: 100, ArrowUp: 100 };
        const children = level.children;
        const left = children[index];
        const right = children[index + 1];
        let leftShare;

        if (event.key in steps) {
            leftShare = left.share + steps[event.key] * (event.shiftKey ? 10 : 1);
        } else if (event.key === "Home") {
            leftShare = 0;
        } else if (event.key === "End") {
            leftShare = left.share + right.share;
        } else {
            return;
        }

        event.preventDefault();
        const before = children.slice(0, index).reduce((total, child) => total + child.share, 0);
        apply(dragHandle(tree, levelId, index, (before + leftShare) / TOTAL_SHARE, 1));
    }

    // ---- Hover preview (mouse hover, tap on touch, keyboard focus) -----------

    function previewHandlers(id) {
        return {
            onPointerDown: (event) => {
                lastPointerType.current = event.pointerType;
            },
            onPointerEnter: (event) => {
                if (event.pointerType === "mouse") setPreviewId(id);
            },
            onPointerLeave: (event) => {
                if (event.pointerType === "mouse") setPreviewId(null);
            },
            onFocus: (event) => {
                if (event.currentTarget.matches(":focus-visible")) setPreviewId(id);
            },
            onBlur: () => setPreviewId(null),
            onClick: (event) => {
                // Taps toggle the preview. Mouse clicks and keyboard presses
                // (detail === 0) are already handled by hover and focus.
                if (event.detail === 0 || lastPointerType.current === "mouse") return;
                setPreviewId((current) => (current === id ? null : id));
            },
        };
    }

    // ---- Structure editing (hidden when structureLocked) ---------------------

    function commitRename() {
        if (!renaming) return;
        if (skipCommit.current) {
            skipCommit.current = false;
        } else {
            apply(renameCriterion(tree, renaming.id, renaming.value));
        }
        setRenaming(null);
    }

    function handleRenameKey(event) {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
            skipCommit.current = true;
            event.currentTarget.blur();
        }
    }

    // A criterion with subcriteria is deleted only after the question.
    function handleDelete(segment) {
        const check = canDeleteCriterion(tree, segment.id);
        if (check.hasSubcriteria) {
            setPendingDelete(segment);
            setIsDeleteOpen(true);
            return;
        }
        apply(deleteCriterion(tree, segment.id));
    }

    function confirmDelete() {
        setIsDeleteOpen(false);
        apply(deleteCriterion(tree, pendingDelete.id));
    }

    const addCheck = structureLocked ? null : canAddCriterion(tree, levelId);
    const warningId = `pill-warning-${levelId}`;

    // ---- Rendering -----------------------------------------------------------

    function renderName(segment, index) {
        if (renaming?.id === segment.id) {
            return (
                <Input
                    className="h-8 max-w-45 bg-card px-1.5 py-0.5 type-card-title md:type-card-title"
                    value={renaming.value}
                    onChange={(event) => setRenaming({ id: segment.id, value: event.target.value })}
                    onBlur={commitRename}
                    onKeyDown={handleRenameKey}
                    aria-label={`New name for ${segment.name}`}
                    autoFocus
                />
            );
        }

        const isLast = index === segments.length - 1;
        const label = segment.hasChildren ? (
            <Button
                variant="ghost"
                className="relative h-auto min-w-0 cursor-help rounded-none max-lg:after:absolute max-lg:after:-inset-y-2.5 border-0 border-b-2 border-dotted border-muted-foreground p-0 type-card-title text-foreground hover:border-solid hover:border-primary hover:bg-transparent hover:text-primary aria-pressed:border-solid aria-pressed:border-primary aria-pressed:text-primary"
                aria-pressed={previewId === segment.id}
                aria-label={`${segment.name}, show breakdown`}
                {...previewHandlers(segment.id)}
            >
                <span className="truncate">{segment.name}</span>
            </Button>
        ) : (
            <span className="min-w-0 truncate type-card-title text-foreground" title={segment.name}>
                {segment.name}
            </span>
        );

        return (
            <>
                {label}
                {!structureLocked && isLast && (
                    <Button
                        variant="outline"
                        size="icon-xs"
                        className={cn(
                            ICON_BUTTON,
                            "relative border-foreground text-foreground max-lg:after:absolute max-lg:after:-inset-2.5",
                        )}
                        onClick={() => apply(addCriterion(tree, levelId))}
                        disabled={!addCheck.allowed}
                        aria-label="Add a criterion"
                        title={addCheck.reason || "Add a criterion"}
                    >
                        <PlusIcon aria-hidden="true" />
                    </Button>
                )}
            </>
        );
    }

    // One chip per criterion with its rename, split, and delete actions.
    // Kept below the pill so narrow sections still have room for their names.
    function renderManageChip(segment) {
        const deleteCheck = canDeleteCriterion(tree, segment.id);
        const splitCheck = canSplitCriterion(tree, segment.id);
        return (
            <li key={segment.id}>
                <Badge
                    variant="outline"
                    className="h-auto gap-1 overflow-visible rounded-md bg-card py-0.75 pr-1 pl-2.5 type-small font-normal text-foreground"
                >
                    <i
                        className="mr-0.5 size-2.5 shrink-0 rounded-full"
                        // The criterion's colour from the rule.
                        style={{ backgroundColor: segment.color }}
                        aria-hidden="true"
                    />
                    <span className="mr-1">{segment.name}</span>
                    <Button
                        variant="outline"
                        size="icon-xs"
                        className={cn(ICON_BUTTON, "max-lg:size-11")}
                        onClick={() => setRenaming({ id: segment.id, value: segment.name })}
                        aria-label={`Rename ${segment.name}`}
                        title="Rename"
                    >
                        <PencilIcon aria-hidden="true" />
                    </Button>
                    {splitCheck.allowed && (
                        <Button
                            variant="outline"
                            size="xs"
                            className="bg-card font-normal text-primary max-lg:h-11"
                            onClick={() => apply(splitCriterion(tree, segment.id))}
                            aria-label={`Split ${segment.name} into subcriteria`}
                            title="Split into subcriteria"
                        >
                            Split
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="icon-xs"
                        className={cn(ICON_BUTTON, "max-lg:size-11")}
                        onClick={() => handleDelete(segment)}
                        disabled={!deleteCheck.allowed}
                        aria-label={`Delete ${segment.name}`}
                        title={deleteCheck.reason || "Delete"}
                    >
                        <XIcon aria-hidden="true" />
                    </Button>
                </Badge>
            </li>
        );
    }

    // Inside the bar: one dot per full 10% of this level (bar 2 of the
    // reference), or the view-only breakdown while previewing.
    function renderBarContent(segment) {
        if (previewId === segment.id) {
            return (
                <div className="flex w-full gap-1 self-stretch">
                    {getPreviewSegments(tree, segment.id).map((part) => (
                        <div
                            key={part.id}
                            className="flex min-w-0 basis-0 flex-col items-center justify-center rounded-md px-1.5 text-center type-small group-first/criterion:first:rounded-l-full group-last/criterion:last:rounded-r-full"
                            // Each part's share and colours come from the rule.
                            style={{
                                flexGrow: part.sectionRatio,
                                backgroundColor: part.color,
                                color: part.onColor,
                            }}
                            title={`${part.name}: ${formatPercent(part.effectiveShare)} of the grade`}
                        >
                            <span className="max-w-full truncate">{part.name}</span>
                            <strong className="max-w-full truncate font-semibold">
                                {formatPercent(part.effectiveShare)}
                            </strong>
                        </div>
                    ))}
                </div>
            );
        }

        const dotCount = Math.floor(segment.share / 1000);
        return (
            <span
                className="pointer-events-none flex min-w-0 flex-1 items-center justify-evenly px-3.5"
                aria-hidden="true"
            >
                {Array.from({ length: dotCount }, (_, dot) => (
                    <i
                        key={dot}
                        className="size-2 shrink-0 rounded-full bg-(--pill-on) opacity-60 inset-shadow-xs inset-shadow-foreground/45"
                    />
                ))}
            </span>
        );
    }

    // The slider handle in the gap after a section (bar 4 of the reference):
    // a thick rounded line, with a wider invisible grab area (::before). It
    // narrows while it is dragged.
    function renderHandle(segment, index) {
        const next = segments[index + 1];
        return (
            <span
                className="absolute -top-3.5 -right-3.25 -bottom-3.5 z-2 w-2 cursor-ew-resize touch-none rounded-full bg-primary transition-all duration-150 before:absolute before:-inset-x-4.5 before:-inset-y-1.5 hover:bg-self-reported focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring group-data-dragging/level:active:-right-2.75 group-data-dragging/level:active:w-1 group-data-dragging/level:active:bg-self-reported motion-reduce:transition-none"
                role="slider"
                tabIndex={0}
                aria-label={`Divider between ${segment.name} and ${next.name}`}
                aria-valuemin={1}
                aria-valuemax={shareToPercent(segment.share + next.share) - 1}
                aria-valuenow={shareToPercent(segment.share)}
                aria-valuetext={`${segment.name} ${formatPercent(segment.share)}, ${next.name} ${formatPercent(next.share)}`}
                onPointerDown={(event) => startDrag(event, index)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onKeyDown={(event) => handleSliderKey(event, index)}
            />
        );
    }

    function renderPercent(segment) {
        const value =
            draft?.id === segment.id ? draft.value : String(shareToPercent(segment.share));

        return (
            <InputGroup className="mt-2.5 h-8 w-auto max-w-full self-center bg-card hover:border-primary max-lg:h-control">
                {/* Sized to the number where the browser can, so "%" sits
                    right after it. pr-0.5! beats InputGroup's own padding for
                    an input with an end addon. */}
                <InputGroupInput
                    className="w-12 min-w-4 flex-none pr-0.5! pl-2 text-right type-body tabular-nums field-sizing-content md:type-body supports-[field-sizing:content]:w-auto"
                    type="text"
                    inputMode="decimal"
                    value={value}
                    onFocus={(event) => {
                        setWarning("");
                        setDraft({ id: segment.id, value: event.target.value });
                        event.target.select();
                    }}
                    onChange={(event) => setDraft({ id: segment.id, value: event.target.value })}
                    onBlur={commitPercent}
                    onKeyDown={handlePercentKey}
                    aria-label={`${segment.name} percentage`}
                    aria-describedby={warning ? warningId : undefined}
                />
                <InputGroupAddon align="inline-end" className="pl-0 font-normal">
                    <InputGroupText aria-hidden="true">%</InputGroupText>
                </InputGroupAddon>
            </InputGroup>
        );
    }

    return (
        <section
            className="group/level pill-indent not-first:border-0 not-first:border-t not-first:border-dashed not-first:border-border not-first:pt-5.5"
            data-dragging={isDragging || undefined}
            // The level's depth in the rule sets its indent (pill-indent).
            style={{ "--pill-depth": depth }}
            aria-label={`${level.name} breakdown`}
        >
            <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
                <div className="flex min-w-0 flex-1 basis-80">
                    {segments.map((segment, index) => (
                        <div
                            key={segment.id}
                            className="group/criterion flex min-w-16 basis-0 flex-col transition-all duration-250 group-data-dragging/level:transition-none motion-reduce:transition-none"
                            // Each section's width is its share of the level.
                            style={{ flexGrow: segment.share }}
                        >
                            <div className="flex min-h-8.5 items-center gap-1 px-3 pb-1.5">
                                {renderName(segment, index)}
                            </div>
                            <div
                                ref={(element) => {
                                    barRefs.current[segment.id] = element;
                                }}
                                className={cn(
                                    "relative mx-2.25 flex h-13 items-center rounded-lg bg-(--pill-color) text-(--pill-on) transition-colors group-first/criterion:ml-0 group-first/criterion:rounded-l-full group-last/criterion:mr-0 group-last/criterion:rounded-r-full motion-reduce:transition-none",
                                    previewId === segment.id && "bg-transparent",
                                )}
                                // The criterion's colours from the rule.
                                style={{
                                    "--pill-color": segment.color,
                                    "--pill-on": segment.onColor,
                                }}
                            >
                                {renderBarContent(segment)}
                                {index < segments.length - 1 && renderHandle(segment, index)}
                            </div>
                            {renderPercent(segment)}
                        </div>
                    ))}
                </div>
                <p className="m-0 mb-12.5 type-section-title whitespace-nowrap text-foreground max-sm:mb-0">
                    = {level.name}
                </p>
            </div>

            <p
                id={warningId}
                className="m-0 mt-2.5 min-h-5 type-small text-destructive empty:mt-0"
                role="alert"
            >
                {warning}
            </p>

            {!structureLocked && (
                <ul
                    className="m-0 flex list-none flex-wrap gap-2 p-0"
                    aria-label={`Criteria in ${level.name}`}
                >
                    {segments.map(renderManageChip)}
                </ul>
            )}

            {/* Deleting a criterion that has subcriteria asks first (it
                replaced the browser's confirm box, D4): same question, OK and
                Cancel, focus on OK. */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent initialFocus={okRef}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete {pendingDelete?.name} and all of its subcriteria?
                        </AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction ref={okRef} onClick={confirmDelete}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
}
