import { ItemNotFoundException, ParsingException } from "../types";
import { DatabaseService } from "./databaseService";
import type { IngredientRaw, RecipeVersionRaw, RequiredItemRaw } from "./databaseTypes";

interface ParsedRecipe {
    meta: Partial<RecipeVersionRaw>;
    ingredients: Array<{
        IngredientName: string;
        Quantity: number;
        Measurement: string;
    }>;
    items: Array<{
        ItemName: string;
        Quantity: number;
    }>;
    instructions: Array<{
        StepNumber: number;
        StepDetail: string;
    }>;
}

// Parse the recipe text into structured data
function parseRecipeText(input: string): ParsedRecipe {
    // Split the sections
    const sections = input.split('INSTRUCTIONS');
    const preInstructionSections = sections[0].split('ITEMS');
    const metaSection = preInstructionSections[0].split('INGREDIENTS')[0].trim();
    const ingredientSection = preInstructionSections[0].split('INGREDIENTS')[1].trim();
    const itemSection = preInstructionSections[1].trim();
    const instructionSection = sections[1].trim();

    if (!metaSection || !ingredientSection || !itemSection || !instructionSection) {
        throw new ParsingException('Invalid recipe format');
    }

    // Process Meta Section
    const metaValues = metaSection.split(';;').map(s => s.trim());
    if (metaValues.length !== 7) {
        throw new ParsingException('Invalid meta section');
    }
    const meta = {
        PortionQuantity: parseFloat(metaValues[0]),
        PortionDescriptor: metaValues[1],
        ActiveTimeMinutes: parseInt(metaValues[2], 10),
        PassiveTimeMinutes: parseInt(metaValues[3], 10),
        ComplexityRating: parseInt(metaValues[4], 10),
        MayhemRating: parseInt(metaValues[5], 10)
    };

    // Process Ingredients
    const ingredientValues = ingredientSection.split(';;').filter(Boolean);
    const ingredients = ingredientValues.map(value => {
        const [name, quantity, measurement] = value.split('::').map(s => s.trim());
        return {
            IngredientName: name,
            Quantity: parseFloat(quantity),
            Measurement: measurement
        };
    });

    // Process Items
    const itemValues = itemSection.split(';;').filter(Boolean);
    const items = itemValues.map(value => {
        const [name, quantity] = value.split('::').map(s => s.trim());
        return {
            ItemName: name,
            Quantity: parseInt(quantity, 10)
        };
    });

    // Process Instructions
    const instructionValues = instructionSection.split(';;').filter(Boolean);
    const instructions = instructionValues.map(value => {
        const [stepNumber, detail] = value.split('::').map(s => s.trim());
        return {
            StepNumber: parseInt(stepNumber, 10),
            StepDetail: detail
        };
    });

    // Return the structured recipe
    return {
        meta,
        ingredients,
        items,
        instructions
    };
}


async function insertRecipeVersionFromString(parsedRecipe: ParsedRecipe): Promise<number> {
    const { meta, ingredients, items, instructions } = parsedRecipe;

    // Insert Meta and get the inserted recipe version ID
    const insertedVersionId = await DatabaseService.insertRecipeVersion(meta);

    // Insert Ingredients
    for (const parsedIngredient of ingredients) {
        let ingredient: IngredientRaw;
        try {
            ingredient = await DatabaseService.getIngredientByName(parsedIngredient.IngredientName);
        } catch (e: unknown) {
            if (e instanceof ItemNotFoundException) {
                const ingredientId = await DatabaseService.insertIngredient({ IngredientName: parsedIngredient.IngredientName });
                ingredient = await DatabaseService.getIngredientById(ingredientId);
            } else {
                throw e;
            }
        }

        await DatabaseService.insertRecipeVersionIngredient({
            IngredientID: ingredient.IngredientID,
            RecipeVersionID: insertedVersionId,
            Quantity: parsedIngredient.Quantity,
            Measurement: parsedIngredient.Measurement
        });
    }

    // Insert Items
    for (const parsedItem of items) {
        let item: RequiredItemRaw;
        try {
            item = await DatabaseService.getItemByName(parsedItem.ItemName);
        } catch (e: unknown) {
            if (e instanceof ItemNotFoundException) {
                const itemId = await DatabaseService.insertItem({ ItemName: parsedItem.ItemName });
                item = await DatabaseService.getItemById(itemId);
            } else {
                throw e;
            }
        }

        await DatabaseService.insertRecipeVersionItem({
            ItemID: item.ItemID,
            RecipeVersionID: insertedVersionId,
            Quantity: parsedItem.Quantity
        });
    }

    // Insert Instructions
    for (const instruction of instructions) {
        await DatabaseService.insertInstruction({
            RecipeVersionID: insertedVersionId,
            StepNumber: instruction.StepNumber,
            StepDetail: instruction.StepDetail
        });
    }

    return insertedVersionId;
}

function validateString(s: string): boolean {
    const metaSectionRegex = /^\d+(\.\d+)? ;; .* ;; \d+(\.\d+)? ;; \d+(\.\d+)? ;; ([1-5]) ;; ([1-5]) ;;\s*INGREDIENTS\s*/;
    const ingredientRegex = /.* :: \d+(\.\d+)? :: .* ;;\s*/g;
    const itemRegex = /ITEMS\s*([^0-9]+ :: \d+(\.\d+)? ;;\s*)+/;
    const instructionRegex = /INSTRUCTIONS\s*(\d+ :: .* ;;\s*)+/;

    const portionSectionMatch = s.match(metaSectionRegex);
    if (!portionSectionMatch) {
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

export async function processAndInsertRecipeFromString(recipeName: string, input: string): Promise<number> {
    if (!validateString(input)) {
        throw new ParsingException('Invalid recipe format');
    }

    const parsedRecipe = parseRecipeText(input);
    const versionId = await insertRecipeVersionFromString(parsedRecipe);
    return await DatabaseService.insertRecipe({ RecipeName: recipeName, MainVersionID: versionId });
}
