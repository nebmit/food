import fs from "fs";
import { ItemNotFoundException, ParsingException } from "../types";
import { DatabaseService } from "./databaseService";
import type { IngredientRaw, RecipeVersionRaw, RequiredItemRaw } from "./databaseTypes";
import { parseRecipeYAML } from "./recipeParserYAML";

export interface ParsedRecipe {
    Meta: Partial<RecipeVersionRaw>;
    Tags: string[];
    Ingredients: Array<{
        IngredientName: string;
        Quantity: number;
        Measurement: string;
        Prep?: string;
        Sub?: string;
    }>;
    PantryIngredients: Array<{
        IngredientName: string;
    }>;
    Items: Array<{
        ItemName: string;
        Quantity: number;
    }>;
    Instructions: string[];
    Notes: string[];
}

async function insertRecipeVersionFromString(parsedRecipe: ParsedRecipe): Promise<number> {
    const { Meta, Ingredients, PantryIngredients, Items, Instructions, Notes } = parsedRecipe;

    const insertedVersionId = await DatabaseService.insertRecipeVersion(Meta);

    for (const parsedIngredient of Ingredients) {
        const ingredient = await getOrCreateIngredient(parsedIngredient.IngredientName);

        await DatabaseService.insertRecipeVersionIngredient({
            IngredientID: ingredient.IngredientID,
            RecipeVersionID: insertedVersionId,
            Quantity: parsedIngredient.Quantity,
            Measurement: parsedIngredient.Measurement,
            Prep: parsedIngredient.Prep || undefined,
            Sub: parsedIngredient.Sub || undefined,
        });
    }

    for (const pantryItem of PantryIngredients) {
        const ingredient = await getOrCreateIngredient(pantryItem.IngredientName);

        await DatabaseService.insertRecipeVersionPantryIngredient({
            IngredientID: ingredient.IngredientID,
            RecipeVersionID: insertedVersionId,
        });
    }

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

    for (let i = 0; i < Instructions.length; i++) {
        await DatabaseService.insertInstruction({
            RecipeVersionID: insertedVersionId,
            StepNumber: i + 1,
            StepDetail: Instructions[i]
        });
    }

    for (let i = 0; i < Notes.length; i++) {
        await DatabaseService.insertNote({
            RecipeVersionID: insertedVersionId,
            NoteNumber: i + 1,
            NoteText: Notes[i],
        });
    }

    return insertedVersionId;
}

async function getOrCreateIngredient(name: string): Promise<IngredientRaw> {
    try {
        return await DatabaseService.getIngredientByName(name);
    } catch (e: unknown) {
        if (e instanceof ItemNotFoundException) {
            const id = await DatabaseService.insertIngredient({ IngredientName: name });
            return await DatabaseService.getIngredientById(id);
        }
        throw e;
    }
}

export async function insertRecipeFromFile(recipeName: string, recipePath: string): Promise<number> {
    const recipeData = fs.readFileSync(recipePath, 'utf8');

    if (!recipePath.endsWith('.yaml')) {
        throw new ParsingException('Only YAML recipe files are supported');
    }

    const parsedRecipe = parseRecipeYAML(recipeData);
    const versionId = await insertRecipeVersionFromString(parsedRecipe);
    return await DatabaseService.insertRecipe({ RecipeName: recipeName, MainVersionID: versionId });
}
