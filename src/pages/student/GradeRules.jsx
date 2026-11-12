// src/pages/student/GradeRules.jsx
// Grade computation rules collection (grade-rules-spec.txt, PART 3).
// Cards open the view/edit page (RuleDetail.jsx).
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { buttonVariants } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RuleCard } from "@/features/grade-rules/components/RuleCard";
import { DeleteRuleDialog } from "@/features/grade-rules/components/DeleteRuleDialog";
import { saveDbSafely } from "@/services/db";
import { duplicateRule, getRuleUsage, searchRules } from "@/lib/rules";
import { useDb } from "@/hooks/useDb";
import { cn } from "@/lib/utils";

const THUMBNAIL_KEY = "compugrade_rule_thumbnail";
const THUMBNAILS = [
    { id: "bar", label: "Bar" },
    { id: "pie", label: "Pie" },
    { id: "table", label: "Table" },
];

// The thumbnail choice is a per-browser convenience, so it lives in its own
// localStorage key, not in the shared database.
function readThumbnail() {
    try {
        const saved = localStorage.getItem(THUMBNAIL_KEY);
        return THUMBNAILS.some((option) => option.id === saved) ? saved : "bar";
    } catch {
        return "bar";
    }
}

function writeThumbnail(value) {
    try {
        localStorage.setItem(THUMBNAIL_KEY, value);
    } catch {
        // Storage unavailable: the choice just won't be remembered.
    }
}

export function GradeRules() {
    const navigate = useNavigate();
    const [dbData, setDbData] = useDb({ live: false });
    const [query, setQuery] = useState("");
    const [thumbnail, setThumbnail] = useState(readThumbnail);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [message, setMessage] = useState("");

    const rules = dbData?.computationRules ?? [];
    const visibleRules = searchRules(rules, query);

    function commit(updatedDb) {
        const saved = saveDbSafely(updatedDb);
        if (!saved.ok) {
            setMessage(`Your changes could not be saved: ${saved.error.message}`);
            return false;
        }
        setDbData(updatedDb);
        return true;
    }

    function chooseThumbnail(value) {
        setThumbnail(value);
        writeThumbnail(value);
    }

    function handleDuplicate(ruleId) {
        const result = duplicateRule(dbData, ruleId);
        if (!result.ok) {
            setMessage(result.error);
            return;
        }
        if (commit(result.db)) navigate(`/student/rules/${result.rule.id}`);
    }

    function handleDeleted(updatedDb) {
        const name = deleteTarget?.ruleName;
        setDeleteTarget(null);
        if (commit(updatedDb)) setMessage(`Deleted ${name}.`);
    }

    return (
        // The Grade Rules pages have no footer.
        <PageShell showFooter={false}>
            <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="m-0 type-page-title text-foreground">Grade computation rules</h1>
                    <p className="m-0 mt-1 type-body text-muted-foreground">
                        How each part of your work adds up to your grade.
                    </p>
                </div>
                <Link className={cn(buttonVariants(), "no-underline")} to="/student/rules/new">
                    + New rule
                </Link>
            </header>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <Input
                    className="max-w-105 min-w-0 flex-1 basis-65 bg-card"
                    type="search"
                    placeholder="Search by name, tag, or school"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    aria-label="Search grade computation rules"
                />
                <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5">
                    <span
                        className="pr-2 pl-1.5 type-small text-muted-foreground"
                        aria-hidden="true"
                    >
                        Preview
                    </span>
                    <ToggleGroup
                        aria-label="Card preview"
                        value={[thumbnail]}
                        // Pressing the selected view again keeps it selected.
                        onValueChange={(value) => {
                            if (value[0]) chooseThumbnail(value[0]);
                        }}
                        spacing={0.5}
                    >
                        {THUMBNAILS.map((option) => (
                            <ToggleGroupItem
                                key={option.id}
                                value={option.id}
                                size="sm"
                                className="px-3 font-normal text-foreground hover:bg-secondary hover:text-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground max-lg:min-w-11"
                            >
                                {option.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>
            </div>

            <p className="m-0 my-3 min-h-5 type-small text-muted-foreground" role="status">
                {message}
            </p>

            <aside className="mt-3.5 mb-5 rounded-r-md border-0 border-l-3 border-solid border-primary bg-secondary px-3.5 py-2.5 type-small text-muted-foreground">
                <strong className="text-foreground">Before deleting a rule:</strong> At least one
                rule must remain. If subjects use the rule, choose a replacement rule for them.
            </aside>

            {visibleRules.length > 0 ? (
                // Columns follow the space next to the sidebar.
                <div className="@container">
                    <div className="grid gap-5 @xl:grid-cols-2 @4xl:grid-cols-3">
                        {visibleRules.map((rule) => (
                            <RuleCard
                                key={rule.id}
                                rule={rule}
                                thumbnail={thumbnail}
                                subjectCount={getRuleUsage(dbData, rule.id).classes.length}
                                onDuplicate={() => handleDuplicate(rule.id)}
                                onDelete={() => {
                                    setMessage("");
                                    setDeleteTarget(rule);
                                }}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <Empty className="rounded-xl border border-dashed border-border bg-card type-body text-muted-foreground">
                    {rules.length === 0
                        ? "No rules yet. Create one to start tracking how your grades add up."
                        : `No rules match "${query.trim()}". Try a rule name, a tag like Undergraduate, or a school.`}
                </Empty>
            )}

            {deleteTarget && (
                <DeleteRuleDialog
                    db={dbData}
                    rule={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onDeleted={handleDeleted}
                />
            )}
        </PageShell>
    );
}
