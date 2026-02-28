import { ParsingException } from "$lib/types";
import yaml from "yaml";
import type { ParsedRecipe } from "./recipeService";

interface RecipeYAML {
    meta?: {
        description?: string;
        source?: string;
        cuisine?: string;
    };
    portion: {
        quantity: number;
        descriptor: string;
        active_time_minutes: number;
        passive_time_minutes: number;
        complexity_rating: number;
        mayhem_rating: number;
    };
    tags?: string[];
    ingredients: Array<{
        name: string;
        quantity: number;
        measurement: string;
        prep?: string;
        sub?: string;
    }>;
    pantry?: Array<{
        name: string;
        quantity: number;
        measurement: string;
    }>;
    items: Array<{
        name: string;
        quantity: number;
    }>;
    instructions: string[];
    note?: string[];
}

function validatePortion(portion: unknown): portion is RecipeYAML['portion'] {
    if (typeof portion !== 'object' || portion === null) return false;
    const p = portion as Record<string, unknown>;
    return (
        typeof p.quantity === 'number' &&
        typeof p.descriptor === 'string' &&
        typeof p.active_time_minutes === 'number' &&
        typeof p.passive_time_minutes === 'number' &&
        typeof p.complexity_rating === 'number' &&
        typeof p.mayhem_rating === 'number'
    );
}

function validateIngredients(ingredients: unknown): ingredients is RecipeYAML['ingredients'] {
    if (!Array.isArray(ingredients)) return false;
    return ingredients.every(ing => {
        if (typeof ing !== 'object' || ing === null) return false;
        const i = ing as Record<string, unknown>;
        return (
            typeof i.name === 'string' &&
            typeof i.quantity === 'number' &&
            typeof i.measurement === 'string' &&
            (i.prep === undefined || typeof i.prep === 'string') &&
            (i.sub === undefined || typeof i.sub === 'string')
        );
    });
}

function validatePantry(pantry: unknown): pantry is NonNullable<RecipeYAML['pantry']> {
    if (!Array.isArray(pantry)) return false;
    return pantry.every(p => {
        if (typeof p !== 'object' || p === null) return false;
        const item = p as Record<string, unknown>;
        return typeof item.name === 'string' && typeof item.quantity === 'number' && typeof item.measurement === 'string';
    });
}

function validateItems(items: unknown): items is RecipeYAML['items'] {
    if (!Array.isArray(items)) return false;
    return items.every(item => {
        if (typeof item !== 'object' || item === null) return false;
        const i = item as Record<string, unknown>;
        return typeof i.name === 'string' && typeof i.quantity === 'number';
    });
}

function validateInstructions(instructions: unknown): instructions is string[] {
    return Array.isArray(instructions) && instructions.every(s => typeof s === 'string');
}

function validateRecipeFormat(data: unknown): data is RecipeYAML {
    if (typeof data !== 'object' || data === null) return false;
    const d = data as Record<string, unknown>;

    if (!('portion' in d) || !validatePortion(d.portion)) return false;
    if (!('ingredients' in d) || !validateIngredients(d.ingredients)) return false;
    if (!('items' in d) || !validateItems(d.items)) return false;
    if (!('instructions' in d) || !validateInstructions(d.instructions)) return false;

    if ('tags' in d && !(Array.isArray(d.tags) && d.tags.every(t => typeof t === 'string'))) return false;
    if ('pantry' in d && !validatePantry(d.pantry)) return false;
    if ('note' in d && !(Array.isArray(d.note) && d.note.every(n => typeof n === 'string'))) return false;

    return true;
}

export function parseRecipeYAML(recipeData: string): ParsedRecipe {
    const parsedYaml = yaml.parse(recipeData);

    if (!validateRecipeFormat(parsedYaml)) {
        throw new ParsingException('Invalid recipe format');
    }

    return {
        Meta: {
            Description: parsedYaml.meta?.description || '',
            Source: parsedYaml.meta?.source || '',
            Cuisine: parsedYaml.meta?.cuisine || '',
            PortionQuantity: parsedYaml.portion.quantity,
            PortionDescriptor: parsedYaml.portion.descriptor,
            ActiveTimeMinutes: parsedYaml.portion.active_time_minutes,
            PassiveTimeMinutes: parsedYaml.portion.passive_time_minutes,
            ComplexityRating: parsedYaml.portion.complexity_rating,
            MayhemRating: parsedYaml.portion.mayhem_rating,
        },
        Tags: parsedYaml.tags || [],
        Ingredients: parsedYaml.ingredients.map(ingredient => ({
            IngredientName: ingredient.name,
            Quantity: ingredient.quantity,
            Measurement: ingredient.measurement,
            Prep: ingredient.prep,
            Sub: ingredient.sub,
        })),
        PantryIngredients: (parsedYaml.pantry || []).map(p => ({
            IngredientName: p.name,
        })),
        Items: parsedYaml.items.map(item => ({
            ItemName: item.name,
            Quantity: item.quantity,
        })),
        Instructions: parsedYaml.instructions,
        Notes: parsedYaml.note || [],
    };
}
