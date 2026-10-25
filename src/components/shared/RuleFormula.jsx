// src/components/shared/RuleFormula.jsx
// Formula text for a rule (grade-rules-spec.txt, PART 7).
// Pass "tree" while editing (updates live) or "rule" for a saved rule.
import { getFormulaText, getRuleFormulaText } from "../../utils/rules";

export default function RuleFormula({ tree, rule }) {
    const text = tree ? getFormulaText(tree) : getRuleFormulaText(rule);

    return <p className="rule-formula">{text}</p>;
}
