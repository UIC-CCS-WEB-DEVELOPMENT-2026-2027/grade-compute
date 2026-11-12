// src/components/shared/RuleFormula.jsx
// Formula text for a rule (grade-rules-spec.txt, PART 7).
// Pass "tree" while editing (updates live) or "rule" for a saved rule.
// className: changes to the boxed look (a rule card shows it as plain text).
import { getFormulaText, getRuleFormulaText } from "@/lib/rules";
import { cn } from "@/lib/utils";

export function RuleFormula({ tree, rule, className }) {
    const text = tree ? getFormulaText(tree) : getRuleFormulaText(rule);

    return (
        <p
            className={cn(
                "m-0 border-0 border-l-4 border-solid border-primary bg-secondary px-4.5 py-3.5 type-body text-foreground tabular-nums",
                className,
            )}
        >
            {text}
        </p>
    );
}
