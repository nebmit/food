import type { Database } from 'sqlite';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import type { InstructionRaw, RecipeIngredientRaw, RecipeRaw } from './databaseTypes';
import type { Ingredient, Recipe, RecipeIngredient, RecipeVersion } from '../types';

export class DatabaseService {
    private static db: Database<sqlite3.Database, sqlite3.Statement>;

    constructor() {
        throw new Error('DatabaseService is a static class and should not be instantiated');
    }

    public static async initialize(dbName: string) {
        DatabaseService.db = await open({ filename: dbName, driver: sqlite3.Database });
    }

    public static async getRecipes(limit = 10): Promise<Recipe[]> {
        const recipes: RecipeRaw[] = await DatabaseService.db.all(`SELECT * FROM Recipes LIMIT ?`, limit);
        return Promise.all(recipes.map(async recipe => await DatabaseService.getRecipeById(recipe.RecipeID)));
    }

    public static async getRecipeById(recipeId: number): Promise<Recipe> {
        const recipe: RecipeRaw | undefined = await DatabaseService.db.get(`SELECT * FROM Recipes WHERE RecipeID = ?`, recipeId);
        if (!recipe) throw new Error('Recipe not found');

        const mainVersion = await DatabaseService.db.get(`SELECT * FROM RecipeVersions WHERE RecipeVersionID = ?`, recipe.MainVersionID);
        if (!mainVersion) throw new Error('Recipe main version not found');

        return {
            RecipeID: recipe.RecipeID,
            RecipeName: recipe.RecipeName,
            MainVersion: await DatabaseService.getRecipeVersionById(mainVersion.RecipeVersionID),
            PortionQuantity: recipe.PortionQuantity,
            PortionDescriptor: recipe.PortionDescriptor,
            EstimatedTime: recipe.EstimatedTime,
            ComplexityRating: recipe.ComplexityRating,
            MayhemRating: recipe.MayhemRating
        };
    }

    public static async getRecipeVersionById(versionId: number): Promise<RecipeVersion> {
        const version = await DatabaseService.db.get(`SELECT * FROM RecipeVersions WHERE RecipeVersionID = ?`, versionId);
        if (!version) throw new Error('Recipe version not found');

        const rawIngredients: RecipeIngredientRaw[] = await DatabaseService.db.all(`SELECT * FROM RecipeIngredients WHERE RecipeVersionID = ?`, versionId);
        const ingredients: RecipeIngredient[] = await Promise.all(rawIngredients.map(DatabaseService.getRecipeIngredient));

        const rawInstructions: InstructionRaw[] = await DatabaseService.db.all(`SELECT * FROM Instructions WHERE RecipeVersionID = ?`, versionId);

        return {
            RecipeVersionID: version.RecipeVersionID,
            ParentVersionID: version.ParentVersionID,
            VersionComment: version.VersionComment,
            Ingredients: ingredients,
            Instructions: rawInstructions
        };
    }

    private static async getRecipeIngredient(recipeIngredient: RecipeIngredientRaw): Promise<RecipeIngredient> {
        try {
            const ingredient = await DatabaseService.getIngredientById(recipeIngredient.IngredientID);
            return { ...recipeIngredient, Ingredient: ingredient }
        } catch (error) {
            throw new Error('Error getting recipe ingredient: ' + error);
        }
    }

    public static async getIngredientById(ingredientId: number): Promise<Ingredient> {
        const ingredient = await DatabaseService.db.get(`SELECT * FROM Ingredients WHERE IngredientID = ?`, ingredientId);
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
}
await DatabaseService.initialize('./src/lib/server/database.db').catch((error) => {
    console.error(`Error initializing database: ${error}`);
});
