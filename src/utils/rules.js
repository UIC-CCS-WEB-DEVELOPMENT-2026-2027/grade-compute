// src/utils/rules.js
// CompUGrade grade computation rule logic (see grade-rules-spec.txt).
//
// Pure functions only: no React, no localStorage. Every function returns new
// objects and never changes its inputs. Pages save results themselves with
// saveDb() + setDbData(), following database-guide.txt.
//
// UNITS: every percentage is a whole number of hundredths of a percent
// ("share units"), so the math never hits floating-point errors:
//   100.00% = 10000, 70% = 7000, 33.33% = 3333, 1% = 100.
//
// TREE: the pill editor works on a criteria tree. Each node is:
//   { id, name, share, children: [] }
// "share" is the node's part of its PARENT (siblings always total 10000).
// The root node is the total grade. The tree is editor state only.
//
// SAVED RULE: db.json stores the same tree as "criteria", with weights as
// fractions of the parent, plus flat "effectiveMultipliers" keyed by the id
// of each deepest criterion (what grades.js uses):
//   criteria: [{ id, name, weight: 0.7, children: [...] }, ...]
//   effectiveMultipliers: { AT: 0.49, TLA: 0.21, Exam: 0.3 }
// Student tasks are stored per term under the same deepest-criterion ids.

import { toTaskList } from "./grades.js";

export const TOTAL_SHARE = 10000;
export const MIN_SHARE = 100;
export const MAX_CRITERIA_PER_LEVEL = 8;
export const MAX_DEPTH = 3;
export const MAX_NAME_LENGTH = 30;
export const CRITERIA_COLOR_COUNT = 8;
export const DEFAULT_TAGS = ["Graduate", "Undergraduate"];
export const TERM_KEYS = ["prelim", "midterm", "finals"];

const ROOT_ID = "grade";

// ---------------------------------------------------------------------------
// Percentage conversion and formatting
// ---------------------------------------------------------------------------

// Converts typed input ("70", "33.33", "33.333", "45%") to share units,
// rounded to two decimals. Returns null when the input is not a number.
export function percentToShare(value) {
    if (value === null || value === undefined) return null;
    const text = String(value).trim().replace(/%$/, "").trim();
    if (!/^-?(\d+\.?\d*|\.\d+)$/.test(text)) return null;
    return Math.round(Number(text) * 100);
}

export function shareToPercent(share) {
    return share / 100;
}

// "70%" or "33.33%". Pass { fixed: true } for "70.00%".
export function formatPercent(share, { fixed = false } = {}) {
    const percent = share / 100;
    const text = fixed || !Number.isInteger(percent) ? percent.toFixed(2) : String(percent);
    return `${text}%`;
}

// Multiplier text for formulas: 4900 -> "0.49", 1667 -> "0.1667", 3000 -> "0.30".
function formatMultiplier(effectiveShare) {
    return (effectiveShare / TOTAL_SHARE).toFixed(4).replace(/0{1,2}$/, "");
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

// ---------------------------------------------------------------------------
// Tree lookups
// ---------------------------------------------------------------------------

function findPath(node, id, path = []) {
    const current = [...path, node];
    if (node.id === id) return current;
    for (const child of node.children ?? []) {
        const found = findPath(child, id, current);
        if (found) return found;
    }
    return null;
}

export function findCriterion(tree, id) {
    const path = tree ? findPath(tree, id) : null;
    return path ? path[path.length - 1] : null;
}

export function findParent(tree, id) {
    const path = tree ? findPath(tree, id) : null;
    return path && path.length > 1 ? path[path.length - 2] : null;
}

// Root ("Grade") is depth 0, top-level criteria are depth 1.
export function getDepth(tree, id) {
    const path = tree ? findPath(tree, id) : null;
    return path ? path.length - 1 : -1;
}

// Deepest criteria under a node, in left-to-right order.
export function getLeaves(node) {
    if (!node) return [];
    if (!node.children?.length) return [node];
    return node.children.flatMap(getLeaves);
}

function updateNode(node, id, update) {
    if (node.id === id) return update(node);
    if (!node.children?.length) return node;

    let changed = false;
    const children = node.children.map((child) => {
        const next = updateNode(child, id, update);
        if (next !== child) changed = true;
        return next;
    });
    return changed ? { ...node, children } : node;
}

function replaceChildren(tree, parentId, children) {
    return updateNode(tree, parentId, (node) => ({ ...node, children }));
}

// Result helpers. On failure the ORIGINAL tree is returned, so the UI can
// always call setTree(result.tree) and the value snaps back.
function success(tree) {
    return { ok: true, tree, error: "" };
}

function failure(tree, error) {
    return { ok: false, tree, error };
}

// The neighbor a criterion trades percentage with: right, or left if it is last.
function neighborIndex(siblings, index) {
    if (index + 1 < siblings.length) return index + 1;
    if (index - 1 >= 0) return index - 1;
    return -1;
}

function siblingContext(tree, id) {
    const parent = findParent(tree, id);
    if (!parent) return null;
    const siblings = parent.children;
    const index = siblings.findIndex((child) => child.id === id);
    return { parent, siblings, index, node: siblings[index] };
}

// ---------------------------------------------------------------------------
// Changing percentages (spec PART 4)
// ---------------------------------------------------------------------------

// Min and max share a criterion can be set to, and the neighbor it trades with.
export function getShareLimits(tree, id) {
    const context = siblingContext(tree, id);
    if (!context) return null;

    const { siblings, index, node } = context;
    const neighbor = siblings[neighborIndex(siblings, index)] ?? null;
    if (!neighbor) return { min: node.share, max: node.share, neighbor: null };

    return {
        min: MIN_SHARE,
        max: node.share + neighbor.share - MIN_SHARE,
        neighbor,
    };
}

// Sets a criterion to an exact share. The difference is taken from (or given
// to) its right neighbor, or its left neighbor if it is last. Values outside
// the limits are rejected with a warning, not clamped.
export function setCriterionShare(tree, id, newShare) {
    const context = siblingContext(tree, id);
    if (!context) return failure(tree, "This criterion cannot be changed.");
    if (!Number.isInteger(newShare)) {
        return failure(tree, "Enter a percentage, e.g. 70 or 33.33.");
    }

    const { parent, siblings, index, node } = context;
    const otherIndex = neighborIndex(siblings, index);

    if (otherIndex === -1) {
        return newShare === node.share
            ? success(tree)
            : failure(tree, `${node.name} is the only criterion in this level, so it must stay at 100%.`);
    }

    const neighbor = siblings[otherIndex];
    const max = node.share + neighbor.share - MIN_SHARE;

    if (newShare < MIN_SHARE) {
        return failure(tree, `${node.name} must be at least 1%.`);
    }
    if (newShare > max) {
        return failure(
            tree,
            `${node.name} can be at most ${formatPercent(max, { fixed: true })}. ${neighbor.name} must keep at least 1%.`
        );
    }
    if (newShare === node.share) return success(tree);

    const difference = newShare - node.share;
    const children = siblings.map((child, childIndex) => {
        if (childIndex === index) return { ...child, share: newShare };
        if (childIndex === otherIndex) return { ...child, share: child.share - difference };
        return child;
    });
    return success(replaceChildren(tree, parent.id, children));
}

// For the percentage box: accepts the raw typed text.
export function setCriterionPercent(tree, id, typedValue) {
    const share = percentToShare(typedValue);
    if (share === null) return failure(tree, "Enter a percentage, e.g. 70 or 33.33.");
    return setCriterionShare(tree, id, share);
}

// For the drag handle between children[handleIndex] and children[handleIndex + 1].
// positionRatio: pointer position along the whole pill, 0 (left edge) to 1 (right edge).
// step: snapping in share units (100 = whole percent, 1 = no snapping).
// Dragging never warns; it stops at the limits instead.
export function dragHandle(tree, parentId, handleIndex, positionRatio, step = 100) {
    const parent = findCriterion(tree, parentId);
    const children = parent?.children ?? [];
    if (handleIndex < 0 || handleIndex >= children.length - 1) {
        return failure(tree, "This handle does not exist.");
    }
    if (!Number.isFinite(positionRatio)) return failure(tree, "Invalid handle position.");

    const left = children[handleIndex];
    const right = children[handleIndex + 1];
    const pairTotal = left.share + right.share;
    if (pairTotal < MIN_SHARE * 2) return success(tree);

    const before = children
        .slice(0, handleIndex)
        .reduce((total, child) => total + child.share, 0);
    let leftShare = Math.round(clamp(positionRatio, 0, 1) * TOTAL_SHARE) - before;
    if (step > 1) leftShare = Math.round(leftShare / step) * step;
    leftShare = clamp(leftShare, MIN_SHARE, pairTotal - MIN_SHARE);

    if (leftShare === left.share) return success(tree);

    const updated = children.map((child, index) => {
        if (index === handleIndex) return { ...child, share: leftShare };
        if (index === handleIndex + 1) return { ...child, share: pairTotal - leftShare };
        return child;
    });
    return success(replaceChildren(tree, parentId, updated));
}

// ---------------------------------------------------------------------------
// Structure editing (spec PART 5).
// ---------------------------------------------------------------------------

function collectIds(node, ids = new Set()) {
    if (!node) return ids;
    ids.add(node.id);
    (node.children ?? []).forEach((child) => collectIds(child, ids));
    return ids;
}

// Random ids, so a deleted criterion's id is never reused by a new one.
// (Student tasks are stored under criterion ids; reusing an id would attach
// old tasks to an unrelated new criterion.)
function nextCriterionId(tree) {
    const taken = collectIds(tree);
    let id;
    do {
        id = `crit-${Math.random().toString(36).slice(2, 8)}`;
    } while (taken.has(id));
    return id;
}

function uniqueDefaultName(siblings, prefix) {
    const taken = new Set(siblings.map((child) => child.name.toLowerCase()));
    let number = siblings.length + 1;
    while (taken.has(`${prefix} ${number}`.toLowerCase())) number += 1;
    return `${prefix} ${number}`;
}

// Returns an error message, or "" when the name is valid.
// Pass excludeId when renaming so the criterion does not clash with itself.
function checkName(siblings, name, excludeId = null) {
    const trimmed = String(name ?? "").trim();
    if (!trimmed) return "Enter a name.";
    if (trimmed.length > MAX_NAME_LENGTH) {
        return `Names can be at most ${MAX_NAME_LENGTH} characters.`;
    }
    const duplicate = siblings.some(
        (child) => child.id !== excludeId && child.name.toLowerCase() === trimmed.toLowerCase()
    );
    return duplicate ? `"${trimmed}" is already used in this level.` : "";
}

export function canAddCriterion(tree, parentId) {
    const parent = findCriterion(tree, parentId);
    const children = parent?.children ?? [];
    if (!parent) return { allowed: false, reason: "This level does not exist." };
    if (children.length === 0) {
        return { allowed: false, reason: "Split this criterion first." };
    }
    if (children.length >= MAX_CRITERIA_PER_LEVEL) {
        return { allowed: false, reason: `A level can have at most ${MAX_CRITERIA_PER_LEVEL} criteria.` };
    }
    const last = children[children.length - 1];
    if (last.share < MIN_SHARE * 2) {
        return { allowed: false, reason: `${last.name} is too small to split in half. Each criterion needs at least 1%.` };
    }
    return { allowed: true, reason: "" };
}

// Adds a criterion at the end of a level. It takes half of the last
// criterion's share (rounded down to 0.01%); the last criterion keeps the rest.
export function addCriterion(tree, parentId, name) {
    const check = canAddCriterion(tree, parentId);
    if (!check.allowed) return failure(tree, check.reason);

    const parent = findCriterion(tree, parentId);
    const children = parent.children;
    const prefix = parentId === tree.id ? "Criteria" : "SubCriteria";
    const newName = name === undefined ? uniqueDefaultName(children, prefix) : String(name).trim();
    const nameError = checkName(children, newName);
    if (nameError) return failure(tree, nameError);

    const last = children[children.length - 1];
    const newShare = Math.floor(last.share / 2);
    const updated = [
        ...children.slice(0, -1),
        { ...last, share: last.share - newShare },
        { id: nextCriterionId(tree), name: newName, share: newShare, children: [] },
    ];
    return success(replaceChildren(tree, parentId, updated));
}

export function canDeleteCriterion(tree, id) {
    const context = siblingContext(tree, id);
    if (!context) return { allowed: false, reason: "The total grade cannot be deleted.", hasSubcriteria: false };

    const hasSubcriteria = (context.node.children ?? []).length > 0;
    if (context.siblings.length === 1 && context.parent.id === tree.id) {
        return { allowed: false, reason: "At least one criterion is required.", hasSubcriteria };
    }
    return { allowed: true, reason: "", hasSubcriteria };
}

// Deletes a criterion and all of its subcriteria. Its share goes to its left
// neighbor, or its right neighbor if it is first. Deleting the only
// subcriterion of a parent removes the split instead.
// Ask the user to confirm first when canDeleteCriterion().hasSubcriteria is true.
export function deleteCriterion(tree, id) {
    const check = canDeleteCriterion(tree, id);
    if (!check.allowed) return failure(tree, check.reason);

    const { parent, siblings, index, node } = siblingContext(tree, id);
    if (siblings.length === 1) return success(replaceChildren(tree, parent.id, []));

    const receiver = index > 0 ? index - 1 : index + 1;
    const updated = siblings
        .map((child, childIndex) =>
            childIndex === receiver ? { ...child, share: child.share + node.share } : child
        )
        .filter((child) => child.id !== id);
    return success(replaceChildren(tree, parent.id, updated));
}

export function renameCriterion(tree, id, name) {
    const context = siblingContext(tree, id);
    if (!context) return failure(tree, "The total grade cannot be renamed.");

    const error = checkName(context.siblings, name, id);
    if (error) return failure(tree, error);

    const trimmed = String(name).trim();
    return success(updateNode(tree, id, (node) => ({ ...node, name: trimmed })));
}

export function canSplitCriterion(tree, id) {
    const node = findCriterion(tree, id);
    if (!node || id === tree.id) return { allowed: false, reason: "This criterion cannot be split." };
    if ((node.children ?? []).length > 0) {
        return { allowed: false, reason: `${node.name} already has subcriteria.` };
    }
    if (getDepth(tree, id) >= MAX_DEPTH) {
        return { allowed: false, reason: `Criteria can only be nested ${MAX_DEPTH} levels deep.` };
    }
    return { allowed: true, reason: "" };
}

// Gives a criterion its first subcriterion at 100%.
// The new subcriterion takes over the criterion's id (and the criterion gets
// a new one), so tasks already recorded under it move into the subcriterion.
export function splitCriterion(tree, id, name = "SubCriteria 1") {
    const check = canSplitCriterion(tree, id);
    if (!check.allowed) return failure(tree, check.reason);

    const nameError = checkName([], name);
    if (nameError) return failure(tree, nameError);

    const child = { id, name: String(name).trim(), share: TOTAL_SHARE, children: [] };
    const newParentId = nextCriterionId(tree);
    return success(
        updateNode(tree, id, (node) => ({ ...node, id: newParentId, children: [child] }))
    );
}

// ---------------------------------------------------------------------------
// Effective shares (spec PART 9)
// ---------------------------------------------------------------------------

// Every node's share of the TOTAL grade, in share units, keyed by node id.
// Children of each node always add up exactly to the node's effective share:
// each child gets its rounded-down share, and the leftover units go to the
// children with the largest remainders (ties go to the leftmost).
export function getEffectiveShares(tree) {
    const effective = {};

    const visit = (node, nodeShare) => {
        effective[node.id] = nodeShare;
        const children = node.children ?? [];
        if (children.length === 0) return;

        const parts = children.map((child, index) => {
            const exact = nodeShare * child.share;
            return {
                child,
                index,
                units: Math.floor(exact / TOTAL_SHARE),
                remainder: exact % TOTAL_SHARE,
            };
        });
        let leftover = nodeShare - parts.reduce((total, part) => total + part.units, 0);
        [...parts]
            .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
            .forEach((part) => {
                if (leftover > 0) {
                    part.units += 1;
                    leftover -= 1;
                }
            });
        parts.forEach((part) => visit(part.child, part.units));
    };

    if (tree) visit(tree, TOTAL_SHARE);
    return effective;
}

// ---------------------------------------------------------------------------
// Converting between saved rules and the editor tree
// ---------------------------------------------------------------------------

function fractionToShare(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number * TOTAL_SHARE) : null;
}

// The old two-tier format (Classwork [AT, TLA] + Exam). Only used to read
// rules saved before flexible criteria; ids match the old task keys.
function buildStandardTree(classworkShare, atShare) {
    return {
        id: ROOT_ID,
        name: "Grade",
        share: TOTAL_SHARE,
        children: [
            {
                id: "classwork",
                name: "Classwork",
                share: classworkShare,
                children: [
                    { id: "AT", name: "AT", share: atShare, children: [] },
                    { id: "TLA", name: "TLA", share: TOTAL_SHARE - atShare, children: [] },
                ],
            },
            { id: "Exam", name: "Exam", share: TOTAL_SHARE - classworkShare, children: [] },
        ],
    };
}

// The standard 70/30 Classwork/Exam, 70/30 AT/TLA tree.
export function createStandardTree() {
    return buildStandardTree(7000, 7000);
}

// Starting tree for "+ New rule": one criterion at 100% (sketch 1).
export function createDefaultTree() {
    const tree = { id: ROOT_ID, name: "Grade", share: TOTAL_SHARE, children: [] };
    return {
        ...tree,
        children: [{ id: nextCriterionId(tree), name: "Criteria 1", share: TOTAL_SHARE, children: [] }],
    };
}

// Saved weights -> share units. Each level is forced to total exactly 10000
// (the last criterion absorbs any rounding difference).
function criteriaToNodes(criteria) {
    const list = Array.isArray(criteria) ? criteria : [];
    const shares = list.map((criterion) => fractionToShare(criterion?.weight) ?? 0);
    const total = shares.reduce((sum, share) => sum + share, 0);
    if (list.length > 0 && total !== TOTAL_SHARE) {
        shares[shares.length - 1] += TOTAL_SHARE - total;
    }

    return list.map((criterion, index) => ({
        id: String(criterion.id),
        name: String(criterion.name ?? "Criterion"),
        share: shares[index],
        children: criteriaToNodes(criterion.children),
    }));
}

function nodesToCriteria(nodes) {
    return (nodes ?? []).map((node) => ({
        id: node.id,
        name: node.name,
        weight: node.share / TOTAL_SHARE,
        children: nodesToCriteria(node.children),
    }));
}

// Builds the editor tree from a saved rule.
// Reads "criteria" (current format). Rules saved in the old format are read
// from "hierarchy", or rebuilt from effectiveMultipliers as a last resort.
export function ruleToTree(rule) {
    if (Array.isArray(rule?.criteria) && rule.criteria.length > 0) {
        return { id: ROOT_ID, name: "Grade", share: TOTAL_SHARE, children: criteriaToNodes(rule.criteria) };
    }

    const hierarchy = rule?.hierarchy;
    let classwork = fractionToShare(hierarchy?.classwork);
    let at = fractionToShare(hierarchy?.classworkSplit?.AT);

    if (classwork === null || at === null) {
        const atEffective = fractionToShare(rule?.effectiveMultipliers?.AT);
        const tlaEffective = fractionToShare(rule?.effectiveMultipliers?.TLA);
        if (atEffective !== null && tlaEffective !== null && atEffective + tlaEffective > 0) {
            classwork = atEffective + tlaEffective;
            at = Math.round((atEffective * TOTAL_SHARE) / classwork);
        }
    }
    if (classwork === null || at === null) return createStandardTree();

    const maxShare = TOTAL_SHARE - MIN_SHARE;
    return buildStandardTree(clamp(classwork, MIN_SHARE, maxShare), clamp(at, MIN_SHARE, maxShare));
}

// Returns an error message for the first problem in the tree, or "".
// The editor already prevents these; this guards saved data.
export function validateTree(tree) {
    if (!tree?.children?.length) return "Add at least one criterion.";

    const seenIds = new Set();
    const check = (node, depth) => {
        const children = node.children ?? [];
        if (children.length === 0) return "";
        if (depth >= MAX_DEPTH) return `Criteria can only be nested ${MAX_DEPTH} levels deep.`;
        if (children.length > MAX_CRITERIA_PER_LEVEL) {
            return `A level can have at most ${MAX_CRITERIA_PER_LEVEL} criteria.`;
        }
        const total = children.reduce((sum, child) => sum + child.share, 0);
        if (total !== TOTAL_SHARE) return `The criteria in ${node.name} must add up to 100%.`;

        for (const child of children) {
            if (seenIds.has(child.id)) return "Two criteria share the same id.";
            seenIds.add(child.id);
            if (!Number.isInteger(child.share) || child.share < MIN_SHARE) {
                return `${child.name} must be at least 1%.`;
            }
            const nameError = checkName(children, child.name, child.id);
            if (nameError) return nameError;
            const childError = check(child, depth + 1);
            if (childError) return childError;
        }
        return "";
    };
    return check(tree, 0);
}

// Converts the editor tree into the two objects saved on a rule.
export function buildRuleMath(tree) {
    const error = validateTree(tree);
    if (error) return { ok: false, error, criteria: null, effectiveMultipliers: null };

    const effective = getEffectiveShares(tree);
    const effectiveMultipliers = Object.fromEntries(
        getLeaves(tree).map((leaf) => [leaf.id, effective[leaf.id] / TOTAL_SHARE])
    );

    return { ok: true, error: "", criteria: nodesToCriteria(tree.children), effectiveMultipliers };
}

// The deepest criteria of a saved rule, for subject pages: where tasks go
// and how much each one counts. "path" lists the parent names, e.g.
// ["Classwork", "AT"]. effectiveShare comes from effectiveMultipliers.
export function getRuleLeaves(rule) {
    if (!rule) return [];
    const tree = ruleToTree(rule);
    const leaves = [];

    const visit = (node, path) => {
        (node.children ?? []).forEach((child) => {
            const childPath = [...path, child.name];
            if (child.children?.length) {
                visit(child, childPath);
            } else {
                leaves.push({
                    id: child.id,
                    name: child.name,
                    path: childPath,
                    effectiveShare: fractionToShare(rule.effectiveMultipliers?.[child.id]) ?? 0,
                });
            }
        });
    };
    visit(tree, []);
    return leaves;
}

// ---------------------------------------------------------------------------
// Formula text (spec PART 7)
// ---------------------------------------------------------------------------

// Live formula while editing: "Grade = 0.49 × AT + 0.21 × TLA + 0.30 × Exam"
export function getFormulaText(tree) {
    if (!tree) return "";
    const effective = getEffectiveShares(tree);
    const terms = getLeaves(tree).map(
        (leaf) => `${formatMultiplier(effective[leaf.id])} × ${leaf.name}`
    );
    return `${tree.name} = ${terms.join(" + ")}`;
}

// Formula for a saved rule, built from effectiveMultipliers (what grades.js uses).
export function getRuleFormulaText(rule) {
    const leaves = getRuleLeaves(rule);
    const multipliers = rule?.effectiveMultipliers ?? {};
    if (leaves.length === 0 || leaves.some((leaf) => fractionToShare(multipliers[leaf.id]) === null)) {
        return "Formula unavailable";
    }
    return `Grade = ${leaves
        .map((leaf) => `${formatMultiplier(leaf.effectiveShare)} × ${leaf.name}`)
        .join(" + ")}`;
}

// ---------------------------------------------------------------------------
// Colors and visualization data (spec PART 6 and PART 7)
// ---------------------------------------------------------------------------

// Position 0 -> 1, position 7 -> 8, position 8 -> 1 again.
export function getColorNumber(index) {
    return (index % CRITERIA_COLOR_COUNT) + 1;
}

export function getCriteriaColor(colorNumber) {
    return `var(--color-criteria-${colorNumber})`;
}

// One color number per criterion, shared by the editor, hover preview, bar,
// pie chart, and table, so a criterion keeps its color everywhere:
// - Top-level criteria use colors 1, 2, 3, ... by position.
// - The deepest criteria under a top-level criterion cycle through the 8
//   colors, skipping the colors of that top-level criterion's neighbors, so
//   no previewed section matches a section beside it (spec PART 6).
// - A middle-level criterion takes the color of its first deepest criterion.
export function getCriterionColors(tree) {
    const colors = new Map();
    const topLevel = tree?.children ?? [];

    topLevel.forEach((criterion, index) => {
        colors.set(criterion.id, getColorNumber(index));
        if (!criterion.children?.length) return;

        const excluded = new Set();
        if (index > 0) excluded.add(getColorNumber(index - 1));
        if (index < topLevel.length - 1) excluded.add(getColorNumber(index + 1));
        const pool = Array.from({ length: CRITERIA_COLOR_COUNT }, (_, number) => number + 1).filter(
            (colorNumber) => !excluded.has(colorNumber)
        );

        let leafIndex = 0;
        const visit = (node) => {
            (node.children ?? []).forEach((child) => {
                if (child.children?.length) {
                    const firstLeafIndex = leafIndex;
                    visit(child);
                    colors.set(child.id, pool[firstLeafIndex % pool.length]);
                } else {
                    colors.set(child.id, pool[leafIndex % pool.length]);
                    leafIndex += 1;
                }
            });
        };
        visit(criterion);
    });
    return colors;
}

// Text and dot color that reads on top of a criteria color.
export function getCriteriaOnColor(colorNumber) {
    return `var(--color-criteria-${colorNumber}-on)`;
}

function colorFields(colors, id) {
    const colorNumber = colors.get(id) ?? 1;
    return {
        colorNumber,
        color: getCriteriaColor(colorNumber),
        onColor: getCriteriaOnColor(colorNumber),
    };
}

// Sections for drawing one pill (the children of parentId).
export function getLevelSegments(tree, parentId) {
    const parent = findCriterion(tree, parentId);
    const colors = getCriterionColors(tree);
    return (parent?.children ?? []).map((child) => ({
        id: child.id,
        name: child.name,
        share: child.share,
        hasChildren: (child.children ?? []).length > 0,
        ...colorFields(colors, child.id),
    }));
}

// Hover preview: the deepest children of a hovered criterion, with their
// effective share of the total grade. Returns [] if there is nothing to preview.
export function getPreviewSegments(tree, hoveredId) {
    const node = findCriterion(tree, hoveredId);
    if (!node?.children?.length) return [];

    const colors = getCriterionColors(tree);
    const effective = getEffectiveShares(tree);
    const sectionShare = effective[node.id] || 1;
    return getLeaves(node).map((leaf) => ({
        id: leaf.id,
        name: leaf.name,
        effectiveShare: effective[leaf.id],
        sectionRatio: effective[leaf.id] / sectionShare,
        ...colorFields(colors, leaf.id),
    }));
}

// Flattened bar for rule cards: every deepest criterion in order.
export function getFlattenedSegments(tree) {
    const colors = getCriterionColors(tree);
    const effective = getEffectiveShares(tree);
    return getLeaves(tree).map((leaf) => ({
        id: leaf.id,
        name: leaf.name,
        effectiveShare: effective[leaf.id],
        ...colorFields(colors, leaf.id),
    }));
}

// Rows for the hierarchy table, in display order (the root is left out).
export function getHierarchyRows(tree) {
    if (!tree) return [];
    const colors = getCriterionColors(tree);
    const effective = getEffectiveShares(tree);
    const rows = [];

    const visit = (node, depth) => {
        (node.children ?? []).forEach((child) => {
            rows.push({
                id: child.id,
                name: child.name,
                depth,
                shareOfParent: child.share,
                effectiveShare: effective[child.id],
                hasChildren: (child.children ?? []).length > 0,
                ...colorFields(colors, child.id),
            });
            visit(child, depth + 1);
        });
    };
    visit(tree, 1);
    return rows;
}

// Rings for the nested pie chart, innermost first. Ring N holds every
// criterion at depth N. A criterion with no children that ends earlier is
// repeated as a filler (isFiller: true) so the ring angles line up; draw a
// filler in the same color to extend that criterion outward.
// "value" is the effective share of the total grade.
export function getPieRings(tree) {
    if (!tree?.children?.length) return [];
    const colors = getCriterionColors(tree);
    const deepest = Math.max(...getLeaves(tree).map((leaf) => getDepth(tree, leaf.id)));
    const effective = getEffectiveShares(tree);
    const rings = [];

    for (let ringDepth = 1; ringDepth <= deepest; ringDepth += 1) {
        const ring = [];
        const visit = (node, depth) => {
            (node.children ?? []).forEach((child) => {
                const isLeaf = !(child.children ?? []).length;
                if (depth === ringDepth || (isLeaf && depth < ringDepth)) {
                    ring.push({
                        id: child.id,
                        name: child.name,
                        value: effective[child.id],
                        isFiller: depth !== ringDepth,
                        hasChildren: !isLeaf,
                        ...colorFields(colors, child.id),
                    });
                } else if (depth < ringDepth) {
                    visit(child, depth + 1);
                }
            });
        };
        visit(tree, 1);
        rings.push(ring);
    }
    return rings;
}

// ---------------------------------------------------------------------------
// Database operations (spec PART 3 and PART 8)
// All of these return a NEW db object. Save it with saveDb(result.db) and
// setDbData(result.db) only when result.ok is true.
// ---------------------------------------------------------------------------

// Next "PREFIX-n" id (e.g. CR-2, SUB-3, C-4).
export function nextId(items, prefix) {
    const highest = (items ?? []).reduce((max, item) => {
        const number = Number(String(item.id ?? "").match(/(\d+)$/)?.[1] ?? 0);
        return Math.max(max, number);
    }, 0);
    return `${prefix}-${highest + 1}`;
}

// Everything that points to a rule. "Used by N subjects" = classes.length.
export function getRuleUsage(db, ruleId) {
    const subjectsById = new Map((db?.subjects ?? []).map((subject) => [subject.id, subject]));
    const classes = (db?.classes ?? [])
        .filter((classItem) => classItem.computationRuleId === ruleId)
        .map((classItem) => {
            const subject = subjectsById.get(classItem.subjectId);
            return {
                classId: classItem.id,
                subjectCode: subject?.subjectCode ?? "Unknown subject",
                subjectName: subject?.subjectName ?? "",
                programSection: classItem.programSection ?? "",
            };
        });
    const subjectIds = (db?.subjects ?? [])
        .filter((subject) => subject.defaultComputationRuleId === ruleId)
        .map((subject) => subject.id);
    const requestIds = (db?.verificationQueue ?? [])
        .filter((request) => request.computationRuleId === ruleId)
        .map((request) => request.id);

    return {
        classes,
        subjectIds,
        requestIds,
        isUsed: classes.length > 0 || subjectIds.length > 0 || requestIds.length > 0,
    };
}

// Case-insensitive search on rule name, tags, and school names.
export function searchRules(rules, query) {
    const text = String(query ?? "").trim().toLowerCase();
    if (!text) return rules ?? [];

    return (rules ?? []).filter((rule) =>
        [rule.ruleName, ...(rule.tags ?? []), ...(rule.schools ?? [])].some((value) =>
            String(value ?? "").toLowerCase().includes(text)
        )
    );
}

// Unique "<name> (Copy)" / "<name> (Copy 2)" name.
export function getCopyName(db, ruleName) {
    const taken = new Set((db?.computationRules ?? []).map((rule) => rule.ruleName.toLowerCase()));
    let candidate = `${ruleName} (Copy)`;
    let number = 2;
    while (taken.has(candidate.toLowerCase())) {
        candidate = `${ruleName} (Copy ${number})`;
        number += 1;
    }
    return candidate;
}

// Validates and cleans rule name, tags, and schools.
// Pass the rule's own id when editing so it does not clash with its own name.
export function validateRuleDetails(db, { ruleName, tags = [], schools = [] }, ruleId = null) {
    const errors = {};
    const name = String(ruleName ?? "").trim();

    if (!name) {
        errors.ruleName = "Enter a rule name.";
    } else if (
        (db?.computationRules ?? []).some(
            (rule) => rule.id !== ruleId && rule.ruleName.toLowerCase() === name.toLowerCase()
        )
    ) {
        errors.ruleName = `A rule named "${name}" already exists.`;
    }

    const cleanTags = [...new Set(tags ?? [])];
    const unknownTags = cleanTags.filter((tag) => !DEFAULT_TAGS.includes(tag));
    if (unknownTags.length > 0) {
        errors.tags = `Unknown tag: ${unknownTags.join(", ")}.`;
    }

    const seenSchools = new Set();
    const cleanSchools = (schools ?? [])
        .map((school) => String(school ?? "").trim())
        .filter((school) => {
            const key = school.toLowerCase();
            if (!school || seenSchools.has(key)) return false;
            seenSchools.add(key);
            return true;
        });

    return {
        ok: Object.keys(errors).length === 0,
        errors,
        values: { ruleName: name, tags: cleanTags, schools: cleanSchools },
    };
}

function firstError(errors) {
    return Object.values(errors)[0] ?? "";
}

function prepareRule(db, input, ruleId) {
    const details = validateRuleDetails(db, input, ruleId);
    if (!details.ok) return { ok: false, errors: details.errors };

    const math = buildRuleMath(input.tree);
    if (!math.ok) return { ok: false, errors: { tree: math.error } };

    return {
        ok: true,
        errors: {},
        fields: {
            ...details.values,
            criteria: math.criteria,
            effectiveMultipliers: math.effectiveMultipliers,
        },
    };
}

// input: { ruleName, tags, schools, tree }
export function createRule(db, input) {
    const prepared = prepareRule(db, input, null);
    if (!prepared.ok) {
        return { ok: false, db, rule: null, errors: prepared.errors, error: firstError(prepared.errors) };
    }

    const rules = db?.computationRules ?? [];
    const rule = { id: nextId(rules, "CR"), ...prepared.fields };
    return { ok: true, db: { ...db, computationRules: [...rules, rule] }, rule, errors: {}, error: "" };
}

// input: { ruleName, tags, schools, tree }
// Before calling this, show the edit warning when getRuleChangeImpact()
// reports affected classes.
export function updateRule(db, ruleId, input) {
    const rules = db?.computationRules ?? [];
    const existing = rules.find((rule) => rule.id === ruleId);
    if (!existing) {
        const errors = { rule: "This rule no longer exists." };
        return { ok: false, db, rule: null, errors, error: errors.rule };
    }

    const prepared = prepareRule(db, input, ruleId);
    if (!prepared.ok) {
        return { ok: false, db, rule: null, errors: prepared.errors, error: firstError(prepared.errors) };
    }

    const rule = {
        ...existing,
        ...prepared.fields,
        ...(isCopiedRule(existing) ? { isCopy: true } : {}),
    };
    delete rule.hierarchy; // old format, replaced by criteria
    return {
        ok: true,
        db: { ...db, computationRules: rules.map((item) => (item.id === ruleId ? rule : item)) },
        rule,
        errors: {},
        error: "",
    };
}

export function duplicateRule(db, ruleId) {
    const rules = db?.computationRules ?? [];
    const original = rules.find((rule) => rule.id === ruleId);
    if (!original) {
        return { ok: false, db, rule: null, error: "This rule no longer exists." };
    }

    const rule = {
        ...JSON.parse(JSON.stringify(original)),
        id: nextId(rules, "CR"),
        ruleName: getCopyName(db, original.ruleName),
        copiedFromRuleId: original.id,
        isCopy: true,
    };
    return { ok: true, db: { ...db, computationRules: [...rules, rule] }, rule, error: "" };
}

export function isCopiedRule(rule) {
    return Boolean(
        rule?.isCopy
        || rule?.copiedFromRuleId
        || /\s\(Copy(?:\s\d+)?\)$/i.test(rule?.ruleName ?? "")
    );
}

// Deletes a rule. If anything still uses it, replacementRuleId is required,
// and every class, subject default, and verification request is moved to it.
// The last remaining rule can never be deleted.
export function deleteRule(db, ruleId, replacementRuleId = null) {
    const rules = db?.computationRules ?? [];
    if (!rules.some((rule) => rule.id === ruleId)) {
        return { ok: false, db, error: "This rule no longer exists." };
    }
    if (rules.length <= 1) {
        return { ok: false, db, error: "At least one grade computation rule must exist." };
    }

    const usage = getRuleUsage(db, ruleId);
    if (usage.isUsed) {
        if (!replacementRuleId) {
            return { ok: false, db, error: "Choose the rule these subjects will use next." };
        }
        if (replacementRuleId === ruleId || !rules.some((rule) => rule.id === replacementRuleId)) {
            return { ok: false, db, error: "Choose a different rule that still exists." };
        }
    }

    const moveRule = (items, key) =>
        Array.isArray(items)
            ? items.map((item) => (item[key] === ruleId ? { ...item, [key]: replacementRuleId } : item))
            : items;

    return {
        ok: true,
        db: {
            ...db,
            computationRules: rules.filter((rule) => rule.id !== ruleId),
            classes: moveRule(db.classes, "computationRuleId"),
            subjects: moveRule(db.subjects, "defaultComputationRuleId"),
            verificationQueue: moveRule(db.verificationQueue, "computationRuleId"),
        },
        error: "",
    };
}

// ---------------------------------------------------------------------------
// Impact of rule changes on recorded tasks
// ---------------------------------------------------------------------------

// Counts tasks, in classes using ruleId, stored under criterion ids that are
// NOT in keepIds. Those tasks stop counting toward the grade.
function countTasksOutside(db, ruleId, keepIds, names) {
    const counts = new Map();
    (db?.classes ?? [])
        .filter((classItem) => classItem.computationRuleId === ruleId)
        .forEach((classItem) => {
            (classItem.studentRecords ?? []).forEach((record) => {
                TERM_KEYS.forEach((term) => {
                    Object.entries(record.grades?.[term] ?? {}).forEach(([criterionId, tasks]) => {
                        if (keepIds.has(criterionId)) return;
                        const count = toTaskList(tasks).length;
                        if (count > 0) counts.set(criterionId, (counts.get(criterionId) ?? 0) + count);
                    });
                });
            });
        });

    const lostTasks = [...counts.entries()].map(([criterionId, count]) => ({
        criterionId,
        name: names.get(criterionId) ?? "Removed criterion",
        count,
    }));
    return { lostTasks, lostTaskCount: lostTasks.reduce((total, item) => total + item.count, 0) };
}

function leafNames(rule) {
    return new Map(getRuleLeaves(rule).map((leaf) => [leaf.id, leaf.name]));
}

// For the edit warning: which subjects use the rule, and how many recorded
// tasks would stop counting because their criterion was deleted.
export function getRuleChangeImpact(db, ruleId, newTree) {
    const rule = (db?.computationRules ?? []).find((item) => item.id === ruleId);
    const usage = getRuleUsage(db, ruleId);
    const keepIds = new Set(getLeaves(newTree).map((leaf) => leaf.id));
    return { classes: usage.classes, ...countTasksOutside(db, ruleId, keepIds, leafNames(rule)) };
}

// For the delete dialog: tasks that will stop counting when the rule's
// subjects move to replacementRuleId (criteria the replacement lacks).
export function getRuleSwitchImpact(db, ruleId, replacementRuleId) {
    const rules = db?.computationRules ?? [];
    const rule = rules.find((item) => item.id === ruleId);
    const replacement = rules.find((item) => item.id === replacementRuleId);
    const keepIds = new Set(getRuleLeaves(replacement).map((leaf) => leaf.id));
    return countTasksOutside(db, ruleId, keepIds, leafNames(rule));
}
