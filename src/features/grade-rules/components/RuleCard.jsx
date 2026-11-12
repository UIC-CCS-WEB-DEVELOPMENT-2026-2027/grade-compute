// src/components/shared/RuleCard.jsx
// One rule in the rules collection. The whole card opens the rule; the
// thumbnail shows the rule as a bar, pie chart, or table.
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RuleBar } from "./RuleBar";
import { RuleFormula } from "./RuleFormula";
import { RuleHierarchyTable } from "./RuleHierarchyTable";
import { RulePieChart } from "./RulePieChart";
import { ruleToTree } from "@/lib/rules";
import { cn } from "@/lib/utils";

const ACTION = "bg-card";

export function RuleCard({ rule, subjectCount, thumbnail, onDuplicate, onDelete }) {
    const tree = ruleToTree(rule);
    const tags = rule.tags ?? [];
    const schools = rule.schools ?? [];

    return (
        <article className="flex min-w-0">
            <Card className="group/rule relative flex-1 gap-0 py-0 shadow-xs transition duration-200 hover:-translate-y-0.75 hover:border-primary hover:shadow-hover focus-within:-translate-y-0.75 focus-within:border-primary focus-within:shadow-hover has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0">
                <div
                    className={cn(
                        "flex h-41 items-center justify-center overflow-hidden border-0 border-b border-solid border-border bg-background px-5 py-4.5 transition-colors group-hover/rule:bg-secondary motion-reduce:transition-none",
                        thumbnail === "table" && "items-start bg-muted",
                    )}
                >
                    {thumbnail === "pie" && <RulePieChart tree={tree} size={132} />}
                    {thumbnail === "table" && <RuleHierarchyTable tree={tree} compact />}
                    {thumbnail === "bar" && <RuleBar tree={tree} />}
                </div>

                <div className="flex flex-1 flex-col gap-2 px-4.5 pt-4 pb-3">
                    <h2 className="m-0 type-card-title">
                        {/* The link covers the whole card, so clicking anywhere opens the rule. */}
                        <Link
                            className="text-foreground no-underline transition-colors group-hover/rule:text-primary after:absolute after:inset-0 focus-visible:outline-none motion-reduce:transition-none"
                            to={`/student/rules/${rule.id}`}
                        >
                            {rule.ruleName}
                        </Link>
                    </h2>
                    {tags.length > 0 && (
                        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Tags">
                            {tags.map((tag) => (
                                <li key={tag}>
                                    <Badge
                                        variant="outline"
                                        className="font-normal text-muted-foreground"
                                    >
                                        <span
                                            className="size-1.5 rounded-full bg-primary"
                                            aria-hidden="true"
                                        />
                                        {tag}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                    {schools.length > 0 && (
                        <p className="m-0 type-small text-muted-foreground">
                            Used at {schools.join(", ")}
                        </p>
                    )}
                    <RuleFormula
                        rule={rule}
                        className="mt-auto border-l-0 bg-transparent p-0 type-small"
                    />
                </div>

                <footer className="flex items-center justify-between gap-2 border-0 border-t border-solid border-border px-4.5 py-2.5">
                    <Badge variant="secondary" className="h-auto min-h-7 border-border px-2.5 py-1">
                        {subjectCount === 0
                            ? "Not used by any subject"
                            : `Used by ${subjectCount} subject${subjectCount === 1 ? "" : "s"}`}
                    </Badge>
                    {/* Above the card link, so they get the click. */}
                    <span className="relative z-(--z-raised) inline-flex gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                ACTION,
                                "hover:border-primary hover:bg-secondary hover:text-primary",
                            )}
                            onClick={onDuplicate}
                        >
                            Duplicate
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                ACTION,
                                "text-destructive hover:border-destructive hover:bg-warning-soft hover:text-destructive",
                            )}
                            onClick={onDelete}
                        >
                            Delete
                        </Button>
                    </span>
                </footer>
            </Card>
        </article>
    );
}
