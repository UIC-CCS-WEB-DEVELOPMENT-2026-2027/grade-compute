// The rule editor's state and actions (/student/rules/new and
// /student/rules/:ruleId): the details and criteria being edited, the
// saved copy to compare with, validation, saving (with the impact dialog
// for rules that subjects use, or for copies), save as new, duplicate,
// discard, and the tag and school edits. found is false when the rule
// doesn't exist; then nothing else is used.
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDb } from "@/hooks/useDb";
import { saveDbSafely } from "@/services/db";
import {
    buildRuleMath,
    createDefaultTree,
    createRule,
    duplicateRule,
    getCopyName,
    getRuleChangeImpact,
    getRuleUsage,
    isCopiedRule,
    ruleToTree,
    updateRule,
    validateRuleDetails,
} from "@/lib/rules";

function detailsOf(rule) {
    return {
        ruleName: rule?.ruleName ?? "",
        tags: rule?.tags ?? [],
        schools: rule?.schools ?? [],
    };
}

// ruleId: the rule to edit, or null for a new rule.
export function useRuleEditor(ruleId) {
    const navigate = useNavigate();
    const location = useLocation();
    const isNew = ruleId === null;
    const [dbData, setDbData] = useDb({ live: false });
    const rule = isNew ? null : dbData?.computationRules?.find((item) => item.id === ruleId);

    const [details, setDetails] = useState(() => detailsOf(rule));
    const [tree, setTree] = useState(() => (rule ? ruleToTree(rule) : createDefaultTree()));
    const [saved, setSaved] = useState(() => JSON.stringify({ details: detailsOf(rule), tree }));
    const [schoolInput, setSchoolInput] = useState("");
    const [view, setView] = useState("pie");
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState(() => location.state?.notice ?? "");
    const [isEditing, setIsEditing] = useState(isNew);
    const [pendingImpact, setPendingImpact] = useState(null);
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        if (location.state?.notice) {
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.pathname, location.state, navigate]);

    const found = isNew || Boolean(rule);
    const hasEdits = JSON.stringify({ details, tree }) !== saved;
    const isDirty = isNew || hasEdits;
    const usage = isNew || !rule ? null : getRuleUsage(dbData, rule.id);

    function commit(updatedDb) {
        const saved = saveDbSafely(updatedDb);
        if (!saved.ok) {
            setStatus(`Your changes could not be saved: ${saved.error.message}`);
            return false;
        }
        setDbData(updatedDb);
        return true;
    }

    // Checks name, tags, schools, and criteria before any save.
    function validate() {
        const detailCheck = validateRuleDetails(dbData, details, rule?.id ?? null);
        const math = buildRuleMath(tree);
        const nextErrors = { ...detailCheck.errors, ...(math.ok ? {} : { tree: math.error }) };
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            setStatus("Fix the highlighted fields, then save again.");
            return false;
        }
        return true;
    }

    function saveNewRule(ruleName, successNotice = "") {
        const result = createRule(dbData, { ...details, ruleName, tree });
        if (!result.ok) {
            setErrors(result.errors);
            setStatus(result.error);
            return;
        }
        if (commit(result.db)) {
            navigate(`/student/rules/${result.rule.id}`, {
                replace: isNew,
                state: successNotice ? { notice: successNotice } : null,
            });
        }
    }

    function applyUpdate() {
        setPendingImpact(null);
        const result = updateRule(dbData, rule.id, { ...details, tree });
        if (!result.ok) {
            setErrors(result.errors);
            setStatus(result.error);
            return;
        }
        if (commit(result.db)) {
            const savedDetails = detailsOf(result.rule);
            setDetails(savedDetails);
            setSaved(JSON.stringify({ details: savedDetails, tree }));
            setStatus("Changes saved.");
            setIsEditing(false);
        }
    }

    function handleSave() {
        setStatus("");
        if (!validate()) return;
        if (isNew) {
            saveNewRule(details.ruleName);
            return;
        }
        const impact = getRuleChangeImpact(dbData, rule.id, tree);
        if (impact.classes.length > 0 || isCopy) {
            setPendingImpact({ ...impact, isCopy });
            return;
        }
        applyUpdate();
    }

    function handleSaveAsNew() {
        setPendingImpact(null);
        setStatus("");
        const sameName = details.ruleName.trim().toLowerCase() === rule.ruleName.toLowerCase();
        saveNewRule(
            sameName ? getCopyName(dbData, rule.ruleName) : details.ruleName,
            "Your changes were successfully saved as a new rule.",
        );
    }

    function handleDuplicate() {
        const result = duplicateRule(dbData, rule.id);
        if (result.ok && commit(result.db)) navigate(`/student/rules/${result.rule.id}`);
    }

    function handleDiscard() {
        const original = JSON.parse(saved);
        setDetails(original.details);
        setTree(original.tree);
        setErrors({});
        setStatus("Changes discarded.");
        setIsEditing(false);
    }

    function cancelEditing() {
        if (hasEdits) {
            handleDiscard();
            return;
        }
        setStatus("");
        setIsEditing(false);
    }

    function toggleTag(tag) {
        setDetails((current) => ({
            ...current,
            tags: current.tags.includes(tag)
                ? current.tags.filter((item) => item !== tag)
                : [...current.tags, tag],
        }));
    }

    function addSchool() {
        const school = schoolInput.trim();
        if (!school) return;
        setDetails((current) =>
            current.schools.some((item) => item.toLowerCase() === school.toLowerCase())
                ? current
                : { ...current, schools: [...current.schools, school] },
        );
        setSchoolInput("");
    }

    function removeSchool(school) {
        setDetails((current) => ({
            ...current,
            schools: current.schools.filter((item) => item !== school),
        }));
    }

    function handleTreeChange(nextTree) {
        setTree(nextTree);
        setErrors((current) => ({ ...current, tree: undefined }));
    }

    const subjectCount = usage?.classes.length ?? 0;
    const isCopy = !isNew && Boolean(rule) && isCopiedRule(rule);

    return {
        navigate,
        isNew,
        dbData,
        rule,
        details,
        setDetails,
        tree,
        schoolInput,
        setSchoolInput,
        view,
        setView,
        errors,
        status,
        setStatus,
        isEditing,
        setIsEditing,
        pendingImpact,
        setPendingImpact,
        showDelete,
        setShowDelete,
        found,
        hasEdits,
        isDirty,
        usage,
        commit,
        validate,
        applyUpdate,
        handleSave,
        handleSaveAsNew,
        handleDuplicate,
        handleDiscard,
        cancelEditing,
        toggleTag,
        addSchool,
        removeSchool,
        handleTreeChange,
        subjectCount,
    };
}
