// src/components/shared/DeleteRuleDialog.jsx
// Delete flow for a rule (grade-rules-spec.txt, PART 8): the last rule can't
// be deleted, and subjects that use the rule must move to another rule.
// Calls onDeleted(newDb) with the updated database; the page saves it.
// Render it only while it should be open.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { deleteRule, getRuleSwitchImpact, getRuleUsage } from "@/lib/rules";
import { RuleDialog } from "./RuleDialog";
import { RuleSubjectList } from "./RuleSubjectList";

const WARNING =
    "m-0 border-0 border-l-4 border-solid border-warning bg-warning-soft px-3 py-2.5 text-foreground";

export function DeleteRuleDialog({ db, rule, onClose, onDeleted }) {
    const otherRules = (db?.computationRules ?? []).filter((item) => item.id !== rule.id);
    const usage = getRuleUsage(db, rule.id);
    const [replacementId, setReplacementId] = useState(otherRules[0]?.id ?? "");
    const [error, setError] = useState("");

    if (otherRules.length === 0) {
        return (
            <RuleDialog
                eyebrow="Delete rule"
                dot="warning"
                title={<>This rule can&apos;t be deleted</>}
                cancelLabel="Close"
                onClose={onClose}
            >
                <p className="m-0">
                    At least one grade computation rule must exist. Create another rule first, then
                    delete this one.
                </p>
            </RuleDialog>
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
        <RuleDialog
            eyebrow="Delete rule"
            dot="warning"
            title={<>Delete {rule.ruleName}?</>}
            onClose={onClose}
            actions={
                // Dark text on the coral fill (WCAG AA).
                <Button
                    className="bg-warning text-warning-foreground hover:bg-destructive hover:text-primary-foreground hover:shadow-card"
                    onClick={confirmDelete}
                >
                    Delete rule
                </Button>
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
                            <RuleSubjectList classes={usage.classes} />
                        </>
                    )}
                    {/* The label wraps the select, so its name stays as before. */}
                    <label className="flex flex-col gap-1.5 type-small text-muted-foreground">
                        Move{" "}
                        {subjectCount > 0 ? "these subjects" : "everything that uses this rule"} to
                        <NativeSelect
                            className="w-full bg-card text-foreground"
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
        </RuleDialog>
    );
}
