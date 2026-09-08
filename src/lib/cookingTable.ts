import { padStep } from './format';
import type { RecipeStage, RecipeTable, RecipeVersion, StageIngredientInput, StageReferenceInput } from './types';

/**
 * Computes the Cooking-for-Engineers grid for a whole recipe.
 *
 * Column 0 holds ingredients (one row each); every stage is a block to the right of
 * its inputs, spanning their rows; the finished dish is one more column spanning
 * everything. Nothing about the layout is stored in the data — it is derived here
 * from the stage graph, so the function is pure and portion-independent.
 */

export interface Step {
    /** 1-based position in document order across all tables; setup stages count. */
    step: number;
    stage: RecipeStage;
    table: RecipeTable;
}

export interface IngredientCell {
    kind: 'ingredient';
    row: number;
    col: 0;
    rowSpan: 1;
    input: StageIngredientInput;
}

/** A later use of a stage that is already drawn elsewhere (a reserved part, or a table result used again). */
export interface ReferenceCell {
    kind: 'reference';
    row: number;
    col: 0;
    rowSpan: 1;
    input: StageReferenceInput;
    label: string;
    caption: string;
}

export interface StageCell {
    kind: 'stage';
    row: number;
    col: number;
    rowSpan: number;
    stage: RecipeStage;
    step: number;
    /** Set on the result of every table but the last. */
    tableName?: string;
    /** The `part` named by the reference that inlined this stage ("aromatic base left in the pan"). */
    inPart?: string;
}

/** A setup stage (preheat, line a tray): one full-width row above the flow. */
export interface SetupCell {
    kind: 'setup';
    row: number;
    col: 1;
    rowSpan: 1;
    colSpan: number;
    stage: RecipeStage;
    step: number;
}

export interface DishCell {
    kind: 'dish';
    row: 1;
    col: number;
    rowSpan: number;
}

export type Cell = IngredientCell | ReferenceCell | StageCell | SetupCell | DishCell;

/** A 1px "carried forward, untouched" line across the columns [fromCol, toCol). */
export interface Carry {
    row: number;
    rowSpan: number;
    fromCol: number;
    toCol: number;
}

export interface RecipeLayout {
    rows: number;
    /** Ingredient column + action columns + dish column. */
    cols: number;
    actionCols: number;
    cells: Cell[];
    carries: Carry[];
    steps: Step[];
}

/** Stages in document order across tables, numbered from 1. */
export function flattenSteps(version: RecipeVersion): Step[] {
    const steps: Step[] = [];
    for (const table of version.Tables) {
        for (const stage of table.Stages) {
            steps.push({ step: steps.length + 1, stage, table });
        }
    }
    return steps;
}

/** The half-open row range a cell covers. */
export function bandOf(cell: Cell): [number, number] {
    return [cell.row, cell.row + cell.rowSpan];
}

function referenceId(consumerKey: string, inputIndex: number): string {
    return `${consumerKey}#${inputIndex}`;
}

export function layoutRecipe(version: RecipeVersion): RecipeLayout {
    const steps = flattenSteps(version);
    if (steps.length === 0) throw new Error('Recipe has no stages');

    const byKey = new Map<string, Step>();
    for (const step of steps) {
        if (byKey.has(step.stage.StageKey)) throw new Error(`Duplicate stage id '${step.stage.StageKey}'`);
        byKey.set(step.stage.StageKey, step);
    }

    // A stage is drawn once, under the first reference to it in document order. Every
    // other reference becomes a one-row reference cell. Keyed per reference, not per
    // consumer: one stage may legally use the same source twice with different parts.
    const firstReference = new Map<string, string>();
    for (const step of steps) {
        step.stage.Inputs.forEach((input, index) => {
            if (input.Type === 'stage' && !firstReference.has(input.SourceStageKey)) {
                firstReference.set(input.SourceStageKey, referenceId(step.stage.StageKey, index));
            }
        });
    }

    const tableNames = new Map<string, string>();
    for (const table of version.Tables.slice(0, -1)) {
        const result = table.Stages[table.Stages.length - 1];
        if (result) tableNames.set(result.StageKey, table.TableName);
    }

    const setupSteps = steps.filter(step => step.stage.Setup);
    const root = steps[steps.length - 1];
    if (root.stage.Setup) throw new Error('The last stage of a recipe cannot be a setup stage');

    const cells: Cell[] = [];
    const carries: Carry[] = [];
    const placed = new Set<string>();
    /** Rows whose ingredient column is legitimately empty. */
    const leadlessRows = new Set<number>();

    function place(step: Step, startRow: number): { rows: number; col: number; cell: StageCell } {
        const { stage } = step;
        if (stage.Setup) throw new Error(`Setup stage '${stage.StageKey}' cannot be used as an input`);
        if (placed.has(stage.StageKey)) throw new Error(`Stage '${stage.StageKey}' was placed twice`);
        placed.add(stage.StageKey);

        let row = startRow;
        const children: Array<{ row: number; rowSpan: number; col: number }> = [];

        stage.Inputs.forEach((input, index) => {
            if (input.Type === 'ingredient') {
                cells.push({ kind: 'ingredient', row, col: 0, rowSpan: 1, input });
                children.push({ row, rowSpan: 1, col: 0 });
                row += 1;
                return;
            }

            const source = byKey.get(input.SourceStageKey);
            if (!source) throw new Error(`Stage '${stage.StageKey}' references unknown stage '${input.SourceStageKey}'`);

            if (firstReference.get(input.SourceStageKey) === referenceId(stage.StageKey, index)) {
                const sub = place(source, row);
                if (input.Part) sub.cell.inPart = input.Part;
                children.push({ row, rowSpan: sub.rows, col: sub.col });
                row += sub.rows;
                return;
            }

            cells.push({
                kind: 'reference',
                row,
                col: 0,
                rowSpan: 1,
                input,
                label: input.Part ?? source.stage.Action,
                caption: `from ${padStep(source.step)} · ${source.stage.Action}`,
            });
            children.push({ row, rowSpan: 1, col: 0 });
            row += 1;
        });

        if (children.length === 0) {
            // Legal but absent from the corpus: an action with nothing going in. Give it a row.
            leadlessRows.add(row);
            row += 1;
        }

        const col = children.reduce((max, child) => Math.max(max, child.col + 1), 1);
        const cell: StageCell = {
            kind: 'stage',
            row: startRow,
            col,
            rowSpan: row - startRow,
            stage,
            step: step.step,
            tableName: tableNames.get(stage.StageKey),
        };
        cells.push(cell);

        for (const child of children) {
            if (child.col + 1 < col) {
                carries.push({ row: child.row, rowSpan: child.rowSpan, fromCol: child.col + 1, toCol: col });
            }
        }

        return { rows: row - startRow, col, cell };
    }

    const flowStart = setupSteps.length + 1;
    const rootPlacement = place(root, flowStart);
    const actionCols = rootPlacement.col;

    setupSteps.forEach((step, index) => {
        cells.push({ kind: 'setup', row: index + 1, col: 1, rowSpan: 1, colSpan: actionCols, stage: step.stage, step: step.step });
        leadlessRows.add(index + 1);
    });

    const rows = setupSteps.length + rootPlacement.rows;
    const cols = actionCols + 2;
    cells.push({ kind: 'dish', row: 1, col: actionCols + 1, rowSpan: rows });

    for (const step of steps) {
        if (!step.stage.Setup && !placed.has(step.stage.StageKey)) {
            throw new Error(`Stage '${step.stage.StageKey}' is not reachable from the finished dish`);
        }
    }
    verifyCoverage(rows, cols, cells, carries, leadlessRows);

    return { rows, cols, actionCols, cells, carries, steps };
}

/** Every grid position must be covered exactly once (cells or carry lines), except the ingredient column of rows that have none. */
function verifyCoverage(rows: number, cols: number, cells: Cell[], carries: Carry[], leadlessRows: Set<number>) {
    const grid: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

    const mark = (row: number, rowSpan: number, fromCol: number, toCol: number, what: string) => {
        for (let r = row; r < row + rowSpan; r++) {
            for (let c = fromCol; c < toCol; c++) {
                if (r < 1 || r > rows || c < 0 || c >= cols) {
                    throw new Error(`${what} falls outside the grid at row ${r}, column ${c}`);
                }
                grid[r - 1][c] += 1;
            }
        }
    };

    for (const cell of cells) {
        const colSpan = cell.kind === 'setup' ? cell.colSpan : 1;
        mark(cell.row, cell.rowSpan, cell.col, cell.col + colSpan, `${cell.kind} cell`);
    }
    for (const carry of carries) {
        mark(carry.row, carry.rowSpan, carry.fromCol, carry.toCol, 'carry line');
    }

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const expected = c === 0 && leadlessRows.has(r + 1) ? 0 : 1;
            if (grid[r][c] !== expected) {
                throw new Error(`Layout ${grid[r][c] > expected ? 'overlap' : 'gap'} at row ${r + 1}, column ${c}`);
            }
        }
    }
}
