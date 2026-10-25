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
// The tree is editor state only. db.json keeps the fixed hierarchy format.

export const TOTAL_SHARE = 10000;
export const MIN_SHARE = 100;
export const MAX_CRITERIA_PER_LEVEL = 8;
export const MAX_DEPTH = 3;
export const MAX_NAME_LENGTH = 30;
export const CRITERIA_COLOR_COUNT = 8;
export const DEFAULT_TAGS = ["Graduate", "Undergraduate"];

const ROOT_ID = "grade";
const FIXED_LAYOUT = { classwork: ["AT", "TLA"], Exam: [] };

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
// Structure editing (spec PART 5). Hidden in Phase 1 (structureLocked).
// ---------------------------------------------------------------------------

function nextCriterionId(tree) {
    const ids = [];
    const visit = (node) => {
        ids.push(node.id);
        (node.children ?? []).forEach(visit);
    };
    visit(tree);
    const highest = ids.reduce((max, id) => {
        const number = Number(String(id).match(/^crit-(\d+)$/)?.[1] ?? 0);
        return Math.max(max, number);
    }, 0);
    return `crit-${highest + 1}`;
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
export function splitCriterion(tree, id, name = "SubCriteria 1") {
    const check = canSplitCriterion(tree, id);
    if (!check.allowed) return failure(tree, check.reason);

    const nameError = checkName([], name);
    if (nameError) return failure(tree, nameError);

    const child = { id: nextCriterionId(tree), name: String(name).trim(), share: TOTAL_SHARE, children: [] };
    return success(updateNode(tree, id, (node) => ({ ...node, children: [child] })));
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
// Fixed-category conversion (Phase 1: Classwork [AT, TLA] + Exam)
// ---------------------------------------------------------------------------

function buildFixedTree(classworkShare, atShare) {
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

// Starting tree for "+ New Rule": 70/30 Classwork/Exam, 70/30 AT/TLA.
export function createDefaultTree() {
    return buildFixedTree(7000, 7000);
}

function fractionToShare(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number * TOTAL_SHARE) : null;
}

// Builds the editor tree from a saved rule's hierarchy. If the hierarchy is
// missing, it is rebuilt from effectiveMultipliers; if both are missing, the
// default 70/30 tree is used.
export function ruleToTree(rule) {
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
    if (classwork === null || at === null) return createDefaultTree();

    const maxShare = TOTAL_SHARE - MIN_SHARE;
    return buildFixedTree(clamp(classwork, MIN_SHARE, maxShare), clamp(at, MIN_SHARE, maxShare));
}

export function isFixedStructure(tree) {
    if (tree?.id !== ROOT_ID) return false;
    const children = tree.children ?? [];
    const topIds = Object.keys(FIXED_LAYOUT);
    if (children.length !== topIds.length) return false;

    return children.every((child, index) => {
        const expectedChildren = FIXED_LAYOUT[topIds[index]];
        const grandchildren = child.children ?? [];
        return (
            child.id === topIds[index] &&
            grandchildren.length === expectedChildren.length &&
            grandchildren.every(
                (grandchild, childIndex) =>
                    grandchild.id === expectedChildren[childIndex] && !grandchild.children?.length
            )
        );
    });
}

// Converts the editor tree into the two objects saved on a rule.
export function buildRuleMath(tree) {
    if (!isFixedStructure(tree)) {
        return {
            ok: false,
            error: "Rules must use the Classwork (AT, TLA) and Exam structure for now.",
            hierarchy: null,
            effectiveMultipliers: null,
        };
    }

    const share = (id) => findCriterion(tree, id).share / TOTAL_SHARE;
    const effective = getEffectiveShares(tree);

    return {
        ok: true,
        error: "",
        hierarchy: {
            classwork: share("classwork"),
            exam: share("Exam"),
            classworkSplit: { AT: share("AT"), TLA: share("TLA") },
        },
        effectiveMultipliers: {
            AT: effective.AT / TOTAL_SHARE,
            TLA: effective.TLA / TOTAL_SHARE,
            Exam: effective.Exam / TOTAL_SHARE,
        },
    };
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
    const multipliers = rule?.effectiveMultipliers;
    const terms = ["AT", "TLA", "Exam"].map((key) => {
        const share = fractionToShare(multipliers?.[key]);
        return share === null ? null : `${formatMultiplier(share)} × ${key}`;
    });
    if (terms.includes(null)) return "Formula unavailable";
    return `Grade = ${terms.join(" + ")}`;
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

// Sections for drawing one pill (the children of parentId).
export function getLevelSegments(tree, parentId) {
    const parent = findCriterion(tree, parentId);
    return (parent?.children ?? []).map((child, index) => {
        const colorNumber = getColorNumber(index);
        return {
            id: child.id,
            name: child.name,
            share: child.share,
            hasChildren: (child.children ?? []).length > 0,
            colorNumber,
            color: getCriteriaColor(colorNumber),
        };
    });
}

// Hover preview: the deepest children of a hovered criterion, with their
// effective share of the total grade. Colors skip the colors of the sections
// on either side of the hovered criterion, then cycle, so no previewed
// section matches a section beside it. Returns [] if there is nothing to preview.
export function getPreviewSegments(tree, hoveredId) {
    const node = findCriterion(tree, hoveredId);
    if (!node?.children?.length) return [];

    const context = siblingContext(tree, hoveredId);
    const excluded = new Set();
    if (context) {
        if (context.index > 0) excluded.add(getColorNumber(context.index - 1));
        if (context.index < context.siblings.length - 1) excluded.add(getColorNumber(context.index + 1));
    }
    const pool = Array.from({ length: CRITERIA_COLOR_COUNT }, (_, index) => index + 1).filter(
        (colorNumber) => !excluded.has(colorNumber)
    );

    const effective = getEffectiveShares(tree);
    const sectionShare = effective[node.id] || 1;
    return getLeaves(node).map((leaf, index) => {
        const colorNumber = pool[index % pool.length];
        return {
            id: leaf.id,
            name: leaf.name,
            effectiveShare: effective[leaf.id],
            sectionRatio: effective[leaf.id] / sectionShare,
            colorNumber,
            color: getCriteriaColor(colorNumber),
        };
    });
}

// Small flattened pill for rule cards: every deepest criterion in order.
export function getFlattenedSegments(tree) {
    const effective = getEffectiveShares(tree);
    return getLeaves(tree).map((leaf, index) => {
        const colorNumber = getColorNumber(index);
        return {
            id: leaf.id,
            name: leaf.name,
            effectiveShare: effective[leaf.id],
            colorNumber,
            color: getCriteriaColor(colorNumber),
        };
    });
}

// Rows for the hierarchy table, in display order (the root is left out).
export function getHierarchyRows(tree) {
    if (!tree) return [];
    const effective = getEffectiveShares(tree);
    const rows = [];

    const visit = (node, depth) => {
        (node.children ?? []).forEach((child, index) => {
            rows.push({
                id: child.id,
                name: child.name,
                depth,
                shareOfParent: child.share,
                effectiveShare: effective[child.id],
                hasChildren: (child.children ?? []).length > 0,
                colorNumber: getColorNumber(index),
            });
            visit(child, depth + 1);
        });
    };
    visit(tree, 1);
    return rows;
}

// Rings for the nested pie chart, innermost first. Ring N holds every
// criterion at depth N. A criterion with no children that ends earlier is
// repeated as a filler (isFiller: true) so the ring angles line up; draw
// fillers transparent. "value" is the effective share of the total grade.
export function getPieRings(tree) {
    if (!tree?.children?.length) return [];
    const deepest = Math.max(...getLeaves(tree).map((leaf) => getDepth(tree, leaf.id)));
    const effective = getEffectiveShares(tree);
    const rings = [];

    for (let ringDepth = 1; ringDepth <= deepest; ringDepth += 1) {
        const ring = [];
        const visit = (node, depth) => {
            (node.children ?? []).forEach((child, index) => {
                const isLeaf = !(child.children ?? []).length;
                if (depth === ringDepth || (isLeaf && depth < ringDepth)) {
                    const colorNumber = getColorNumber(index);
                    ring.push({
                        id: child.id,
                        name: child.name,
                        value: effective[child.id],
                        isFiller: depth !== ringDepth,
                        colorNumber,
                        color: getCriteriaColor(colorNumber),
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

// Next "PREFIX-n" id. Same logic as the copy in SubjectMenu.jsx.
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
            hierarchy: math.hierarchy,
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
// Before calling this, show the edit warning when getRuleUsage(db, ruleId).classes.length > 0.
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

    const rule = { ...existing, ...prepared.fields };
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
    };
    return { ok: true, db: { ...db, computationRules: [...rules, rule] }, rule, error: "" };
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
