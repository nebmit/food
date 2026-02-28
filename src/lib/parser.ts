import type { RecipeIngredient } from "./types";

const MEASUREMENT_PATTERN = /(\d+(?:\.\d+)?)\s*(grams?|g|ml|teaspoons?|tsp|tablespoons?|tbsp|cloves?|pinch(?:es)?|cans?|bunch(?:es)?|slices?|units?)\b/gi;

export function parseInstruction(
    instruction: string,
    ingredients: RecipeIngredient[]
): string {
    return parseInstructionScaled(instruction, ingredients, 1);
}

/**
 * Highlights ingredient names wrapped in [brackets].
 */
function highlightIngredients(instruction: string): string {
    return instruction.replace(
        /\[([^\]]+)\]/g,
        '<span class="font-semibold text-blue-800">$1</span>'
    );
}

/**
 * Scales numbers that appear directly before a measurement word.
 */
function scaleQuantities(instruction: string, scalingFactor: number): string {
    if (scalingFactor === 1) return instruction;

    return instruction.replace(MEASUREMENT_PATTERN, (_match, num, unit) => {
        const scaled = Math.round(parseFloat(num) * scalingFactor * 100) / 100;
        return `${scaled} ${unit}`;
    });
}

export function parseInstructionScaled(
    instruction: string,
    ingredients: RecipeIngredient[],
    scalingFactor: number
): string {
    let result = scaleQuantities(instruction, scalingFactor);
    result = highlightIngredients(result);
    return result;
}
