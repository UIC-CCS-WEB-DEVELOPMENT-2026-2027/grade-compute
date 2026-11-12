// src/components/shared/DeleteRuleDialog.jsx
// Delete flow for a rule (grade-rules-spec.txt, PART 8): the last rule can't
// be deleted, and subjects that use the rule must move to another rule.
// Calls onDeleted(newDb) with the updated database; the page saves it.
// Render it only while it should be open.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { deleteRule, getRuleSwitchImpact, getRuleUsage } from "@/lib/rules";

const WARNING =
    "m-0 border-0 border-l-4 border-solid border-warning bg-warning-soft px-3 py-2.5 text-foreground";
const ACTION = "max-md:h-control-touch";

// The dialog frame both cases share: the eyebrow, the title, the content and
// the buttons. Like before, only Escape and the buttons close it, not a click
// outside.
function DeleteDialogFrame({ title, onClose, actions, children }) {
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            disablePointerDismissal
        >
            <DialogContent
                showCloseButton={false}
                className="gap-5 border-highlight-strong p-6 type-body max-sm:px-4 sm:max-w-2xl md:px-7.5"
            >
                <DialogHeader>
                    <DialogTitle className="m-0 flex flex-col gap-2 type-section-title text-foreground">
                        <span className="flex items-center gap-2 type-caption font-bold tracking-widest text-primary uppercase">
                            <span className="size-2 shrink-0 rounded-full bg-warning" />
                            Delete rule
                        </span>
                        {title}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3.5">{children}</div>
                <DialogFooter className="-mx-6 -mb-6 px-6 max-sm:-mx-4 max-sm:px-4 md:-mx-7.5 md:px-7.5">
                    {actions}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function DeleteRuleDialog({ db, rule, onClose, onDeleted }) {
    const otherRules = (db?.computationRules ?? []).filter((item) => item.id !== rule.id);
    const usage = getRuleUsage(db, rule.id);
    const [replacementId, setReplacementId] = useState(otherRules[0]?.id ?? "");
    const [error, setError] = useState("");

    const cancel = (label) => (
        <DialogClose
            render={
                <Button
                    variant="outline"
                    className={`${ACTION} text-muted-foreground hover:border-primary hover:bg-secondary hover:text-primary`}
                />
            }
        >
            {label}
        </DialogClose>
    );

    if (otherRules.length === 0) {
        return (
            <DeleteDialogFrame
                title={<>This rule can&apos;t be deleted</>}
                onClose={onClose}
                actions={cancel("Close")}
            >
                <p className="m-0">
                    At least one grade computation rule must exist. Create another rule first, then
                    delete this one.
                </p>
            </DeleteDialogFrame>
        );
    }

    const impact =
        usage.isUsed && replacementId ? getRuleSwitchImpact(db, rule.id, replacementId) : null;
    const subjectCount = usage.classes.length;

    function confirmDelete() {
        const result = deleteRule(db, rule.id, usage.isUsed ? replacementId : null);
        if (!result.ok) {
            setError(result.error);
            return;
        }
        onDeleted(result.db);
    }

    return (
        <DeleteDialogFrame
            title={<>Delete {rule.ruleName}?</>}
            onClose={onClose}
            actions={
                <>
                    {cancel("Cancel")}
                    {/* Dark text on the coral fill (WCAG AA). */}
                    <Button
                        className={`${ACTION} bg-warning text-warning-foreground hover:bg-destructive hover:text-primary-foreground hover:shadow-card`}
                        onClick={confirmDelete}
                    >
                        Delete rule
                    </Button>
                </>
            }
        >
            {usage.isUsed ? (
                <>
                    {subjectCount > 0 && (
                        <>
                            <p className="m-0">
                                {subjectCount === 1
                                    ? "1 subject uses"
                                    : `${subjectCount} subjects use`}{" "}
                                this rule:
                            </p>
                            <ul className="m-0 grid max-h-delete-list list-none gap-2.5 overflow-y-auto p-0">
                                {usage.classes.map((item) => (
                                    <li
                                        key={item.classId}
                                        className="flex min-h-18 flex-col justify-center gap-0.5 rounded-xl border border-solid border-highlight-strong bg-highlight-soft px-4 py-3"
                                    >
                                        <span className="type-caption tracking-wide text-muted-foreground">
                                            {item.subjectCode}
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {item.subjectName}
                                            {item.programSection && ` (${item.programSection})`}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    {/* The label wraps the select, so its name stays as before. */}
                    <label className="flex flex-col gap-1.5 type-small text-muted-foreground">
                        Move{" "}
                        {subjectCount > 0 ? "these subjects" : "everything that uses this rule"} to
                        <NativeSelect
                            className="w-full bg-card text-foreground max-md:h-control-touch"
                            value={replacementId}
                            onChange={(event) => setReplacementId(event.target.value)}
                        >
                            {otherRules.map((item) => (
                                <NativeSelectOption key={item.id} value={item.id}>
                                    {item.ruleName}
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                    </label>
                    {impact?.lostTaskCount > 0 && (
                        <p className={WARNING}>
                            {impact.lostTaskCount} recorded task
                            {impact.lostTaskCount === 1 ? "" : "s"} in{" "}
                            {impact.lostTasks.map((item) => item.name).join(", ")} won&apos;t count
                            under the new rule, because it has no matching criteria. The tasks stay
                            saved.
                        </p>
                    )}
                </>
            ) : (
                <p className="m-0">No subjects use this rule. Deleting it can&apos;t be undone.</p>
            )}
            {error && (
                <p className={WARNING} role="alert">
                    {error}
                </p>
            )}
        </DeleteDialogFrame>
    );
}
