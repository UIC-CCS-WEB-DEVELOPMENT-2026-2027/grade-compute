// src/components/shared/DeleteRuleDialog.jsx
// Delete flow for a rule (grade-rules-spec.txt, PART 8): the last rule can't
// be deleted, and subjects that use the rule must move to another rule.
// Calls onDeleted(newDb) with the updated database; the page saves it.
import { useState } from "react";
import Dialog from "./Dialog";
import { deleteRule, getRuleSwitchImpact, getRuleUsage } from "../../utils/rules";

export default function DeleteRuleDialog({ db, rule, onClose, onDeleted }) {
    const otherRules = (db?.computationRules ?? []).filter((item) => item.id !== rule.id);
    const usage = getRuleUsage(db, rule.id);
    const [replacementId, setReplacementId] = useState(otherRules[0]?.id ?? "");
    const [error, setError] = useState("");

    if (otherRules.length === 0) {
        return (
            <Dialog
                title="This rule can't be deleted"
                onClose={onClose}
                actions={
                    <button type="button" className="btn-primary" onClick={onClose}>
                        Close
                    </button>
                }
            >
                <p>
                    At least one grade computation rule must exist. Create another
                    rule first, then delete this one.
                </p>
            </Dialog>
        );
    }

    const impact = usage.isUsed && replacementId
        ? getRuleSwitchImpact(db, rule.id, replacementId)
        : null;
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
        <Dialog
            title={`Delete ${rule.ruleName}?`}
            onClose={onClose}
            actions={
                <>
                    <button type="button" className="btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="button" className="btn-warning" onClick={confirmDelete}>
                        Delete rule
                    </button>
                </>
            }
        >
            {usage.isUsed ? (
                <>
                    {subjectCount > 0 && (
                        <>
                            <p>
                                {subjectCount === 1 ? "1 subject uses" : `${subjectCount} subjects use`} this rule:
                            </p>
                            <ul>
                                {usage.classes.map((item) => (
                                    <li key={item.classId}>
                                        {item.subjectCode} {item.subjectName}
                                        {item.programSection && ` (${item.programSection})`}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    <label>
                        Move {subjectCount > 0 ? "these subjects" : "everything that uses this rule"} to
                        <select
                            value={replacementId}
                            onChange={(event) => setReplacementId(event.target.value)}
                        >
                            {otherRules.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.ruleName}
                                </option>
                            ))}
                        </select>
                    </label>
                    {impact?.lostTaskCount > 0 && (
                        <p className="app-dialog-warning">
                            {impact.lostTaskCount} recorded task{impact.lostTaskCount === 1 ? "" : "s"} in{" "}
                            {impact.lostTasks.map((item) => item.name).join(", ")} won&apos;t count under the new
                            rule, because it has no matching criteria. The tasks stay saved.
                        </p>
                    )}
                </>
            ) : (
                <p>No subjects use this rule. Deleting it can&apos;t be undone.</p>
            )}
            {error && (
                <p className="app-dialog-warning" role="alert">
                    {error}
                </p>
            )}
        </Dialog>
    );
}
