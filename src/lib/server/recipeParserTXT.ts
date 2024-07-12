import { ParsingException } from "../types";
import type { RecipeVersionRaw } from "./databaseTypes";
import type { ParsedRecipe } from "./recipeService";

function parseRecipeText(inputText: string) {
    const recipe: ParsedRecipe = {
        Meta: {
            PortionQuantity: undefined,
            PortionDescriptor: '',
            ActiveTimeMinutes: undefined,
            PassiveTimeMinutes: undefined,
            ComplexityRating: undefined,
            MayhemRating: undefined
        },
        Tags: [],
        Ingredients: [],
        CommonIngredients: [],
        Items: [],
        Instructions: [],
        Note: ''
    };

    let currentSection = null;

    const lines = inputText.split('\n');
    for (const line of lines) {
        // Ignore empty lines and comments
        if (!line.trim() || line.trim().startsWith('#')) {
            continue;
        }

        // Check for section headers
        if (line.toUpperCase() === 'TAGS' || line.toUpperCase() === 'INGREDIENTS' || line.toUpperCase() === 'COMMON INGREDIENTS' || line.toUpperCase() === 'ITEMS' || line.toUpperCase() === 'INSTRUCTIONS' || line.toUpperCase() === 'NOTE') {
            currentSection = line.toUpperCase();
            continue;
        }

        switch (currentSection) {
            case null:
                parseMetaSection(line, recipe.Meta);
                break;
            case 'TAGS':
                recipe.Tags.push(line.trim());
                break;
            case 'INGREDIENTS':
            case 'COMMON INGREDIENTS':
                if (currentSection === 'INGREDIENTS') {
                    recipe.Ingredients.push(parseIngredientLine(line));
                } else {
                    recipe.CommonIngredients.push(parseIngredientLine(line));
                }
                break;
            case 'ITEMS':
                recipe.Items.push(parseItemLine(line));
                break;
            case 'INSTRUCTIONS':
                recipe.Instructions.push(line.trim());
                break;
            case 'NOTE':
                recipe.Note += line.trim() + '\n';
                break;
            default:
                break;
        }
    }

    return recipe;
}

function parseMetaSection(line: string, meta: Partial<RecipeVersionRaw>) {
    const parts = line.split('::').map(part => part.trim());
    if (parts.length === 6) {
        meta.PortionQuantity = parseInt(parts[0]);
        meta.PortionDescriptor = parts[1];
        meta.ActiveTimeMinutes = parseInt(parts[2]);
        meta.PassiveTimeMinutes = parseInt(parts[3]);
        meta.ComplexityRating = parseInt(parts[4]);
        meta.MayhemRating = parseInt(parts[5]);
    }
}

function parseIngredientLine(line: string) {
    const parts = line.split('::').map(part => part.trim());
    return { IngredientName: parts[0], Quantity: parseFloat(parts[1]), Measurement: parts[2] };
}

function parseItemLine(line: string) {
    const parts = line.split('::').map(part => part.trim());
    return { ItemName: parts[0], Quantity: parseInt(parts[1]) };
}


function validateString(s: string): boolean {
    s = s.replaceAll(/.*#.*\n/gm, "");

    const metaSectionRegex = /^\d+(\.\d+)? :: .* :: \d+(\.\d+)? :: \d+(\.\d+)? :: ([1-5]) :: ([1-5])\s*/;
    const ingredientRegex = /INGREDIENTS\s*.* :: \d+(\.\d+)? :: .*\s*/g;
    const itemRegex = /ITEMS\s*([^0-9]+ :: \d+(\.\d+)?\s*)+/;
    const instructionRegex = /INSTRUCTIONS\s*(.*\s*)+/;

    const portionSectionMatch = s.match(metaSectionRegex);
    if (!portionSectionMatch) {
        console.log(s);
        throw new ParsingException('Invalid meta section format');
    }
    s = s.replace(portionSectionMatch[0], '');

    if (!s.match(ingredientRegex)) {
        throw new ParsingException('Invalid ingredient format');
    }
    while (s.match(ingredientRegex)) {
        s = s.replace(ingredientRegex, '');
    }

    const itemsMatch = s.match(itemRegex);
    if (!itemsMatch) {
        throw new ParsingException('Invalid items format');
    }
    s = s.replace(itemsMatch[0], '');

    if (!s.match(instructionRegex)) {
        throw new ParsingException('Invalid instructions format');
    }

    return true;
}

export function parseRecipeTXT(data: string): ParsedRecipe {
    validateString(data);
    return parseRecipeText(data);
}
