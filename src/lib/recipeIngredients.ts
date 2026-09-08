import type { RecipeVersion, StageIngredient } from './types';

export interface AggregatedIngredient {
    ingredient: StageIngredient;
    /** Absent for qualitative amounts ("to taste"). */
    quantity?: number;
    measurement?: string;
    /** Distinct hints seen on the summed inputs, in first-seen order. */
    hints: string[];
}

export interface AggregateOptions {
    /** Include inputs that are themselves recipes. The cart leaves them out. */
    includeRecipeIngredients?: boolean;
}

/**
 * Sums every ingredient input of a version by name and measurement, in first-seen
 * order. Quantified and qualitative uses of the same ingredient stay separate entries.
 */
export function aggregateIngredients(version: RecipeVersion, options: AggregateOptions = {}): AggregatedIngredient[] {
    const includeRecipes = options.includeRecipeIngredients ?? true;
    const entries = new Map<string, AggregatedIngredient>();

    for (const table of version.Tables) {
        for (const stage of table.Stages) {
            for (const input of stage.Inputs) {
                if (input.Type !== 'ingredient') continue;
                if (!includeRecipes && input.Ingredient.IsRecipe) continue;

                const quantified = input.Quantity !== undefined && input.Measurement !== undefined;
                const key = `${input.Ingredient.IngredientName.toLowerCase()}|${quantified ? input.Measurement : ''}`;
                const existing = entries.get(key);

                if (existing) {
                    if (quantified && existing.quantity !== undefined) {
                        existing.quantity += input.Quantity as number;
                    }
                    if (input.Hint && !existing.hints.includes(input.Hint)) {
                        existing.hints.push(input.Hint);
                    }
                    continue;
                }

                entries.set(key, {
                    ingredient: { ...input.Ingredient },
                    quantity: quantified ? input.Quantity : undefined,
                    measurement: quantified ? input.Measurement : undefined,
                    hints: input.Hint ? [input.Hint] : [],
                });
            }
        }
    }

    return [...entries.values()];
}
