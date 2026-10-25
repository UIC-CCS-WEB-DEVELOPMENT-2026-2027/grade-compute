// src/components/shared/PillLevel.jsx
// One row of the pill editor: the children of a single criterion drawn as a
// segmented slider. Each section shows a dot per 10% of the level, a slider
// handle sits in the gap between sections, and the typed percentage sits
// under each section. All math comes from src/utils/rules.js.
import { useRef, useState } from "react";
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
} from "../../utils/rules";

export default function PillLevel({ tree, levelId, depth, structureLocked, onChange }) {
    const level = findCriterion(tree, levelId);
    const segments = getLevelSegments(tree, levelId);

    const [draft, setDraft] = useState(null); // { id, value } while typing a percentage
    const [renaming, setRenaming] = useState(null); // { id, value } while renaming
    const [previewId, setPreviewId] = useState(null);
    const [warning, setWarning] = useState("");
    const [isDragging, setIsDragging] = useState(false);

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

    function handleDelete(segment) {
        const check = canDeleteCriterion(tree, segment.id);
        if (
            check.hasSubcriteria &&
            !window.confirm(`Delete ${segment.name} and all of its subcriteria?`)
        ) {
            return;
        }
        apply(deleteCriterion(tree, segment.id));
    }

    const addCheck = structureLocked ? null : canAddCriterion(tree, levelId);
    const warningId = `pill-warning-${levelId}`;

    // ---- Rendering -----------------------------------------------------------

    function renderName(segment, index) {
        if (renaming?.id === segment.id) {
            return (
                <input
                    className="pill-name-input"
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
            <button
                type="button"
                className={`pill-name pill-name-button ${previewId === segment.id ? "is-previewing" : ""}`}
                aria-pressed={previewId === segment.id}
                aria-label={`${segment.name}, show breakdown`}
                {...previewHandlers(segment.id)}
            >
                {segment.name}
            </button>
        ) : (
            <span className="pill-name" title={segment.name}>
                {segment.name}
            </span>
        );

        return (
            <>
                {label}
                {!structureLocked && isLast && (
                    <button
                        type="button"
                        className="pill-icon-button pill-add-button"
                        onClick={() => apply(addCriterion(tree, levelId))}
                        disabled={!addCheck.allowed}
                        aria-label="Add a criterion"
                        title={addCheck.reason || "Add a criterion"}
                    >
                        +
                    </button>
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
            <li key={segment.id} className="pill-chip">
                <i style={{ backgroundColor: segment.color }} aria-hidden="true" />
                <span>{segment.name}</span>
                <button
                    type="button"
                    className="pill-icon-button"
                    onClick={() => setRenaming({ id: segment.id, value: segment.name })}
                    aria-label={`Rename ${segment.name}`}
                    title="Rename"
                >
                    ✎
                </button>
                {splitCheck.allowed && (
                    <button
                        type="button"
                        className="pill-text-button"
                        onClick={() => apply(splitCriterion(tree, segment.id))}
                        aria-label={`Split ${segment.name} into subcriteria`}
                        title="Split into subcriteria"
                    >
                        Split
                    </button>
                )}
                <button
                    type="button"
                    className="pill-icon-button"
                    onClick={() => handleDelete(segment)}
                    disabled={!deleteCheck.allowed}
                    aria-label={`Delete ${segment.name}`}
                    title={deleteCheck.reason || "Delete"}
                >
                    ×
                </button>
            </li>
        );
    }

    // Inside the bar: one dot per full 10% of this level (bar 2 of the
    // reference), or the view-only breakdown while previewing.
    function renderBarContent(segment) {
        if (previewId === segment.id) {
            return (
                <div className="pill-preview">
                    {getPreviewSegments(tree, segment.id).map((part) => (
                        <div
                            key={part.id}
                            className="pill-preview-part"
                            style={{
                                flexGrow: part.sectionRatio,
                                backgroundColor: part.color,
                                color: part.onColor,
                            }}
                            title={`${part.name}: ${formatPercent(part.effectiveShare)} of the grade`}
                        >
                            <span>{part.name}</span>
                            <strong>{formatPercent(part.effectiveShare)}</strong>
                        </div>
                    ))}
                </div>
            );
        }

        const dotCount = Math.floor(segment.share / 1000);
        return (
            <span className="pill-dots" aria-hidden="true">
                {Array.from({ length: dotCount }, (_, dot) => (
                    <i key={dot} />
                ))}
            </span>
        );
    }

    // The slider handle in the gap after a section (bar 4 of the reference).
    function renderHandle(segment, index) {
        const next = segments[index + 1];
        return (
            <span
                className="pill-handle"
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
            <label className="pill-percent">
                <input
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
                <span aria-hidden="true">%</span>
            </label>
        );
    }

    return (
        <section
            className={`pill-level ${isDragging ? "is-dragging" : ""}`}
            style={{ "--pill-depth": depth }}
            aria-label={`${level.name} breakdown`}
        >
            <div className="pill-row">
                <div className="pill-track">
                    {segments.map((segment, index) => (
                        <div
                            key={segment.id}
                            className="pill-criterion"
                            style={{ flexGrow: segment.share }}
                        >
                            <div className="pill-name-row">{renderName(segment, index)}</div>
                            <div
                                ref={(element) => {
                                    barRefs.current[segment.id] = element;
                                }}
                                className={`pill-bar ${previewId === segment.id ? "is-previewing" : ""}`}
                                style={{ "--pill-color": segment.color, "--pill-on": segment.onColor }}
                            >
                                {renderBarContent(segment)}
                                {index < segments.length - 1 && renderHandle(segment, index)}
                            </div>
                            {renderPercent(segment)}
                        </div>
                    ))}
                </div>
                <p className="pill-total">= {level.name}</p>
            </div>

            <p id={warningId} className="pill-warning" role="alert">
                {warning}
            </p>

            {!structureLocked && (
                <ul className="pill-manage" aria-label={`Criteria in ${level.name}`}>
                    {segments.map(renderManageChip)}
                </ul>
            )}
        </section>
    );
}
