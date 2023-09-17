import type { RecipeIngredient } from "./types";

export function parseInstruction(
    instruction: string,
    ingredients: RecipeIngredient[]
): string {
    return instruction.replace(
        /\{(?:(\d+(\.\d+)?):)?([\w\s]+)\}/g,
        (match, percentage, _, ingredientName) => {
            const ingredient = ingredients.find(
                (ing) => ing.Ingredient.IngredientName === ingredientName
            );
            if (ingredient) {
                if (percentage) {
                    const calculatedQuantity =
                        ingredient.Quantity * parseFloat(percentage);
                    return `${calculatedQuantity} ${ingredient.Measurement || ""
                        } ${ingredientName}`; // If percentage, also return quantity and measurement.
                }
                return ingredientName; // If no percentage, just return the ingredient name.
            }
            return match; // If no ingredient found, return the match unchanged.
        }
    );
}
