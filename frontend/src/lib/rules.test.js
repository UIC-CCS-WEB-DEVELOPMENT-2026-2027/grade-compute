// Characterization tests for rules.js (grade computation rule maths,
// the editor tree, and rule database operations).
import { describe, expect, it } from "vitest";
import { makeSeedDb, makeStandardRule, makeTask } from "@/test/fixtures.js";
import {
    addCriterion,
    buildRuleMath,
    canAddCriterion,
    canDeleteCriterion,
    canSplitCriterion,
    createDefaultTree,
    createRule,
    createStandardTree,
    CRITERIA_COLOR_COUNT,
    DEFAULT_TAGS,
    deleteCriterion,
    deleteRule,
    dragHandle,
    duplicateRule,
    findCriterion,
    findParent,
    formatPercent,
    getColorNumber,
    getCopyName,
    getCriteriaColor,
    getCriteriaOnColor,
    getCriterionColors,
    getDepth,
    getEffectiveShares,
    getFlattenedSegments,
    getFormulaText,
    getHierarchyRows,
    getLeaves,
    getLevelSegments,
    getPieRings,
    getPreviewSegments,
    getRuleChangeImpact,
    getRuleFormulaText,
    getRuleLeaves,
    getRuleSwitchImpact,
    getRuleUsage,
    getShareLimits,
    isCopiedRule,
    MAX_CRITERIA_PER_LEVEL,
    MAX_DEPTH,
    MAX_NAME_LENGTH,
    MIN_SHARE,
    nextId,
    percentToShare,
    renameCriterion,
    ruleToTree,
    searchRules,
    setCriterionPercent,
    setCriterionShare,
    shareToPercent,
    splitCriterion,
    TOTAL_SHARE,
    updateRule,
    validateRuleDetails,
    validateTree,
    getHandleRatio,
    weightToShare,
} from "./rules.js";

const NEW_ID = /^crit-[a-z0-9]+$/;

function leaf(id, name, share) {
    return { id, name, share, children: [] };
}

function root(children) {
    return { id: "grade", name: "Grade", share: 10000, children };
}

// [id, share] of each child of a node.
function shares(tree, parentId = "grade") {
    return findCriterion(tree, parentId).children.map((child) => [child.id, child.share]);
}

// Grade -> A 30%, B 30%, C 40%
function threeWay() {
    return root([leaf("a", "A", 3000), leaf("b", "B", 3000), leaf("c", "C", 4000)]);
}

// Seed database plus a second rule with different criterion ids.
function makeTwoRuleDb() {
    const db = makeSeedDb();
    db.computationRules.push({
        id: "CR-2",
        ruleName: "Projects Rule",
        tags: ["Graduate"],
        schools: [],
        criteria: [
            { id: "proj", name: "Projects", weight: 0.5, children: [] },
            { id: "final", name: "Final Exam", weight: 0.5, children: [] },
        ],
        effectiveMultipliers: { proj: 0.5, final: 0.5 },
    });
    return db;
}

describe("constants", () => {
    it("match the limits the editor uses", () => {
        expect(TOTAL_SHARE).toBe(10000);
        expect(MIN_SHARE).toBe(100);
        expect(MAX_CRITERIA_PER_LEVEL).toBe(8);
        expect(MAX_DEPTH).toBe(3);
        expect(MAX_NAME_LENGTH).toBe(30);
        expect(CRITERIA_COLOR_COUNT).toBe(8);
        expect(DEFAULT_TAGS).toEqual(["Graduate", "Undergraduate"]);
    });
});

describe("percentages", () => {
    it("percentToShare converts typed text to hundredths of a percent", () => {
        expect(percentToShare("70")).toBe(7000);
        expect(percentToShare("33.33")).toBe(3333);
        expect(percentToShare("33.333")).toBe(3333);
        expect(percentToShare("45%")).toBe(4500);
        expect(percentToShare(" 12.5 % ")).toBe(1250);
        expect(percentToShare(".5")).toBe(50);
        expect(percentToShare("5.")).toBe(500);
        expect(percentToShare(70)).toBe(7000);
        expect(percentToShare("-5")).toBe(-500);
    });

    it("percentToShare returns null for text that is not a number", () => {
        expect(percentToShare("abc")).toBeNull();
        expect(percentToShare("")).toBeNull();
        expect(percentToShare("1e2")).toBeNull();
        expect(percentToShare("7 0")).toBeNull();
        expect(percentToShare(null)).toBeNull();
        expect(percentToShare(undefined)).toBeNull();
    });

    it("formats shares as percentages", () => {
        expect(formatPercent(7000)).toBe("70%");
        expect(formatPercent(3333)).toBe("33.33%");
        expect(formatPercent(50)).toBe("0.50%");
        expect(formatPercent(7000, { fixed: true })).toBe("70.00%");
        expect(shareToPercent(3333)).toBe(33.33);
    });
});

describe("tree lookups", () => {
    const tree = createStandardTree();

    it("finds criteria, parents, depths and leaves", () => {
        expect(findCriterion(tree, "AT")).toEqual(leaf("AT", "AT", 7000));
        expect(findCriterion(tree, "missing")).toBeNull();
        expect(findCriterion(null, "AT")).toBeNull();
        expect(findParent(tree, "AT").id).toBe("classwork");
        expect(findParent(tree, "Exam").id).toBe("grade");
        expect(findParent(tree, "grade")).toBeNull();
        expect(getDepth(tree, "grade")).toBe(0);
        expect(getDepth(tree, "classwork")).toBe(1);
        expect(getDepth(tree, "AT")).toBe(2);
        expect(getDepth(tree, "missing")).toBe(-1);
        expect(getLeaves(tree).map((node) => node.id)).toEqual(["AT", "TLA", "Exam"]);
        expect(getLeaves(null)).toEqual([]);
    });
});

describe("changing a percentage", () => {
    it("trades with the right-hand neighbour", () => {
        const result = setCriterionShare(createStandardTree(), "classwork", 6000);
        expect(result).toMatchObject({ ok: true, error: "" });
        expect(shares(result.tree)).toEqual([
            ["classwork", 6000],
            ["Exam", 4000],
        ]);

        const middle = setCriterionShare(threeWay(), "b", 5000);
        expect(shares(middle.tree)).toEqual([
            ["a", 3000],
            ["b", 5000],
            ["c", 2000],
        ]);
    });

    it("the last criterion trades with its left-hand neighbour", () => {
        const result = setCriterionShare(createStandardTree(), "Exam", 2000);
        expect(shares(result.tree)).toEqual([
            ["classwork", 8000],
            ["Exam", 2000],
        ]);

        const last = setCriterionShare(threeWay(), "c", 5000);
        expect(shares(last.tree)).toEqual([
            ["a", 3000],
            ["b", 2000],
            ["c", 5000],
        ]);
    });

    it("works on a nested level and leaves the other levels alone", () => {
        const result = setCriterionShare(createStandardTree(), "AT", 5000);
        expect(shares(result.tree, "classwork")).toEqual([
            ["AT", 5000],
            ["TLA", 5000],
        ]);
        expect(shares(result.tree)).toEqual([
            ["classwork", 7000],
            ["Exam", 3000],
        ]);
    });

    it("does not change the tree it was given", () => {
        const tree = createStandardTree();
        setCriterionShare(tree, "classwork", 6000);
        expect(tree).toEqual(createStandardTree());
    });

    it("returns the same tree when the value is unchanged", () => {
        const tree = createStandardTree();
        expect(setCriterionShare(tree, "classwork", 7000)).toEqual({ ok: true, tree, error: "" });
        expect(setCriterionShare(tree, "classwork", 7000).tree).toBe(tree);
    });

    it("rejects values outside the limits and returns the original tree", () => {
        const tree = createStandardTree();
        const tooLow = setCriterionShare(tree, "classwork", 99);
        expect(tooLow).toEqual({ ok: false, tree, error: "Classwork must be at least 1%." });
        expect(tooLow.tree).toBe(tree);

        expect(setCriterionShare(tree, "classwork", 9950).error).toBe(
            "Classwork can be at most 99.00%. Exam must keep at least 1%.",
        );
        expect(setCriterionShare(tree, "classwork", 9900).ok).toBe(true);
        expect(setCriterionShare(tree, "classwork", 100).ok).toBe(true);
    });

    it("rejects the root, non-integers and an only child", () => {
        const tree = createStandardTree();
        expect(setCriterionShare(tree, "grade", 5000).error).toBe(
            "This criterion cannot be changed.",
        );
        expect(setCriterionShare(tree, "missing", 5000).error).toBe(
            "This criterion cannot be changed.",
        );
        expect(setCriterionShare(tree, "classwork", 60.5).error).toBe(
            "Enter a percentage, e.g. 70 or 33.33.",
        );

        const single = root([leaf("only", "Only", 10000)]);
        expect(setCriterionShare(single, "only", 5000).error).toBe(
            "Only is the only criterion in this level, so it must stay at 100%.",
        );
        expect(setCriterionShare(single, "only", 10000)).toEqual({
            ok: true,
            tree: single,
            error: "",
        });
    });

    it("getShareLimits gives the range and the neighbour", () => {
        const tree = createStandardTree();
        expect(getShareLimits(tree, "classwork")).toEqual({
            min: 100,
            max: 9900,
            neighbor: findCriterion(tree, "Exam"),
        });
        expect(getShareLimits(tree, "Exam")).toEqual({
            min: 100,
            max: 9900,
            neighbor: findCriterion(tree, "classwork"),
        });
        expect(getShareLimits(tree, "grade")).toBeNull();
        expect(getShareLimits(root([leaf("only", "Only", 10000)]), "only")).toEqual({
            min: 10000,
            max: 10000,
            neighbor: null,
        });
    });

    it("setCriterionPercent reads typed text", () => {
        const tree = createStandardTree();
        expect(shares(setCriterionPercent(tree, "classwork", "60").tree)).toEqual([
            ["classwork", 6000],
            ["Exam", 4000],
        ]);
        expect(shares(setCriterionPercent(tree, "classwork", "66.666%").tree)).toEqual([
            ["classwork", 6667],
            ["Exam", 3333],
        ]);
        expect(setCriterionPercent(tree, "classwork", "abc")).toEqual({
            ok: false,
            tree,
            error: "Enter a percentage, e.g. 70 or 33.33.",
        });
    });
});

describe("dragging a handle", () => {
    it("moves the boundary to the pointer, snapped to whole percents", () => {
        const tree = createStandardTree();
        expect(shares(dragHandle(tree, "grade", 0, 0.6).tree)).toEqual([
            ["classwork", 6000],
            ["Exam", 4000],
        ]);
        expect(shares(dragHandle(tree, "grade", 0, 0.655).tree)).toEqual([
            ["classwork", 6600],
            ["Exam", 3400],
        ]);
        expect(shares(dragHandle(tree, "grade", 0, 0.655, 1).tree)).toEqual([
            ["classwork", 6550],
            ["Exam", 3450],
        ]);
    });

    it("stops at 1% on either side instead of warning", () => {
        const tree = createStandardTree();
        expect(shares(dragHandle(tree, "grade", 0, 0).tree)).toEqual([
            ["classwork", 100],
            ["Exam", 9900],
        ]);
        expect(shares(dragHandle(tree, "grade", 0, 1).tree)).toEqual([
            ["classwork", 9900],
            ["Exam", 100],
        ]);
        expect(shares(dragHandle(tree, "grade", 0, 7).tree)).toEqual([
            ["classwork", 9900],
            ["Exam", 100],
        ]);
        expect(dragHandle(tree, "grade", 0, -3).ok).toBe(true);
    });

    it("only changes the two criteria next to the handle", () => {
        expect(shares(dragHandle(threeWay(), "grade", 1, 0.8).tree)).toEqual([
            ["a", 3000],
            ["b", 5000],
            ["c", 2000],
        ]);
        expect(shares(dragHandle(threeWay(), "grade", 1, 0.1).tree)).toEqual([
            ["a", 3000],
            ["b", 100],
            ["c", 6900],
        ]);
    });

    it("works on a nested level", () => {
        expect(
            shares(dragHandle(createStandardTree(), "classwork", 0, 0.5).tree, "classwork"),
        ).toEqual([
            ["AT", 5000],
            ["TLA", 5000],
        ]);
    });

    it("returns the same tree when nothing changes", () => {
        const tree = createStandardTree();
        expect(dragHandle(tree, "grade", 0, 0.7).tree).toBe(tree);
    });

    it("rejects a handle that does not exist and a position that is not a number", () => {
        const tree = createStandardTree();
        expect(dragHandle(tree, "grade", 1, 0.5)).toEqual({
            ok: false,
            tree,
            error: "This handle does not exist.",
        });
        expect(dragHandle(tree, "grade", -1, 0.5).error).toBe("This handle does not exist.");
        expect(dragHandle(tree, "Exam", 0, 0.5).error).toBe("This handle does not exist.");
        expect(dragHandle(tree, "grade", 0, NaN).error).toBe("Invalid handle position.");
    });
});

describe("adding a criterion", () => {
    it("takes half of the last criterion and gets a default name", () => {
        const result = addCriterion(createStandardTree(), "grade");
        const children = result.tree.children;
        expect(result.ok).toBe(true);
        expect(children.map((child) => [child.name, child.share])).toEqual([
            ["Classwork", 7000],
            ["Exam", 1500],
            ["Criteria 3", 1500],
        ]);
        expect(children[2].id).toMatch(NEW_ID);
        expect(children[2].children).toEqual([]);
    });

    it('names nested criteria "SubCriteria n"', () => {
        const result = addCriterion(createStandardTree(), "classwork");
        expect(
            findCriterion(result.tree, "classwork").children.map((child) => [
                child.name,
                child.share,
            ]),
        ).toEqual([
            ["AT", 7000],
            ["TLA", 1500],
            ["SubCriteria 3", 1500],
        ]);
    });

    it("rounds the new share down and leaves the rest with the last criterion", () => {
        const tree = root([leaf("a", "A", 6667), leaf("b", "B", 3333)]);
        expect(addCriterion(tree, "grade").tree.children.map((child) => child.share)).toEqual([
            6667, 1667, 1666,
        ]);
    });

    it("skips a default name that is already taken", () => {
        const tree = root([leaf("a", "Criteria 3", 5000), leaf("b", "B", 5000)]);
        expect(addCriterion(tree, "grade").tree.children[2].name).toBe("Criteria 4");
    });

    it("accepts a typed name and checks it", () => {
        const tree = createStandardTree();
        expect(addCriterion(tree, "grade", " Projects ").tree.children[2].name).toBe("Projects");
        expect(addCriterion(tree, "grade", "exam")).toEqual({
            ok: false,
            tree,
            error: '"exam" is already used in this level.',
        });
        expect(addCriterion(tree, "grade", "  ").error).toBe("Enter a name.");
        expect(addCriterion(tree, "grade", "x".repeat(31)).error).toBe(
            "Names can be at most 30 characters.",
        );
        expect(addCriterion(tree, "grade", "x".repeat(30)).ok).toBe(true);
    });

    it("canAddCriterion explains why a level cannot take another criterion", () => {
        const tree = createStandardTree();
        expect(canAddCriterion(tree, "grade")).toEqual({ allowed: true, reason: "" });
        expect(canAddCriterion(tree, "missing")).toEqual({
            allowed: false,
            reason: "This level does not exist.",
        });
        expect(canAddCriterion(tree, "Exam")).toEqual({
            allowed: false,
            reason: "Split this criterion first.",
        });

        const full = root(
            Array.from({ length: 8 }, (_, index) => leaf(`c${index}`, `C${index}`, 1250)),
        );
        expect(canAddCriterion(full, "grade")).toEqual({
            allowed: false,
            reason: "A level can have at most 8 criteria.",
        });
        expect(addCriterion(full, "grade").error).toBe("A level can have at most 8 criteria.");

        const tiny = root([leaf("a", "A", 9801), leaf("b", "B", 199)]);
        expect(canAddCriterion(tiny, "grade")).toEqual({
            allowed: false,
            reason: "B is too small to split in half. Each criterion needs at least 1%.",
        });
    });
});

describe("deleting a criterion", () => {
    it("gives its share to the left neighbour", () => {
        const result = deleteCriterion(createStandardTree(), "Exam");
        expect(result.ok).toBe(true);
        expect(shares(result.tree)).toEqual([["classwork", 10000]]);
        expect(shares(deleteCriterion(threeWay(), "b").tree)).toEqual([
            ["a", 6000],
            ["c", 4000],
        ]);
    });

    it("the first criterion gives its share to the right neighbour", () => {
        expect(shares(deleteCriterion(createStandardTree(), "classwork").tree)).toEqual([
            ["Exam", 10000],
        ]);
        expect(shares(deleteCriterion(threeWay(), "a").tree)).toEqual([
            ["b", 6000],
            ["c", 4000],
        ]);
    });

    it("deleting the only subcriterion removes the split", () => {
        const oneLeft = deleteCriterion(createStandardTree(), "AT").tree;
        expect(shares(oneLeft, "classwork")).toEqual([["TLA", 10000]]);
        const noneLeft = deleteCriterion(oneLeft, "TLA");
        expect(noneLeft.ok).toBe(true);
        expect(findCriterion(noneLeft.tree, "classwork")).toEqual(
            leaf("classwork", "Classwork", 7000),
        );
    });

    it("refuses to delete the total grade or the last top-level criterion", () => {
        const tree = createStandardTree();
        expect(deleteCriterion(tree, "grade")).toEqual({
            ok: false,
            tree,
            error: "The total grade cannot be deleted.",
        });
        const single = root([leaf("only", "Only", 10000)]);
        expect(deleteCriterion(single, "only").error).toBe("At least one criterion is required.");
    });

    it("canDeleteCriterion reports whether subcriteria would go too", () => {
        const tree = createStandardTree();
        expect(canDeleteCriterion(tree, "classwork")).toEqual({
            allowed: true,
            reason: "",
            hasSubcriteria: true,
        });
        expect(canDeleteCriterion(tree, "Exam")).toEqual({
            allowed: true,
            reason: "",
            hasSubcriteria: false,
        });
        expect(canDeleteCriterion(tree, "grade")).toEqual({
            allowed: false,
            reason: "The total grade cannot be deleted.",
            hasSubcriteria: false,
        });
    });
});

describe("renaming a criterion", () => {
    it("trims the name", () => {
        const result = renameCriterion(createStandardTree(), "AT", " Quizzes ");
        expect(result.ok).toBe(true);
        expect(findCriterion(result.tree, "AT").name).toBe("Quizzes");
    });

    it("allows the same name in another level and a new letter case for itself", () => {
        const tree = createStandardTree();
        expect(renameCriterion(tree, "AT", "Exam").ok).toBe(true);
        expect(findCriterion(renameCriterion(tree, "AT", "at").tree, "AT").name).toBe("at");
    });

    it("rejects duplicates in the same level, empty names, long names and the root", () => {
        const tree = createStandardTree();
        expect(renameCriterion(tree, "AT", "tla")).toEqual({
            ok: false,
            tree,
            error: '"tla" is already used in this level.',
        });
        expect(renameCriterion(tree, "AT", "").error).toBe("Enter a name.");
        expect(renameCriterion(tree, "AT", null).error).toBe("Enter a name.");
        expect(renameCriterion(tree, "AT", "x".repeat(31)).error).toBe(
            "Names can be at most 30 characters.",
        );
        expect(renameCriterion(tree, "grade", "Total").error).toBe(
            "The total grade cannot be renamed.",
        );
    });
});

describe("splitting a criterion", () => {
    it("keeps the old id on the new subcriterion, so recorded tasks move into it", () => {
        const result = splitCriterion(createStandardTree(), "Exam");
        expect(result.ok).toBe(true);
        const parent = result.tree.children[1];
        expect(parent).toMatchObject({ name: "Exam", share: 3000 });
        expect(parent.id).toMatch(NEW_ID);
        expect(parent.children).toEqual([leaf("Exam", "SubCriteria 1", 10000)]);
    });

    it("accepts a name", () => {
        const result = splitCriterion(createStandardTree(), "Exam", " Written ");
        expect(result.tree.children[1].children[0].name).toBe("Written");
        expect(splitCriterion(createStandardTree(), "Exam", "").error).toBe("Enter a name.");
    });

    it("refuses the root, criteria that already have subcriteria, and a fourth level", () => {
        const tree = createStandardTree();
        expect(canSplitCriterion(tree, "Exam")).toEqual({ allowed: true, reason: "" });
        expect(canSplitCriterion(tree, "grade")).toEqual({
            allowed: false,
            reason: "This criterion cannot be split.",
        });
        expect(canSplitCriterion(tree, "missing")).toEqual({
            allowed: false,
            reason: "This criterion cannot be split.",
        });
        expect(splitCriterion(tree, "classwork")).toEqual({
            ok: false,
            tree,
            error: "Classwork already has subcriteria.",
        });

        // AT is at depth 2; after a split its id sits at depth 3, the limit.
        const threeLevels = splitCriterion(tree, "AT").tree;
        expect(getDepth(threeLevels, "AT")).toBe(3);
        expect(splitCriterion(threeLevels, "AT").error).toBe(
            "Criteria can only be nested 3 levels deep.",
        );
    });
});

describe("effective shares", () => {
    it("multiplies shares down the tree", () => {
        expect(getEffectiveShares(createStandardTree())).toEqual({
            grade: 10000,
            classwork: 7000,
            AT: 4900,
            TLA: 2100,
            Exam: 3000,
        });
        expect(getEffectiveShares(null)).toEqual({});
    });

    it("gives leftover units to the largest remainders, leftmost first", () => {
        const tree = root([
            leaf("a", "A", 3333),
            {
                id: "b",
                name: "B",
                share: 3333,
                children: [leaf("b1", "B1", 3333), leaf("b2", "B2", 3333), leaf("b3", "B3", 3334)],
            },
            leaf("c", "C", 3334),
        ]);
        expect(getEffectiveShares(tree)).toEqual({
            grade: 10000,
            a: 3333,
            b: 3333,
            b1: 1111,
            b2: 1111,
            b3: 1111,
            c: 3334,
        });
    });

    it("children always add up to their parent", () => {
        const tree = root([
            {
                id: "p",
                name: "P",
                share: 3333,
                children: [leaf("x", "X", 5000), leaf("y", "Y", 5000)],
            },
            leaf("q", "Q", 6667),
        ]);
        // 3333 / 2 = 1666.5: the tie goes to the leftmost child.
        expect(getEffectiveShares(tree)).toMatchObject({ p: 3333, x: 1667, y: 1666, q: 6667 });
    });
});

describe("saved rules and the editor tree", () => {
    it("createStandardTree is the 70/30 tree", () => {
        expect(createStandardTree()).toEqual(
            root([
                {
                    id: "classwork",
                    name: "Classwork",
                    share: 7000,
                    children: [leaf("AT", "AT", 7000), leaf("TLA", "TLA", 3000)],
                },
                leaf("Exam", "Exam", 3000),
            ]),
        );
    });

    it("createDefaultTree is one criterion at 100%", () => {
        const tree = createDefaultTree();
        expect(tree).toMatchObject({ id: "grade", name: "Grade", share: 10000 });
        expect(tree.children).toHaveLength(1);
        expect(tree.children[0]).toMatchObject({ name: "Criteria 1", share: 10000, children: [] });
        expect(tree.children[0].id).toMatch(NEW_ID);
    });

    it("ruleToTree reads the saved criteria", () => {
        expect(ruleToTree(makeStandardRule())).toEqual(createStandardTree());
    });

    it("ruleToTree makes each level total 100% (the last criterion absorbs the difference)", () => {
        const rule = {
            criteria: [
                { id: 1, weight: 0.3 },
                { id: "b", name: "B", weight: 0.3 },
            ],
        };
        expect(ruleToTree(rule).children).toEqual([
            leaf("1", "Criterion", 3000),
            leaf("b", "B", 7000),
        ]);
    });

    it('ruleToTree rebuilds legacy rules from "hierarchy"', () => {
        const tree = ruleToTree({ hierarchy: { classwork: 0.6, classworkSplit: { AT: 0.5 } } });
        expect(shares(tree)).toEqual([
            ["classwork", 6000],
            ["Exam", 4000],
        ]);
        expect(shares(tree, "classwork")).toEqual([
            ["AT", 5000],
            ["TLA", 5000],
        ]);
    });

    it("ruleToTree rebuilds legacy rules from effectiveMultipliers", () => {
        const tree = ruleToTree({ effectiveMultipliers: { AT: 0.4, TLA: 0.2, Exam: 0.4 } });
        expect(shares(tree)).toEqual([
            ["classwork", 6000],
            ["Exam", 4000],
        ]);
        expect(shares(tree, "classwork")).toEqual([
            ["AT", 6667],
            ["TLA", 3333],
        ]);
    });

    it("ruleToTree keeps every legacy criterion at 1% or more", () => {
        const tree = ruleToTree({ hierarchy: { classwork: 1, classworkSplit: { AT: 0 } } });
        expect(shares(tree)).toEqual([
            ["classwork", 9900],
            ["Exam", 100],
        ]);
        expect(shares(tree, "classwork")).toEqual([
            ["AT", 100],
            ["TLA", 9900],
        ]);
    });

    it("ruleToTree falls back to the standard tree", () => {
        expect(ruleToTree(null)).toEqual(createStandardTree());
        expect(ruleToTree({})).toEqual(createStandardTree());
        expect(ruleToTree({ criteria: [] })).toEqual(createStandardTree());
    });

    it("buildRuleMath turns a tree into saved criteria and effectiveMultipliers", () => {
        const rule = makeStandardRule();
        expect(buildRuleMath(createStandardTree())).toEqual({
            ok: true,
            error: "",
            criteria: rule.criteria,
            effectiveMultipliers: { AT: 0.49, TLA: 0.21, Exam: 0.3 },
        });
    });

    it("buildRuleMath reports an invalid tree", () => {
        expect(buildRuleMath(root([]))).toEqual({
            ok: false,
            error: "Add at least one criterion.",
            criteria: null,
            effectiveMultipliers: null,
        });
    });

    it("getRuleLeaves lists the deepest criteria with their path and effective share", () => {
        expect(getRuleLeaves(makeStandardRule())).toEqual([
            { id: "AT", name: "AT", path: ["Classwork", "AT"], effectiveShare: 4900 },
            { id: "TLA", name: "TLA", path: ["Classwork", "TLA"], effectiveShare: 2100 },
            { id: "Exam", name: "Exam", path: ["Exam"], effectiveShare: 3000 },
        ]);
        expect(getRuleLeaves(null)).toEqual([]);
    });

    it("getRuleLeaves gives 0 to a criterion without a multiplier", () => {
        const rule = makeStandardRule();
        delete rule.effectiveMultipliers.TLA;
        expect(getRuleLeaves(rule).map((item) => item.effectiveShare)).toEqual([4900, 0, 3000]);
    });
});

describe("validateTree", () => {
    it("accepts a valid tree", () => {
        expect(validateTree(createStandardTree())).toBe("");
    });

    it("reports the first problem", () => {
        expect(validateTree(null)).toBe("Add at least one criterion.");
        expect(validateTree(root([]))).toBe("Add at least one criterion.");
        expect(validateTree(root([leaf("a", "A", 5000), leaf("b", "B", 4000)]))).toBe(
            "The criteria in Grade must add up to 100%.",
        );
        expect(validateTree(root([leaf("x", "A", 5000), leaf("x", "B", 5000)]))).toBe(
            "Two criteria share the same id.",
        );
        expect(validateTree(root([leaf("a", "A", 9950), leaf("b", "B", 50)]))).toBe(
            "B must be at least 1%.",
        );
        expect(validateTree(root([leaf("a", "A", 5000.5), leaf("b", "B", 4999.5)]))).toBe(
            "A must be at least 1%.",
        );
        expect(validateTree(root([leaf("a", "A", 5000), leaf("b", "a", 5000)]))).toBe(
            '"A" is already used in this level.',
        );
        expect(validateTree(root([leaf("a", " ", 5000), leaf("b", "B", 5000)]))).toBe(
            "Enter a name.",
        );
        expect(
            validateTree(
                root(Array.from({ length: 9 }, (_, index) => leaf(`c${index}`, `C${index}`, 1000))),
            ),
        ).toBe("A level can have at most 8 criteria.");
    });

    it("allows 3 levels and rejects a fourth", () => {
        const nest = (depth) =>
            depth === 0
                ? []
                : [{ id: `n${depth}`, name: `N${depth}`, share: 10000, children: nest(depth - 1) }];
        expect(validateTree(root(nest(3)))).toBe("");
        expect(validateTree(root(nest(4)))).toBe("Criteria can only be nested 3 levels deep.");
    });
});

describe("formula text", () => {
    it("lists each deepest criterion with its multiplier", () => {
        expect(getFormulaText(createStandardTree())).toBe(
            "Grade = 0.49 × AT + 0.21 × TLA + 0.30 × Exam",
        );
        expect(getFormulaText(null)).toBe("");
    });

    it("shows 4 decimals and trims up to 2 trailing zeros", () => {
        const tree = root([
            leaf("a", "A", 3333),
            leaf("b", "B", 1667),
            leaf("c", "C", 2500),
            leaf("d", "D", 2500),
        ]);
        expect(getFormulaText(tree)).toBe("Grade = 0.3333 × A + 0.1667 × B + 0.25 × C + 0.25 × D");
        expect(getFormulaText(root([leaf("a", "Only", 10000)]))).toBe("Grade = 1.00 × Only");
        expect(getFormulaText(root([leaf("a", "A", 5000), leaf("b", "B", 5000)]))).toBe(
            "Grade = 0.50 × A + 0.50 × B",
        );
        expect(getFormulaText(root([leaf("a", "A", 9990), leaf("b", "B", 10)]))).toBe(
            "Grade = 0.999 × A + 0.001 × B",
        );
    });

    it("getRuleFormulaText uses the saved multipliers", () => {
        expect(getRuleFormulaText(makeStandardRule())).toBe(
            "Grade = 0.49 × AT + 0.21 × TLA + 0.30 × Exam",
        );
    });

    it("getRuleFormulaText reports a rule it cannot describe", () => {
        const rule = makeStandardRule();
        delete rule.effectiveMultipliers.Exam;
        expect(getRuleFormulaText(rule)).toBe("Formula unavailable");
        expect(getRuleFormulaText(null)).toBe("Formula unavailable");
    });
});

describe("colors and visualization data", () => {
    const tree = createStandardTree();
    const color = (number) => ({
        colorNumber: number,
        color: `var(--color-criteria-${number})`,
        onColor: `var(--color-criteria-${number}-on)`,
    });

    it("cycles through 8 color numbers", () => {
        expect([0, 1, 7, 8, 15, 16].map(getColorNumber)).toEqual([1, 2, 8, 1, 8, 1]);
        expect(getCriteriaColor(3)).toBe("var(--color-criteria-3)");
        expect(getCriteriaOnColor(3)).toBe("var(--color-criteria-3-on)");
    });

    it("gives each criterion a color number, skipping the neighbours’ colors for subcriteria", () => {
        expect([...getCriterionColors(tree)]).toEqual([
            ["classwork", 1],
            ["AT", 1],
            ["TLA", 3],
            ["Exam", 2],
        ]);
        expect([...getCriterionColors(null)]).toEqual([]);
    });

    it("a middle-level criterion takes the color of its first deepest criterion", () => {
        const nested = root([
            {
                id: "top",
                name: "Top",
                share: 6000,
                children: [
                    leaf("first", "First", 4000),
                    {
                        id: "mid",
                        name: "Mid",
                        share: 6000,
                        children: [leaf("m1", "M1", 5000), leaf("m2", "M2", 5000)],
                    },
                ],
            },
            leaf("other", "Other", 4000),
        ]);
        expect([...getCriterionColors(nested)]).toEqual([
            ["top", 1],
            ["first", 1],
            ["m1", 3],
            ["m2", 4],
            ["mid", 3],
            ["other", 2],
        ]);
    });

    it("getLevelSegments describes one pill", () => {
        expect(getLevelSegments(tree, "grade")).toEqual([
            { id: "classwork", name: "Classwork", share: 7000, hasChildren: true, ...color(1) },
            { id: "Exam", name: "Exam", share: 3000, hasChildren: false, ...color(2) },
        ]);
        expect(getLevelSegments(tree, "missing")).toEqual([]);
    });

    it("getPreviewSegments lists the deepest children of a hovered criterion", () => {
        expect(getPreviewSegments(tree, "classwork")).toEqual([
            { id: "AT", name: "AT", effectiveShare: 4900, sectionRatio: 0.7, ...color(1) },
            { id: "TLA", name: "TLA", effectiveShare: 2100, sectionRatio: 0.3, ...color(3) },
        ]);
        expect(getPreviewSegments(tree, "Exam")).toEqual([]);
        expect(getPreviewSegments(tree, "missing")).toEqual([]);
    });

    it("getFlattenedSegments lists every deepest criterion", () => {
        expect(getFlattenedSegments(tree)).toEqual([
            { id: "AT", name: "AT", effectiveShare: 4900, ...color(1) },
            { id: "TLA", name: "TLA", effectiveShare: 2100, ...color(3) },
            { id: "Exam", name: "Exam", effectiveShare: 3000, ...color(2) },
        ]);
    });

    it("getHierarchyRows lists every criterion in display order", () => {
        expect(getHierarchyRows(tree)).toEqual([
            {
                id: "classwork",
                name: "Classwork",
                depth: 1,
                shareOfParent: 7000,
                effectiveShare: 7000,
                hasChildren: true,
                ...color(1),
            },
            {
                id: "AT",
                name: "AT",
                depth: 2,
                shareOfParent: 7000,
                effectiveShare: 4900,
                hasChildren: false,
                ...color(1),
            },
            {
                id: "TLA",
                name: "TLA",
                depth: 2,
                shareOfParent: 3000,
                effectiveShare: 2100,
                hasChildren: false,
                ...color(3),
            },
            {
                id: "Exam",
                name: "Exam",
                depth: 1,
                shareOfParent: 3000,
                effectiveShare: 3000,
                hasChildren: false,
                ...color(2),
            },
        ]);
        expect(getHierarchyRows(null)).toEqual([]);
    });

    it("getPieRings repeats a shallow criterion as a filler in the outer ring", () => {
        expect(getPieRings(tree)).toEqual([
            [
                {
                    id: "classwork",
                    name: "Classwork",
                    value: 7000,
                    isFiller: false,
                    hasChildren: true,
                    ...color(1),
                },
                {
                    id: "Exam",
                    name: "Exam",
                    value: 3000,
                    isFiller: false,
                    hasChildren: false,
                    ...color(2),
                },
            ],
            [
                {
                    id: "AT",
                    name: "AT",
                    value: 4900,
                    isFiller: false,
                    hasChildren: false,
                    ...color(1),
                },
                {
                    id: "TLA",
                    name: "TLA",
                    value: 2100,
                    isFiller: false,
                    hasChildren: false,
                    ...color(3),
                },
                {
                    id: "Exam",
                    name: "Exam",
                    value: 3000,
                    isFiller: true,
                    hasChildren: false,
                    ...color(2),
                },
            ],
        ]);
        expect(getPieRings(root([]))).toEqual([]);
        expect(getPieRings(null)).toEqual([]);
    });
});

describe("ids, usage and search", () => {
    it("nextId continues from the highest number", () => {
        expect(nextId([{ id: "CR-1" }, { id: "CR-7" }, { id: "CR-3" }], "CR")).toBe("CR-8");
        expect(nextId([{ id: "C101" }], "C")).toBe("C-102");
        expect(nextId([{ id: "abc" }, {}], "X")).toBe("X-1");
        expect(nextId([], "SUB")).toBe("SUB-1");
        expect(nextId(null, "REQ")).toBe("REQ-1");
    });

    it("getRuleUsage lists everything that points to a rule", () => {
        expect(getRuleUsage(makeSeedDb(), "CR-1")).toEqual({
            classes: [
                {
                    classId: "C101",
                    subjectCode: "IT101",
                    subjectName: "Computer Systems Servicing",
                    programSection: "BSIT-2A",
                },
            ],
            subjectIds: ["SUB-1"],
            requestIds: ["REQ-1"],
            isUsed: true,
        });
        expect(getRuleUsage(makeSeedDb(), "CR-9")).toEqual({
            classes: [],
            subjectIds: [],
            requestIds: [],
            isUsed: false,
        });
        expect(getRuleUsage(null, "CR-1").isUsed).toBe(false);
    });

    it("getRuleUsage names a class whose subject is missing", () => {
        const db = makeSeedDb();
        db.subjects = [];
        expect(getRuleUsage(db, "CR-1").classes[0]).toMatchObject({
            subjectCode: "Unknown subject",
            subjectName: "",
        });
    });

    it("searchRules matches the name, tags and schools, ignoring case", () => {
        const rules = makeTwoRuleDb().computationRules;
        expect(searchRules(rules, "STANDARD").map((rule) => rule.id)).toEqual(["CR-1"]);
        expect(searchRules(rules, "undergrad").map((rule) => rule.id)).toEqual(["CR-1"]);
        expect(searchRules(rules, "graduate").map((rule) => rule.id)).toEqual(["CR-1", "CR-2"]);
        expect(searchRules(rules, "immaculate").map((rule) => rule.id)).toEqual(["CR-1"]);
        expect(searchRules(rules, "xyz")).toEqual([]);
        expect(searchRules(rules, "  ")).toBe(rules);
        expect(searchRules(null, "a")).toEqual([]);
        expect(searchRules(null, "")).toEqual([]);
    });
});

describe("rule details", () => {
    it('getCopyName finds a free "(Copy)" name', () => {
        const db = makeSeedDb();
        expect(getCopyName(db, "Standard IT Rule (70/30)")).toBe("Standard IT Rule (70/30) (Copy)");
        db.computationRules.push({ id: "CR-2", ruleName: "standard it rule (70/30) (copy)" });
        expect(getCopyName(db, "Standard IT Rule (70/30)")).toBe(
            "Standard IT Rule (70/30) (Copy 2)",
        );
        db.computationRules.push({ id: "CR-3", ruleName: "Standard IT Rule (70/30) (Copy 2)" });
        expect(getCopyName(db, "Standard IT Rule (70/30)")).toBe(
            "Standard IT Rule (70/30) (Copy 3)",
        );
    });

    it("validateRuleDetails cleans the name, tags and schools", () => {
        const input = {
            ruleName: "  New Rule  ",
            tags: ["Graduate", "Graduate"],
            schools: [" UIC ", "uic", "", null, "ADDU"],
        };
        expect(validateRuleDetails(makeSeedDb(), input)).toEqual({
            ok: true,
            errors: {},
            values: { ruleName: "New Rule", tags: ["Graduate"], schools: ["UIC", "ADDU"] },
        });
    });

    it("validateRuleDetails reports a missing or duplicate name and unknown tags", () => {
        const db = makeSeedDb();
        expect(validateRuleDetails(db, { ruleName: " " }).errors).toEqual({
            ruleName: "Enter a rule name.",
        });
        expect(validateRuleDetails(db, { ruleName: "standard it rule (70/30)" }).errors).toEqual({
            ruleName: 'A rule named "standard it rule (70/30)" already exists.',
        });
        expect(validateRuleDetails(db, { ruleName: "standard it rule (70/30)" }, "CR-1").ok).toBe(
            true,
        );
        expect(
            validateRuleDetails(db, { ruleName: "X", tags: ["PhD", "Graduate", "Other"] }),
        ).toMatchObject({
            ok: false,
            errors: { tags: "Unknown tag: PhD, Other." },
        });
    });

    it("isCopiedRule recognises copies by flag, source id or name", () => {
        expect(isCopiedRule({ isCopy: true })).toBe(true);
        expect(isCopiedRule({ copiedFromRuleId: "CR-1" })).toBe(true);
        expect(isCopiedRule({ ruleName: "Rule (Copy)" })).toBe(true);
        expect(isCopiedRule({ ruleName: "Rule (copy 3)" })).toBe(true);
        expect(isCopiedRule({ ruleName: "Rule(Copy)" })).toBe(false);
        expect(isCopiedRule({ ruleName: "Copy of Rule" })).toBe(false);
        expect(isCopiedRule({})).toBe(false);
        expect(isCopiedRule(null)).toBe(false);
    });
});

describe("creating, updating and duplicating rules", () => {
    const input = () => ({
        ruleName: "New Rule",
        tags: ["Graduate"],
        schools: ["UIC"],
        tree: createStandardTree(),
    });

    it("createRule adds a rule with the next id", () => {
        const db = makeSeedDb();
        const result = createRule(db, input());
        expect(result).toMatchObject({ ok: true, errors: {}, error: "" });
        expect(result.rule).toEqual({
            id: "CR-2",
            ruleName: "New Rule",
            tags: ["Graduate"],
            schools: ["UIC"],
            criteria: makeStandardRule().criteria,
            effectiveMultipliers: { AT: 0.49, TLA: 0.21, Exam: 0.3 },
        });
        expect(result.db.computationRules).toEqual([db.computationRules[0], result.rule]);
        expect(db.computationRules).toHaveLength(1);
    });

    it("createRule reports invalid details or an invalid tree and returns the same database", () => {
        const db = makeSeedDb();
        expect(createRule(db, { ...input(), ruleName: "" })).toEqual({
            ok: false,
            db,
            rule: null,
            errors: { ruleName: "Enter a rule name." },
            error: "Enter a rule name.",
        });
        expect(createRule(db, { ...input(), tree: root([]) })).toMatchObject({
            ok: false,
            errors: { tree: "Add at least one criterion." },
            error: "Add at least one criterion.",
        });
    });

    it("updateRule replaces the details and the maths, and keeps the id", () => {
        const db = makeSeedDb();
        const tree = setCriterionShare(createStandardTree(), "classwork", 6000).tree;
        const result = updateRule(db, "CR-1", { ruleName: "Renamed", tags: [], schools: [], tree });
        expect(result.ok).toBe(true);
        expect(result.rule).toMatchObject({
            id: "CR-1",
            ruleName: "Renamed",
            tags: [],
            schools: [],
        });
        expect(result.rule.effectiveMultipliers).toEqual({ AT: 0.42, TLA: 0.18, Exam: 0.4 });
        expect(result.rule.criteria.map((criterion) => criterion.weight)).toEqual([0.6, 0.4]);
        expect(result.rule).not.toHaveProperty("isCopy");
        expect(result.db.computationRules).toEqual([result.rule]);
        expect(db.computationRules[0].ruleName).toBe("Standard IT Rule (70/30)");
    });

    it("updateRule lets a rule keep its own name, drops the legacy hierarchy and marks copies", () => {
        const db = makeSeedDb();
        db.computationRules[0].hierarchy = { classwork: 0.7, classworkSplit: { AT: 0.7 } };
        db.computationRules[0].copiedFromRuleId = "CR-0";
        const result = updateRule(db, "CR-1", { ...input(), ruleName: "Standard IT Rule (70/30)" });
        expect(result.ok).toBe(true);
        expect(result.rule).not.toHaveProperty("hierarchy");
        expect(result.rule).toMatchObject({ isCopy: true, copiedFromRuleId: "CR-0" });
    });

    it("updateRule reports a missing rule and invalid input", () => {
        const db = makeSeedDb();
        expect(updateRule(db, "CR-9", input())).toEqual({
            ok: false,
            db,
            rule: null,
            errors: { rule: "This rule no longer exists." },
            error: "This rule no longer exists.",
        });
        expect(updateRule(db, "CR-1", { ...input(), tags: ["PhD"] })).toMatchObject({
            ok: false,
            rule: null,
            error: "Unknown tag: PhD.",
        });
    });

    it("duplicateRule adds a marked copy", () => {
        const db = makeSeedDb();
        const result = duplicateRule(db, "CR-1");
        expect(result).toMatchObject({ ok: true, error: "" });
        expect(result.rule).toEqual({
            ...db.computationRules[0],
            id: "CR-2",
            ruleName: "Standard IT Rule (70/30) (Copy)",
            copiedFromRuleId: "CR-1",
            isCopy: true,
        });
        expect(result.rule.criteria).not.toBe(db.computationRules[0].criteria);
        expect(result.db.computationRules).toHaveLength(2);
        expect(duplicateRule(db, "CR-9")).toEqual({
            ok: false,
            db,
            rule: null,
            error: "This rule no longer exists.",
        });
    });
});

describe("deleteRule", () => {
    it("never deletes the last rule, or a rule that does not exist", () => {
        const db = makeSeedDb();
        expect(deleteRule(db, "CR-1")).toEqual({
            ok: false,
            db,
            error: "At least one grade computation rule must exist.",
        });
        expect(deleteRule(db, "CR-9")).toEqual({
            ok: false,
            db,
            error: "This rule no longer exists.",
        });
    });

    it("needs a valid replacement when the rule is in use", () => {
        const db = makeTwoRuleDb();
        expect(deleteRule(db, "CR-1").error).toBe("Choose the rule these subjects will use next.");
        expect(deleteRule(db, "CR-1", "CR-1").error).toBe(
            "Choose a different rule that still exists.",
        );
        expect(deleteRule(db, "CR-1", "CR-9").error).toBe(
            "Choose a different rule that still exists.",
        );
    });

    it("moves classes, subject defaults and requests to the replacement", () => {
        const result = deleteRule(makeTwoRuleDb(), "CR-1", "CR-2");
        expect(result).toMatchObject({ ok: true, error: "" });
        expect(result.db.computationRules.map((rule) => rule.id)).toEqual(["CR-2"]);
        expect(result.db.classes[0].computationRuleId).toBe("CR-2");
        expect(result.db.subjects[0].defaultComputationRuleId).toBe("CR-2");
        expect(result.db.verificationQueue[0].computationRuleId).toBe("CR-2");
    });

    it("deletes an unused rule without a replacement", () => {
        const db = makeTwoRuleDb();
        const result = deleteRule(db, "CR-2");
        expect(result.ok).toBe(true);
        expect(result.db.computationRules.map((rule) => rule.id)).toEqual(["CR-1"]);
        expect(result.db.classes).toEqual(db.classes);
    });
});

describe("impact of rule changes on recorded tasks", () => {
    it("getRuleChangeImpact counts tasks under criteria the new tree no longer has", () => {
        const db = makeSeedDb();
        const unchanged = getRuleChangeImpact(db, "CR-1", createStandardTree());
        expect(unchanged).toEqual({
            classes: getRuleUsage(db, "CR-1").classes,
            lostTasks: [],
            lostTaskCount: 0,
        });

        const withoutTla = deleteCriterion(createStandardTree(), "TLA").tree;
        expect(getRuleChangeImpact(db, "CR-1", withoutTla)).toMatchObject({
            lostTasks: [{ criterionId: "TLA", name: "TLA", count: 1 }],
            lostTaskCount: 1,
        });
    });

    it("a split keeps the tasks, because the subcriterion keeps the id", () => {
        const split = splitCriterion(createStandardTree(), "Exam").tree;
        expect(getRuleChangeImpact(makeSeedDb(), "CR-1", split).lostTaskCount).toBe(0);
    });

    it("counts tasks in every term and names criteria that are no longer in the rule", () => {
        const db = makeSeedDb();
        const grades = db.classes[0].studentRecords[0].grades;
        grades.midterm.AT = [makeTask("m1", 10, 5)];
        grades.finals.Old = [makeTask("o1", 10, 5), makeTask("o2", 10)];
        const withoutAt = deleteCriterion(createStandardTree(), "AT").tree;
        expect(getRuleChangeImpact(db, "CR-1", withoutAt)).toMatchObject({
            lostTasks: [
                { criterionId: "AT", name: "AT", count: 3 },
                { criterionId: "Old", name: "Removed criterion", count: 2 },
            ],
            lostTaskCount: 5,
        });
    });

    it("getRuleSwitchImpact counts tasks the replacement rule has no criterion for", () => {
        const db = makeTwoRuleDb();
        expect(getRuleSwitchImpact(db, "CR-1", "CR-2")).toEqual({
            lostTasks: [
                { criterionId: "AT", name: "AT", count: 2 },
                { criterionId: "TLA", name: "TLA", count: 1 },
                { criterionId: "Exam", name: "Exam", count: 1 },
            ],
            lostTaskCount: 4,
        });
        expect(getRuleSwitchImpact(db, "CR-1", "CR-9").lostTaskCount).toBe(4);
    });

    it("getRuleSwitchImpact is 0 when the replacement has the same criteria", () => {
        const db = duplicateRule(makeSeedDb(), "CR-1").db;
        expect(getRuleSwitchImpact(db, "CR-1", "CR-2")).toEqual({
            lostTasks: [],
            lostTaskCount: 0,
        });
    });
});

describe("weightToShare", () => {
    it("turns a fraction into hundredths of a percent", () => {
        expect(weightToShare(0.7)).toBe(7000);
        expect(weightToShare(1 / 3)).toBe(3333);
        expect(weightToShare(1)).toBe(TOTAL_SHARE);
    });
});

describe("getHandleRatio", () => {
    it("adds the shares before the divider to the left criterion's new share", () => {
        const children = [{ share: 2000 }, { share: 3000 }, { share: 5000 }];
        expect(getHandleRatio(children, 0, 2500)).toBe(0.25);
        expect(getHandleRatio(children, 1, 4000)).toBe(0.6);
    });
});
