import type { RecipeIngredient } from "./types";

export function parseInstruction(
    instruction: string,
    ingredients: RecipeIngredient[]
): string {
    return parseInstructionScaled(instruction, ingredients, 1);
}

export function parseInstructionScaled(
    instruction: string,
    ingredients: RecipeIngredient[],
    scalingFactor: number
): string {
    return instruction.replace(
        /\{(?:(\d+(\.\d+)?):)?([\w\s-]+)\}/g,
        (match, percentage, _, ingredientName) => {
            const ingredient = ingredients.find(
                (ing) => ing.Ingredient.IngredientName.toLowerCase() === ingredientName.toLowerCase()
            );
            if (ingredient) {
                if (percentage) {
                    const adjustedQuantity = ingredient.Quantity * scalingFactor;
                    const calculatedQuantity = adjustedQuantity * parseFloat(percentage);
                    return `${calculatedQuantity} ${ingredient.Measurement || ""} ${ingredientName}`; // If percentage, also return quantity and measurement.
                }
                return ingredientName; // If no percentage, just return the ingredient name.
            }
            return match; // If no ingredient found, return the match unchanged.
        }
    );
}
