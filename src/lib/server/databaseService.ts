import type { Database } from 'sqlite';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import type { Ingredient, Recipe, RecipeIngredient, RecipeItem, RecipeVersion } from '../types';
import type { IngredientRaw, InstructionRaw, RecipeRaw, RecipeVersionIngredientRaw, RecipeVersionItemRaw, RequiredItemRaw } from './databaseTypes';

export class DatabaseService {
    private static db: Database<sqlite3.Database, sqlite3.Statement>;

    constructor() {
        throw new Error('DatabaseService is a static class and should not be instantiated');
    }

    public static async initialize(dbName: string) {
        DatabaseService.db = await open({ filename: dbName, driver: sqlite3.Database });
    }


    // Public GET methods
    public static async getRecipes(limit = 10): Promise<Recipe[]> {
        const recipes: RecipeRaw[] = await DatabaseService.db.all(`SELECT * FROM Recipes LIMIT ?`, limit);
        return Promise.all(recipes.map(async recipe => await DatabaseService.getRecipeById(recipe.RecipeID)));
    }

    public static async getRecipeById(recipeId: number): Promise<Recipe> {
        const recipe: RecipeRaw | undefined = await DatabaseService.db.get(`SELECT * FROM Recipes WHERE RecipeID = ?`, recipeId);
        if (!recipe) throw new Error('Recipe not found');

        return {
            RecipeID: recipe.RecipeID,
            RecipeName: recipe.RecipeName,
            MainVersion: await DatabaseService.getRecipeVersionById(recipe.MainVersionID),
        };
    }

    public static async getRecipeVersionById(versionId: number): Promise<RecipeVersion> {
        const version = await DatabaseService.db.get(`SELECT * FROM RecipeVersions WHERE RecipeVersionID = ?`, versionId);
        if (!version) throw new Error('Recipe version not found');

        const rawIngredients: RecipeVersionIngredientRaw[] = await DatabaseService.db.all(`SELECT * FROM RecipeVersionIngredients WHERE RecipeVersionID = ?`, versionId);
        const ingredients: RecipeIngredient[] = await Promise.all(rawIngredients.map(DatabaseService.getRecipeIngredient));
        const rawItems: RecipeVersionItemRaw[] = await DatabaseService.db.all(`SELECT * FROM RecipeVersionItems WHERE RecipeVersionID = ?`, versionId);
        const items: RecipeItem[] = await Promise.all(rawItems.map(DatabaseService.getRequiredItem));

        const rawInstructions: InstructionRaw[] = await DatabaseService.db.all(`SELECT * FROM Instructions WHERE RecipeVersionID = ?`, versionId);


        return {
            RecipeVersionID: version.RecipeVersionID,
            ParentVersionID: version.ParentVersionID,
            VersionComment: version.VersionComment,
            PortionQuantity: version.PortionQuantity,
            PortionDescriptor: version.PortionDescriptor,
            ActiveTimeMinutes: version.ActiveTimeMinutes,
            PassiveTimeMinutes: version.PassiveTimeMinutes,
            ComplexityRating: version.ComplexityRating,
            MayhemRating: version.MayhemRating,
            Ingredients: ingredients,
            Items: items,
            Instructions: rawInstructions,
        };
    }

    public static async getIngredientById(ingredientId: number): Promise<Ingredient> {
        const ingredient: IngredientRaw | undefined = await DatabaseService.db.get(`SELECT * FROM Ingredients WHERE IngredientID = ?`, ingredientId);
        if (!ingredient) throw new Error('Ingredient not found');

        const tags = await DatabaseService.db.all(`SELECT * FROM IngredientTags 
                                       JOIN IngredientTagAssignment ON IngredientTags.TagID = IngredientTagAssignment.TagID
                                       WHERE IngredientTagAssignment.IngredientID = ?`, ingredientId);

        return {
            IngredientID: ingredient.IngredientID,
            IngredientName: ingredient.IngredientName,
            IsRecipe: ingredient.IsRecipe,
            RecipeID: ingredient.RecipeID,
            Tags: tags
        };
    }


    // Public PATCH methods
    public static async patchRecipe(recipeId: number, newRecipeData: Partial<Recipe>): Promise<void> {
        const setters = Object.keys(newRecipeData).map(key => `${key} = ?`).join(', ');

        await DatabaseService.db.run(`UPDATE Recipes SET ${setters} WHERE RecipeID = ?`, ...Object.values(newRecipeData), recipeId);
    }


    // Private methods
    private static async getRecipeIngredient(recipeIngredient: RecipeVersionIngredientRaw): Promise<RecipeIngredient> {
        try {
            const ingredient = await DatabaseService.getIngredientById(recipeIngredient.IngredientID);
            if (!ingredient) throw new Error('Item not found');
            return {
                RecipeVersionIngredientID: recipeIngredient.RecipeVersionIngredientID,
                RecipeVersionID: recipeIngredient.RecipeVersionID,
                Ingredient: ingredient,
                Quantity: recipeIngredient.Quantity,
                Measurement: recipeIngredient.Measurement,
            }
        } catch (error) {
            throw new Error('Error getting recipe ingredient: ' + error);
        }
    }

    private static async getRequiredItem(recipeItem: RecipeVersionItemRaw): Promise<RecipeItem> {
        try {
            const item: RequiredItemRaw | undefined = await DatabaseService.db.get(`SELECT * FROM Items WHERE ItemID = ?`, recipeItem.ItemID);
            if (!item) throw new Error('Item not found');
            return {
                RecipeVersionItemID: recipeItem.RecipeVersionItemID,
                RecipeVersionID: recipeItem.RecipeVersionID,
                Item: item,
                Quantity: recipeItem.Quantity,
            }
        } catch (error) {
            throw new Error('Error getting recipe item: ' + error);
        }
    }
}

await DatabaseService.initialize('./src/lib/server/database.db').catch((error) => {
    console.error(`Error initializing database: ${error}`);
});
