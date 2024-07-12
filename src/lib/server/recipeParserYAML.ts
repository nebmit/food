import { ParsingException } from "$lib/types";
import yaml from "yaml";
import { ParsedRecipe } from "./recipeService";

interface RecipeYAML {
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
    }>;
    common_ingredients?: Array<{
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
    return (
        typeof portion === 'object' &&
        portion !== null &&
        'quantity' in portion && typeof (portion as RecipeYAML['portion']).quantity === 'number' &&
        'descriptor' in portion && typeof (portion as RecipeYAML['portion']).descriptor === 'string' &&
        'active_time_minutes' in portion && typeof (portion as RecipeYAML['portion']).active_time_minutes === 'number' &&
        'passive_time_minutes' in portion && typeof (portion as RecipeYAML['portion']).passive_time_minutes === 'number' &&
        'complexity_rating' in portion && typeof (portion as RecipeYAML['portion']).complexity_rating === 'number' &&
        'mayhem_rating' in portion && typeof (portion as RecipeYAML['portion']).mayhem_rating === 'number'
    );
}

function validateIngredients(ingredients: unknown): ingredients is RecipeYAML['ingredients'] {
    return Array.isArray(ingredients) && ingredients.every(ingredient =>
        typeof ingredient === 'object' &&
        ingredient !== null &&
        'name' in ingredient && typeof (ingredient as RecipeYAML['ingredients'][0]).name === 'string' &&
        'quantity' in ingredient && typeof (ingredient as RecipeYAML['ingredients'][0]).quantity === 'number' &&
        'measurement' in ingredient && typeof (ingredient as RecipeYAML['ingredients'][0]).measurement === 'string'
    );
}

function validateItems(items: unknown): items is RecipeYAML['items'] {
    return Array.isArray(items) && items.every(item =>
        typeof item === 'object' &&
        item !== null &&
        'name' in item && typeof (item as RecipeYAML['items'][0]).name === 'string' &&
        'quantity' in item && typeof (item as RecipeYAML['items'][0]).quantity === 'number'
    );
}

function validateInstructions(instructions: unknown): instructions is RecipeYAML['instructions'] {
    return Array.isArray(instructions) && instructions.every(instruction =>
        typeof instruction === 'string'
    );
}

function validateRecipeFormat(data: unknown): data is RecipeYAML {
    return (
        typeof data === 'object' &&
        data !== null &&
        'portion' in data && validatePortion((data as RecipeYAML).portion) &&
        ('tags' in data ? (Array.isArray((data as RecipeYAML).tags) && (data as RecipeYAML).tags!.every(tag => typeof tag === 'string')) : true) &&
        'ingredients' in data && validateIngredients((data as RecipeYAML).ingredients) &&
        ('common_ingredients' in data ? validateIngredients((data as RecipeYAML).common_ingredients) : true) &&
        'items' in data && validateItems((data as RecipeYAML).items) &&
        'instructions' in data && validateInstructions((data as RecipeYAML).instructions) &&
        ('note' in data ? (Array.isArray((data as RecipeYAML).note) && (data as RecipeYAML).note!.every(note => typeof note === 'string')) : true)
    );
}

export function parseRecipeYAML(recipeData: string): ParsedRecipe {
    const parsedYaml = yaml.parse(recipeData);

    if (!validateRecipeFormat(parsedYaml)) {
        throw new ParsingException('Invalid recipe format');
    }

    const parsedRecipe: ParsedRecipe = {
        Meta: {
            PortionQuantity: parsedYaml.portion.quantity,
            PortionDescriptor: parsedYaml.portion.descriptor,
            ActiveTimeMinutes: parsedYaml.portion.active_time_minutes,
            PassiveTimeMinutes: parsedYaml.portion.passive_time_minutes,
            ComplexityRating: parsedYaml.portion.complexity_rating,
            MayhemRating: parsedYaml.portion.mayhem_rating
        },
        Tags: parsedYaml.tags || [],
        Ingredients: parsedYaml.ingredients.map(ingredient => ({
            IngredientName: ingredient.name,
            Quantity: ingredient.quantity,
            Measurement: ingredient.measurement,
        })),
        CommonIngredients: (parsedYaml.common_ingredients || []).map(commonIngredient => ({
            IngredientName: commonIngredient.name,
            Quantity: commonIngredient.quantity,
            Measurement: commonIngredient.measurement,
        })),
        Items: parsedYaml.items.map(item => ({
            ItemName: item.name,
            Quantity: item.quantity,
        })),
        Instructions: parsedYaml.instructions,
        Note: parsedYaml.note ? parsedYaml.note.join('\n') : '',
    };

    return parsedRecipe;
}
