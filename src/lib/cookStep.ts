import type { RecipeLayout, StageCell } from './cookingTable';
import { padStep } from './format';
import type { RecipeStage, StageIngredientInput } from './types';

/**
 * The readable form of one cook-mode step: what to do, what goes in now, and what
 * already-prepared components it builds on. Derived from the layout rather than the
 * raw stage list so that "goes in now" matches exactly the rows the grid highlights.
 */

export interface CookSource {
    step: number;
    /** `04 · Cook`. */
    label: string;
}

export interface CookStep {
    step: number;
    stage: RecipeStage;
    /** The table this step belongs to — "RICE", "BAKE". */
    where: string;
    /** This stage's own ingredient inputs, in document order. */
    adds: StageIngredientInput[];
    /** The prepared inputs it consumes. */
    from: CookSource[];
    /** Grid rows to highlight; the same rows `adds` and `from`'s reference cells occupy. */
    rows: number[];
    durationMinutes?: number;
}

export function cookSteps(layout: RecipeLayout): CookStep[] {
    const cellByStep = new Map<number, StageCell>();
    for (const cell of layout.cells) {
        if (cell.kind === 'stage') cellByStep.set(cell.step, cell);
    }
    const actionByStep = new Map(layout.steps.map(step => [step.step, step.stage.Action]));

    return layout.steps.map(({ step, stage, table }) => {
        const cell = cellByStep.get(step);
        return {
            step,
            stage,
            where: table.TableName,
            adds: stage.Inputs.filter(
                (input): input is StageIngredientInput => input.Type === 'ingredient',
            ),
            from: (cell?.sourceSteps ?? []).map(source => ({
                step: source,
                label: `${padStep(source)} · ${actionByStep.get(source) ?? ''}`,
            })),
            // A setup stage has no cell in `cellByStep`; it highlights nothing.
            rows: cell?.inputRows ?? [],
            durationMinutes: stage.DurationMinutes,
        };
    });
}
