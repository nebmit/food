import type { RecipeIngredient } from "./types";

export function parseInstruction(
    instruction: string,
    ingredients: RecipeIngredient[]
): string {
    return parseInstructionScaled(instruction, ingredients, 1);
}

function replaceSimpleIngredients(
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
                    const calculatedQuantityRounded = Math.round(calculatedQuantity * 100) / 100;
                    return `${calculatedQuantityRounded} ${ingredient.Measurement || ""} ${ingredientName}`; // If percentage, also return quantity and measurement.
                }
                return ingredientName; // If no percentage, just return the ingredient name.
            }
            return match; // If no ingredient found, return the match unchanged.
        }
    );
}

function replaceFlexibleIngredients(
    instruction: string,
    scalingFactor: number
): string {
    const ingredientRegex = /\{([^}]*?(\d+)([^}]*?))\}/g;

    return instruction.replace(ingredientRegex, (match, content, number) => {
        const originalNumber = parseInt(number, 10); // Parse the number to an integer
        const scaledNumber = Math.round(originalNumber * scalingFactor); // Scale the number by the scalingFactor
        return content.replace(number, scaledNumber.toString()); // Replace the original number with the scaled number
    });
}


export function parseInstructionScaled(
    instruction: string,
    ingredients: RecipeIngredient[],
    scalingFactor: number
): string {
    let parsedInstruction = replaceSimpleIngredients(instruction, ingredients, scalingFactor);
    parsedInstruction = replaceFlexibleIngredients(parsedInstruction, scalingFactor);

    return parsedInstruction;
}
