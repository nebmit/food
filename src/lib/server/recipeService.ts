import fs from "fs";
import { ItemNotFoundException, ParsingException } from "../types";
import { DatabaseService } from "./databaseService";
import type { IngredientRaw, RecipeVersionRaw, RequiredItemRaw } from "./databaseTypes";
import { parseRecipeTXT } from './recipeParserTXT';
import { parseRecipeYAML } from "./recipeParserYAML";

export interface ParsedRecipe {
    Meta: Partial<RecipeVersionRaw>;
    Tags: string[];
    Ingredients: Array<{
        IngredientName: string;
        Quantity: number;
        Measurement: string;
    }>;
    CommonIngredients: Array<{
        IngredientName: string;
        Quantity: number;
        Measurement: string;
    }>;
    Items: Array<{
        ItemName: string;
        Quantity: number;
    }>;
    Instructions: string[];
    Note: string;
}

async function insertRecipeVersionFromString(parsedRecipe: ParsedRecipe): Promise<number> {
    const { Meta, Ingredients, CommonIngredients, Items, Instructions } = parsedRecipe;

    // Insert Meta and get the inserted recipe version ID
    const insertedVersionId = await DatabaseService.insertRecipeVersion(Meta);

    // Insert Ingredients
    for (const parsedIngredient of [...Ingredients, ...CommonIngredients]) {
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
    for (const parsedItem of Items) {
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
    for (let i = 0; i < Instructions.length; i++) {
        const instruction = Instructions[i];
        await DatabaseService.insertInstruction({
            RecipeVersionID: insertedVersionId,
            StepNumber: i + 1,
            StepDetail: instruction
        });
    }

    return insertedVersionId;
}

export async function insertRecipeFromFile(recipeName: string, recipePath: string): Promise<number> {
    let parsedRecipe: ParsedRecipe;
    const recipeData = fs.readFileSync(recipePath, 'utf8');

    switch (recipePath.split('.').pop()) {
    case 'txt':
        parsedRecipe = parseRecipeTXT(recipeData);
        break;
    case 'yaml':
        parsedRecipe = parseRecipeYAML(recipeData);
        break;
    default:
        throw new ParsingException('Invalid file format');
    }

    const versionId = await insertRecipeVersionFromString(parsedRecipe);
    return await DatabaseService.insertRecipe({ RecipeName: recipeName, MainVersionID: versionId });
}
