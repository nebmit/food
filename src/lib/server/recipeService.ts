import { ItemNotFoundException } from "../types";
import { DatabaseService } from "./databaseService";
import type { IngredientRaw, RecipeVersionIngredientRaw, RecipeVersionItemRaw, RequiredItemRaw } from "./databaseTypes";

async function processAndInsertRecipeVersionFromString(input: string): Promise<number> {
    const metaSection = input.split('INGREDIENTS')[0].trim();
    const ingredientSection = input.split('INGREDIENTS')[1].split('ITEMS')[0].trim();
    const itemSection = input.split('ITEMS')[1].split('INSTRUCTIONS')[0].trim();
    const instructionSection = input.split('INSTRUCTIONS')[1].trim();

    if (!metaSection || !ingredientSection || !itemSection || !instructionSection) {
        throw new Error('Invalid recipe format');
    }

    const metaValues = metaSection.split(';;').map(s => s.trim());

    if (metaValues.length !== 7) {
        throw new Error('Invalid meta section');
    }

    // Handle Recipe Version
    const insertedVersionId = await DatabaseService.insertRecipeVersion({
        PortionQuantity: parseFloat(metaValues[0]),
        PortionDescriptor: metaValues[1],
        ActiveTimeMinutes: parseInt(metaValues[2], 10),
        PassiveTimeMinutes: parseInt(metaValues[3], 10),
        ComplexityRating: parseInt(metaValues[4], 10),
        MayhemRating: parseInt(metaValues[5], 10)
    });

    // Handle Ingredients
    const ingredientValues = ingredientSection.split(';;').filter(Boolean);
    for (const ingredientString of ingredientValues) {
        const [ingredientName, quantity, measurement] = ingredientString.split('::').map(s => s.trim());

        let ingredient: IngredientRaw;
        try {
            ingredient = await DatabaseService.getIngredientByName(ingredientName);
        } catch (e: unknown) {
            if (e instanceof ItemNotFoundException) {
                const ingredientId = await DatabaseService.insertIngredient({ IngredientName: ingredientName });
                ingredient = await DatabaseService.getIngredientById(ingredientId);
            } else {
                throw e;
            }
        }

        await DatabaseService.insertRecipeVersionIngredient({
            IngredientID: ingredient.IngredientID,
            RecipeVersionID: insertedVersionId,
            Quantity: parseFloat(quantity),
            Measurement: measurement
        });
    }

    // Handle Items
    const itemValues = itemSection.split(';;').filter(Boolean);
    for (const itemString of itemValues) {
        const [itemName, quantity] = itemString.split('::').map(s => s.trim());

        let item: RequiredItemRaw;
        try {
            item = await DatabaseService.getItemByName(itemName);
        } catch (e: unknown) {
            if (e instanceof ItemNotFoundException) {
                const itemId = await DatabaseService.insertItem({ ItemName: itemName });
                item = await DatabaseService.getItemById(itemId);
            } else {
                throw e;
            }
        }

        await DatabaseService.insertRecipeVersionItem({
            ItemID: item.ItemID,
            RecipeVersionID: insertedVersionId,
            Quantity: parseInt(quantity, 10)
        });
    }

    // Handle Instructions
    const instructionValues = instructionSection.split(';;').filter(Boolean);
    for (const instructionString of instructionValues) {
        const [stepNumber, detail] = instructionString.split('::').map(s => s.trim());
        await DatabaseService.insertInstruction({
            RecipeVersionID: insertedVersionId,
            StepNumber: parseInt(stepNumber, 10),
            StepDetail: detail
        });
    }

    return insertedVersionId;
}

export async function processAndInsertRecipeFromString(input: string, recipeName: string): Promise<number> {
    const versionId = await processAndInsertRecipeVersionFromString(input);
    return await DatabaseService.insertRecipe({ RecipeName: recipeName, MainVersionID: versionId });
}

