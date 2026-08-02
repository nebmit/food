import type { Database } from 'sqlite';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { CartIngredient, Ingredient, Recipe, RecipeIngredient, RecipeItem, RecipeVersion } from '../types';
import { ItemNotFoundException } from '../types';
import type {
    IngredientRaw,
    InstructionRaw,
    NoteRaw,
    RecipeRaw,
    RecipeStageInputRaw,
    RecipeStageRaw,
    RecipeTagRaw,
    RecipeVersionIngredientRaw,
    RecipeVersionItemRaw,
    RecipeVersionPantryIngredientRaw,
    RecipeVersionRaw,
    RecipeVersionTableRaw,
    RecipeVersionTagAssignmentRaw,
    RequiredItemRaw,
} from './databaseTypes';

export class DatabaseService {
    private static db: Database<sqlite3.Database, sqlite3.Statement>;

    constructor() {
        throw new Error('DatabaseService is a static class and should not be instantiated');
    }

    public static async initialize(dbName: string) {
        if (DatabaseService.db) await DatabaseService.db.close();
        DatabaseService.db = await open({ filename: dbName, driver: sqlite3.Database });
        await DatabaseService.db.exec('PRAGMA foreign_keys = ON');
    }

    public static async close() {
        if (DatabaseService.db) await DatabaseService.db.close();
    }

    public static async runInTransaction<T>(operation: () => Promise<T>): Promise<T> {
        await DatabaseService.db.exec('BEGIN IMMEDIATE');
        try {
            const result = await operation();
            await DatabaseService.db.exec('COMMIT');
            return result;
        } catch (error) {
            await DatabaseService.db.exec('ROLLBACK');
            throw error;
        }
    }

    public static async rebuildRecipeStorage(schema: string) {
        const tables = [
            'RecipeStageInputs',
            'RecipeVersionTagAssignments',
            'RecipeStages',
            'RecipeVersionTables',
            'RecipeVersionIngredients',
            'RecipeVersionPantryIngredients',
            'RecipeVersionItems',
            'Instructions',
            'Notes',
            'IngredientTagAssignment',
            'Ingredients',
            'Recipes',
            'RecipeVersions',
            'RecipeTags',
            'IngredientTags',
            'Items',
        ];
        for (const table of tables) {
            await DatabaseService.db.exec(`DROP TABLE IF EXISTS ${table}`);
        }
        await DatabaseService.db.exec(schema);
    }

    public static async clearRecipes() {
        await DatabaseService.db.run(`DELETE FROM RecipeStageInputs`);
        await DatabaseService.db.run(`DELETE FROM RecipeVersionTagAssignments`);
        await DatabaseService.db.run(`DELETE FROM RecipeStages`);
        await DatabaseService.db.run(`DELETE FROM RecipeVersionTables`);
        await DatabaseService.db.run(`DELETE FROM RecipeVersionIngredients`);
        await DatabaseService.db.run(`DELETE FROM RecipeVersionPantryIngredients`);
        await DatabaseService.db.run(`DELETE FROM RecipeVersionItems`);
        await DatabaseService.db.run(`DELETE FROM Instructions`);
        await DatabaseService.db.run(`DELETE FROM Notes`);
        await DatabaseService.db.run(`DELETE FROM IngredientTagAssignment`);
        await DatabaseService.db.run(`DELETE FROM Ingredients`);
        await DatabaseService.db.run(`DELETE FROM Recipes`);
        await DatabaseService.db.run(`DELETE FROM RecipeVersions`);
        await DatabaseService.db.run(`DELETE FROM RecipeTags`);
        await DatabaseService.db.run(`DELETE FROM IngredientTags`);
        await DatabaseService.db.run(`DELETE FROM Items`);
    }

    // ************ //
    // Public GET methods
    // ************ //

    public static async getAllRecipes(): Promise<Recipe[]> {
        const recipes: RecipeRaw[] = await DatabaseService.db.all(`SELECT * FROM Recipes`);
        return Promise.all(recipes.map(async recipe => await DatabaseService.getRecipeById(recipe.RecipeID)));
    }

    public static async getRandomRecipes(limit = 10): Promise<Recipe[]> {
        const recipes: RecipeRaw[] = await DatabaseService.db.all(
            `SELECT * FROM Recipes ORDER BY RANDOM() LIMIT ?`,
            limit
        );
        return Promise.all(recipes.map(async recipe => await DatabaseService.getRecipeById(recipe.RecipeID)));
    }


    // GET BY ID methods
    /**
     * @throws {ItemNotFoundException} if the item could not be found
     */
    public static async getRecipeById(recipeId: number): Promise<Recipe> {
        const recipe: RecipeRaw | undefined = await DatabaseService.db.get(`SELECT * FROM Recipes WHERE RecipeID = ?`, recipeId);
        if (!recipe) throw new ItemNotFoundException('Recipe not found');

        return {
            RecipeID: recipe.RecipeID,
            RecipeName: recipe.RecipeName,
            MainVersion: await DatabaseService.getRecipeVersionById(recipe.MainVersionID),
        };
    }

    public static async getRecipeByName(recipeName: string): Promise<Recipe> {
        const recipe: RecipeRaw | undefined = await DatabaseService.db.get(`SELECT * FROM Recipes WHERE RecipeName = ?`, recipeName);
        if (!recipe) throw new ItemNotFoundException('Recipe not found');

        return {
            RecipeID: recipe.RecipeID,
            RecipeName: recipe.RecipeName,
            MainVersion: await DatabaseService.getRecipeVersionById(recipe.MainVersionID),
        };
    }

    /**
     * @throws {ItemNotFoundException} if the item could not be found
     */
    public static async getRecipeVersionById(versionId: number): Promise<RecipeVersion> {
        const version = await DatabaseService.db.get(`SELECT * FROM RecipeVersions WHERE RecipeVersionID = ?`, versionId);
        if (!version) throw new ItemNotFoundException('Recipe version not found');

        const rawIngredients: RecipeVersionIngredientRaw[] = await DatabaseService.db.all(`SELECT * FROM RecipeVersionIngredients WHERE RecipeVersionID = ?`, versionId);
        const ingredients: RecipeIngredient[] = await Promise.all(rawIngredients.map(DatabaseService.getRecipeIngredient));
        const rawPantryIngredients: RecipeVersionPantryIngredientRaw[] = await DatabaseService.db.all(`SELECT * FROM RecipeVersionPantryIngredients WHERE RecipeVersionID = ?`, versionId);
        const pantryIngredients: RecipeIngredient[] = await Promise.all(rawPantryIngredients.map(DatabaseService.getRecipePantryIngredient));
        const rawItems: RecipeVersionItemRaw[] = await DatabaseService.db.all(`SELECT * FROM RecipeVersionItems WHERE RecipeVersionID = ?`, versionId);
        const items: RecipeItem[] = await Promise.all(rawItems.map(DatabaseService.getRequiredItem));

        const rawInstructions: InstructionRaw[] = await DatabaseService.db.all(`SELECT * FROM Instructions WHERE RecipeVersionID = ?`, versionId);
        const rawNotes: NoteRaw[] = await DatabaseService.db.all(`SELECT * FROM Notes WHERE RecipeVersionID = ? ORDER BY NoteNumber`, versionId);

        return {
            RecipeVersionID: version.RecipeVersionID,
            ParentVersionID: version.ParentVersionID,
            VersionComment: version.VersionComment,
            Description: version.Description || '',
            Source: version.Source || '',
            Cuisine: version.Cuisine || '',
            PortionQuantity: version.PortionQuantity,
            PortionDescriptor: version.PortionDescriptor,
            ActiveTimeMinutes: version.ActiveTimeMinutes,
            PassiveTimeMinutes: version.PassiveTimeMinutes,
            ComplexityRating: version.ComplexityRating,
            MayhemRating: version.MayhemRating,
            Ingredients: ingredients,
            PantryIngredients: pantryIngredients,
            Items: items,
            Instructions: rawInstructions,
            Notes: rawNotes.map(n => n.NoteText),
        };
    }

    /**
     * Returns all ingredient names sorted alphabetically, excluding recipe-ingredients.
     */
    public static async getAllIngredientNames(): Promise<string[]> {
        const rows = await DatabaseService.db.all<{ IngredientName: string }[]>(
            `SELECT IngredientName FROM Ingredients WHERE IsRecipe = 0 ORDER BY IngredientName COLLATE NOCASE`
        );
        return rows.map(r => r.IngredientName);
    }

    /**
     * @throws {ItemNotFoundException} if the item could not be found
     */
    public static async getIngredientById(ingredientId: number): Promise<Ingredient> {
        const ingredient: IngredientRaw | undefined = await DatabaseService.db.get(`SELECT * FROM Ingredients WHERE IngredientID = ?`, ingredientId);
        if (!ingredient) throw new ItemNotFoundException('Ingredient not found');

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

    /**
     * @throws {ItemNotFoundException} if the item could not be found
     */
    public static async getItemById(itemId: number): Promise<RequiredItemRaw> {
        const item: RequiredItemRaw | undefined = await DatabaseService.db.get(`SELECT * FROM Items WHERE ItemID = ?`, itemId);
        if (!item) throw new ItemNotFoundException('Item not found');

        return item;
    }


    // GET BY NAME methods
    /**
     * @throws {ItemNotFoundException} if the item could not be found
     */
    public static async getIngredientByName(ingredientName: string): Promise<Ingredient> {
        const ingredient: IngredientRaw | undefined = await DatabaseService.db.get(`SELECT * FROM Ingredients WHERE IngredientName = ?`, ingredientName);
        if (!ingredient) throw new ItemNotFoundException('Ingredient not found');

        const tags = await DatabaseService.db.all(`SELECT * FROM IngredientTags 
                                       JOIN IngredientTagAssignment ON IngredientTags.TagID = IngredientTagAssignment.TagID
                                       WHERE IngredientTagAssignment.IngredientID = ?`, ingredient.IngredientID);

        return {
            IngredientID: ingredient.IngredientID,
            IngredientName: ingredient.IngredientName,
            IsRecipe: ingredient.IsRecipe,
            RecipeID: ingredient.RecipeID,
            Tags: tags
        };
    }

    /**
     * @throws {ItemNotFoundException} if the item could not be found
     */
    public static async getItemByName(itemName: string): Promise<RequiredItemRaw> {
        const item: RequiredItemRaw | undefined = await DatabaseService.db.get(`SELECT * FROM Items WHERE ItemName = ?`, itemName);
        if (!item) throw new ItemNotFoundException('Item not found');

        return item;
    }

    public static async getRecipeTagByName(tagName: string): Promise<RecipeTagRaw> {
        const tag: RecipeTagRaw | undefined = await DatabaseService.db.get(
            `SELECT * FROM RecipeTags WHERE TagName = ?`,
            tagName,
        );
        if (!tag) throw new ItemNotFoundException('Recipe tag not found');
        return tag;
    }

    /**
     * @throws {ItemNotFoundException} if the item could not be found
     */
    public static async getCartByUUID(uuid: string): Promise<Array<CartIngredient>> {
        const cart = await DatabaseService.db.get(`SELECT * FROM Cart WHERE UUID = ?`, uuid);
        if (!cart) throw new ItemNotFoundException('Cart not found');

        return JSON.parse(cart.Contents);
    }


    // ************ //
    // Public PATCH methods
    // ************ //

    public static async patchRecipe(recipeId: number, newRecipeData: Partial<Recipe>): Promise<void> {
        const ALLOWED_COLUMNS = ['RecipeName', 'MainVersionID'];
        const validKeys = Object.keys(newRecipeData).filter(key => ALLOWED_COLUMNS.includes(key));

        if (!validKeys.length) {
            throw new Error("No valid columns provided for update.");
        }

        const setters = validKeys.map(key => `${key} = ?`).join(', ');
        const values = validKeys.map(key => newRecipeData[key as keyof Recipe]);

        const query = `UPDATE Recipes SET ${setters} WHERE RecipeID = ?`;
        await DatabaseService.db.run(query, ...values, recipeId);
    }

    public static async patchRecipeVersion(versionId: number, newVersionData: Partial<RecipeVersionRaw>): Promise<void> {
        const ALLOWED_COLUMNS = ['ParentVersionID', 'VersionComment', 'Description', 'Source', 'Cuisine', 'PortionQuantity', 'PortionDescriptor', 'ActiveTimeMinutes', 'PassiveTimeMinutes', 'ComplexityRating', 'MayhemRating'];
        const validKeys = Object.keys(newVersionData).filter(key => ALLOWED_COLUMNS.includes(key));

        if (!validKeys.length) {
            throw new Error("No valid columns provided for update.");
        }

        const setters = validKeys.map(key => `${key} = ?`).join(', ');
        const values = validKeys.map(key => newVersionData[key as keyof RecipeVersionRaw]);

        const query = `UPDATE RecipeVersions SET ${setters} WHERE RecipeVersionID = ?`;
        await DatabaseService.db.run(query, ...values, versionId);
    }

    public static async patchRecipeVersionIngredient(recipeVersionIngredientId: number, newIngredientData: Partial<RecipeVersionIngredientRaw>): Promise<void> {
        const ALLOWED_COLUMNS = ['IngredientID', 'RecipeVersionID', 'Quantity', 'Measurement', 'Prep', 'Sub'];
        const validKeys = Object.keys(newIngredientData).filter(key => ALLOWED_COLUMNS.includes(key));

        if (!validKeys.length) {
            throw new Error("No valid columns provided for update.");
        }

        const setters = validKeys.map(key => `${key} = ?`).join(', ');
        const values = validKeys.map(key => newIngredientData[key as keyof RecipeVersionIngredientRaw]);

        const query = `UPDATE RecipeVersionIngredients SET ${setters} WHERE RecipeVersionIngredientID = ?`;
        await DatabaseService.db.run(query, ...values, recipeVersionIngredientId);
    }

    public static async patchInstruction(instructionId: number, newInstructionData: Partial<InstructionRaw>): Promise<void> {
        const ALLOWED_COLUMNS = ['RecipeVersionID', 'StepNumber', 'StepDetail'];
        const validKeys = Object.keys(newInstructionData).filter(key => ALLOWED_COLUMNS.includes(key));

        if (!validKeys.length) {
            throw new Error("No valid columns provided for update.");
        }

        const setters = validKeys.map(key => `${key} = ?`).join(', ');
        const values = validKeys.map(key => newInstructionData[key as keyof InstructionRaw]);

        const query = `UPDATE Instructions SET ${setters} WHERE InstructionID = ?`;
        await DatabaseService.db.run(query, ...values, instructionId);
    }

    public static async patchRecipeVersionItem(recipeVersionItemId: number, newRecipeVersionItemData: Partial<RecipeVersionItemRaw>): Promise<void> {
        const ALLOWED_COLUMNS = ['ItemID', 'RecipeVersionID', 'ItemNumber', 'Quantity', 'Sub'];
        const validKeys = Object.keys(newRecipeVersionItemData).filter(key => ALLOWED_COLUMNS.includes(key));

        if (!validKeys.length) {
            throw new Error("No valid columns provided for update.");
        }

        const setters = validKeys.map(key => `${key} = ?`).join(', ');
        const values = validKeys.map(key => newRecipeVersionItemData[key as keyof RecipeVersionItemRaw]);

        const query = `UPDATE RecipeVersionItems SET ${setters} WHERE RecipeVersionItemID = ?`;
        await DatabaseService.db.run(query, ...values, recipeVersionItemId);
    }


    // ************ //
    // Public INSERT methods
    // ************ //

    public static async insertRecipe(recipe: Partial<RecipeRaw>): Promise<number> {
        const filteredRecipe: Partial<RecipeRaw> = this.filterAllowedColumns(['RecipeName', 'MainVersionID'], recipe);

        if (!filteredRecipe.RecipeName) throw new Error('RecipeName is required');
        if (!filteredRecipe.MainVersionID) throw new Error('MainVersion is required');

        const result = await DatabaseService.db.run(`INSERT INTO Recipes (RecipeName, MainVersionID) VALUES (?, ?)`, filteredRecipe.RecipeName, filteredRecipe.MainVersionID);
        if (!result.lastID) throw new Error('Error inserting recipe');
        return result.lastID;
    }

    public static async insertRecipeVersion(recipeVersion: Partial<RecipeVersionRaw>): Promise<number> {
        const filteredRecipeVersion: Partial<RecipeVersionRaw> = this.filterAllowedColumns(['ParentVersionID', 'VersionComment', 'SchemaVersion', 'Description', 'Source', 'Cuisine', 'PortionQuantity', 'PortionDescriptor', 'ActiveTimeMinutes', 'PassiveTimeMinutes', 'ComplexityRating', 'MayhemRating'], recipeVersion);

        if (filteredRecipeVersion.SchemaVersion !== 2) throw new Error('SchemaVersion must be 2');
        if (!filteredRecipeVersion.PortionQuantity) throw new Error('PortionQuantity is required');
        if (!filteredRecipeVersion.PortionDescriptor) throw new Error('PortionDescriptor is required');
        if (filteredRecipeVersion.ActiveTimeMinutes === null || filteredRecipeVersion.ActiveTimeMinutes === undefined) throw new Error('ActiveTimeMinutes is required');
        if (filteredRecipeVersion.PassiveTimeMinutes === null || filteredRecipeVersion.PassiveTimeMinutes === undefined) throw new Error('PassiveTimeMinutes is required');
        if (!filteredRecipeVersion.ComplexityRating) throw new Error('ComplexityRating is required');
        if (!filteredRecipeVersion.MayhemRating) throw new Error('MayhemRating is required');

        const result = await DatabaseService.db.run(
            `INSERT INTO RecipeVersions (ParentVersionID, VersionComment, SchemaVersion, Description, Source, Cuisine, PortionQuantity, PortionDescriptor, ActiveTimeMinutes, PassiveTimeMinutes, ComplexityRating, MayhemRating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            filteredRecipeVersion.ParentVersionID,
            filteredRecipeVersion.VersionComment,
            filteredRecipeVersion.SchemaVersion,
            filteredRecipeVersion.Description || '',
            filteredRecipeVersion.Source || '',
            filteredRecipeVersion.Cuisine || '',
            filteredRecipeVersion.PortionQuantity,
            filteredRecipeVersion.PortionDescriptor,
            filteredRecipeVersion.ActiveTimeMinutes,
            filteredRecipeVersion.PassiveTimeMinutes,
            filteredRecipeVersion.ComplexityRating,
            filteredRecipeVersion.MayhemRating
        );
        if (!result.lastID) throw new Error('Error inserting recipe version');
        return result.lastID;
    }

    public static async insertIngredient(ingredient: Partial<IngredientRaw>): Promise<number> {
        const filteredIngredient: Partial<IngredientRaw> = this.filterAllowedColumns(['IngredientName', 'IsRecipe', 'RecipeID'], ingredient);

        if (!filteredIngredient.IngredientName) throw new Error('IngredientName is required');
        if (filteredIngredient.IsRecipe && !filteredIngredient.RecipeID) throw new Error('RecipeID is required when IsRecipe is true');
        if (!filteredIngredient.IsRecipe && filteredIngredient.RecipeID) throw new Error('RecipeID is not allowed when IsRecipe is false');
        if (filteredIngredient.IsRecipe == null) filteredIngredient.IsRecipe = false;

        const result = await DatabaseService.db.run(`INSERT INTO Ingredients (IngredientName, IsRecipe, RecipeID) VALUES (?, ?, ?)`, filteredIngredient.IngredientName, filteredIngredient.IsRecipe, filteredIngredient.RecipeID);
        if (!result.lastID) throw new Error('Error inserting ingredient');
        return result.lastID;
    }

    public static async insertRecipeVersionIngredient(recipeVersionIngredient: Partial<RecipeVersionIngredientRaw>): Promise<number> {
        const filteredRecipeVersionIngredient: Partial<RecipeVersionIngredientRaw> = this.filterAllowedColumns(['IngredientID', 'RecipeVersionID', 'Quantity', 'Measurement', 'Prep', 'Sub'], recipeVersionIngredient);

        if (!filteredRecipeVersionIngredient.IngredientID) throw new Error('IngredientID is required');
        if (!filteredRecipeVersionIngredient.RecipeVersionID) throw new Error('RecipeVersionID is required');
        if (!filteredRecipeVersionIngredient.Quantity) throw new Error('Quantity is required');

        const result = await DatabaseService.db.run(
            `INSERT INTO RecipeVersionIngredients (IngredientID, RecipeVersionID, Quantity, Measurement, Prep, Sub) VALUES (?, ?, ?, ?, ?, ?)`,
            filteredRecipeVersionIngredient.IngredientID,
            filteredRecipeVersionIngredient.RecipeVersionID,
            filteredRecipeVersionIngredient.Quantity,
            filteredRecipeVersionIngredient.Measurement,
            filteredRecipeVersionIngredient.Prep || null,
            filteredRecipeVersionIngredient.Sub || null
        );
        if (!result.lastID) throw new Error('Error inserting recipe version ingredient');
        return result.lastID;
    }

    public static async insertRecipeVersionPantryIngredient(pantryIngredient: Partial<RecipeVersionPantryIngredientRaw>): Promise<number> {
        const filtered: Partial<RecipeVersionPantryIngredientRaw> = this.filterAllowedColumns(['IngredientID', 'RecipeVersionID'], pantryIngredient);

        if (!filtered.IngredientID) throw new Error('IngredientID is required');
        if (!filtered.RecipeVersionID) throw new Error('RecipeVersionID is required');

        const result = await DatabaseService.db.run(
            `INSERT INTO RecipeVersionPantryIngredients (IngredientID, RecipeVersionID) VALUES (?, ?)`,
            filtered.IngredientID,
            filtered.RecipeVersionID
        );
        if (!result.lastID) throw new Error('Error inserting pantry ingredient');
        return result.lastID;
    }

    public static async insertRecipeVersionTable(table: Partial<RecipeVersionTableRaw>): Promise<number> {
        const filtered = this.filterAllowedColumns(
            ['RecipeVersionID', 'TableNumber', 'TableName'],
            table,
        );
        if (!filtered.RecipeVersionID) throw new Error('RecipeVersionID is required');
        if (!filtered.TableNumber) throw new Error('TableNumber is required');
        if (!filtered.TableName) throw new Error('TableName is required');

        const result = await DatabaseService.db.run(
            `INSERT INTO RecipeVersionTables (RecipeVersionID, TableNumber, TableName) VALUES (?, ?, ?)`,
            filtered.RecipeVersionID,
            filtered.TableNumber,
            filtered.TableName,
        );
        if (!result.lastID) throw new Error('Error inserting recipe table');
        return result.lastID;
    }

    public static async insertRecipeStage(stage: Partial<RecipeStageRaw>): Promise<number> {
        const filtered = this.filterAllowedColumns(
            ['RecipeVersionID', 'RecipeVersionTableID', 'StageNumber', 'StageKey', 'Setup', 'Action', 'Hint'],
            stage,
        );
        if (!filtered.RecipeVersionID) throw new Error('RecipeVersionID is required');
        if (!filtered.RecipeVersionTableID) throw new Error('RecipeVersionTableID is required');
        if (!filtered.StageNumber) throw new Error('StageNumber is required');
        if (!filtered.StageKey) throw new Error('StageKey is required');
        if (filtered.Setup === undefined) throw new Error('Setup is required');
        if (!filtered.Action) throw new Error('Action is required');

        const result = await DatabaseService.db.run(
            `INSERT INTO RecipeStages (RecipeVersionID, RecipeVersionTableID, StageNumber, StageKey, Setup, Action, Hint) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            filtered.RecipeVersionID,
            filtered.RecipeVersionTableID,
            filtered.StageNumber,
            filtered.StageKey,
            filtered.Setup,
            filtered.Action,
            filtered.Hint ?? null,
        );
        if (!result.lastID) throw new Error('Error inserting recipe stage');
        return result.lastID;
    }

    public static async insertRecipeStageInput(input: Partial<RecipeStageInputRaw>): Promise<number> {
        const filtered = this.filterAllowedColumns(
            ['RecipeStageID', 'InputNumber', 'IngredientID', 'SourceRecipeStageID', 'Quantity', 'Measurement', 'Hint', 'Part'],
            input,
        );
        if (!filtered.RecipeStageID) throw new Error('RecipeStageID is required');
        if (!filtered.InputNumber) throw new Error('InputNumber is required');

        const hasIngredient = filtered.IngredientID !== undefined;
        const hasSourceStage = filtered.SourceRecipeStageID !== undefined;
        if (hasIngredient === hasSourceStage) {
            throw new Error('A stage input must contain exactly one ingredient or source stage');
        }
        if ((filtered.Quantity === undefined) !== (filtered.Measurement === undefined)) {
            throw new Error('Quantity and Measurement must be provided together');
        }

        const result = await DatabaseService.db.run(
            `INSERT INTO RecipeStageInputs (RecipeStageID, InputNumber, IngredientID, SourceRecipeStageID, Quantity, Measurement, Hint, Part) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            filtered.RecipeStageID,
            filtered.InputNumber,
            filtered.IngredientID ?? null,
            filtered.SourceRecipeStageID ?? null,
            filtered.Quantity ?? null,
            filtered.Measurement ?? null,
            filtered.Hint ?? null,
            filtered.Part ?? null,
        );
        if (!result.lastID) throw new Error('Error inserting recipe stage input');
        return result.lastID;
    }

    public static async insertRecipeTag(tag: Partial<RecipeTagRaw>): Promise<number> {
        const filtered = this.filterAllowedColumns(['TagName'], tag);
        if (!filtered.TagName) throw new Error('TagName is required');

        const result = await DatabaseService.db.run(
            `INSERT INTO RecipeTags (TagName) VALUES (?)`,
            filtered.TagName,
        );
        if (!result.lastID) throw new Error('Error inserting recipe tag');
        return result.lastID;
    }

    public static async insertRecipeVersionTagAssignment(
        assignment: Partial<RecipeVersionTagAssignmentRaw>,
    ): Promise<number> {
        const filtered = this.filterAllowedColumns(
            ['RecipeVersionID', 'RecipeTagID', 'TagNumber'],
            assignment,
        );
        if (!filtered.RecipeVersionID) throw new Error('RecipeVersionID is required');
        if (!filtered.RecipeTagID) throw new Error('RecipeTagID is required');
        if (!filtered.TagNumber) throw new Error('TagNumber is required');

        const result = await DatabaseService.db.run(
            `INSERT INTO RecipeVersionTagAssignments (RecipeVersionID, RecipeTagID, TagNumber) VALUES (?, ?, ?)`,
            filtered.RecipeVersionID,
            filtered.RecipeTagID,
            filtered.TagNumber,
        );
        if (!result.lastID) throw new Error('Error assigning recipe tag');
        return result.lastID;
    }

    public static async insertNote(note: { RecipeVersionID: number; NoteNumber: number; NoteText: string }): Promise<number> {
        if (!note.RecipeVersionID) throw new Error('RecipeVersionID is required');
        if (!note.NoteNumber) throw new Error('NoteNumber is required');
        if (!note.NoteText) throw new Error('NoteText is required');

        const result = await DatabaseService.db.run(
            `INSERT INTO Notes (RecipeVersionID, NoteNumber, NoteText) VALUES (?, ?, ?)`,
            note.RecipeVersionID,
            note.NoteNumber,
            note.NoteText
        );
        if (!result.lastID) throw new Error('Error inserting note');
        return result.lastID;
    }

    public static async insertItem(item: Partial<RequiredItemRaw>): Promise<number> {
        const filteredItem: Partial<RequiredItemRaw> = this.filterAllowedColumns(['ItemName'], item);

        if (!filteredItem.ItemName) throw new Error('ItemName is required');

        const result = await DatabaseService.db.run(`INSERT INTO Items (ItemName) VALUES (?)`, filteredItem.ItemName);
        if (!result.lastID) throw new Error('Error inserting item');
        return result.lastID;
    }

    public static async insertRecipeVersionItem(recipeVersionItem: Partial<RecipeVersionItemRaw>): Promise<number> {
        const filteredRecipeVersionItem: Partial<RecipeVersionItemRaw> = this.filterAllowedColumns(['ItemID', 'RecipeVersionID', 'ItemNumber', 'Quantity', 'Sub'], recipeVersionItem);

        if (!filteredRecipeVersionItem.ItemID) throw new Error('ItemID is required');
        if (!filteredRecipeVersionItem.RecipeVersionID) throw new Error('RecipeVersionID is required');
        if (!filteredRecipeVersionItem.ItemNumber) throw new Error('ItemNumber is required');
        if (!filteredRecipeVersionItem.Quantity) throw new Error('Quantity is required');

        const result = await DatabaseService.db.run(
            `INSERT INTO RecipeVersionItems (ItemID, RecipeVersionID, ItemNumber, Quantity, Sub) VALUES (?, ?, ?, ?, ?)`,
            filteredRecipeVersionItem.ItemID,
            filteredRecipeVersionItem.RecipeVersionID,
            filteredRecipeVersionItem.ItemNumber,
            filteredRecipeVersionItem.Quantity,
            filteredRecipeVersionItem.Sub ?? null,
        );
        if (!result.lastID) throw new Error('Error inserting recipe version item');
        return result.lastID;
    }

    public static async insertInstruction(instruction: Partial<InstructionRaw>): Promise<number> {
        const filteredInstruction: Partial<InstructionRaw> = this.filterAllowedColumns(['RecipeVersionID', 'StepNumber', 'StepDetail'], instruction);

        if (!filteredInstruction.RecipeVersionID) throw new Error('RecipeVersionID is required');
        if (!filteredInstruction.StepNumber) throw new Error('StepNumber is required');
        if (!filteredInstruction.StepDetail) throw new Error('StepDetail is required');

        const result = await DatabaseService.db.run(`INSERT INTO Instructions (RecipeVersionID, StepNumber, StepDetail) VALUES (?, ?, ?)`, filteredInstruction.RecipeVersionID, filteredInstruction.StepNumber, filteredInstruction.StepDetail);
        if (!result.lastID) throw new Error('Error inserting instruction');
        return result.lastID;
    }

    public static async insertCart(contents: Array<CartIngredient>): Promise<string> {
        const uuid = uuidv4();
        const result = await DatabaseService.db.run(`INSERT INTO Cart (UUID, Contents) VALUES (?, ?)`, uuid, JSON.stringify(contents));
        if (!result.lastID) throw new Error('Error inserting cart');
        DatabaseService.db.run(`DELETE FROM Cart WHERE CreatedDate < datetime('now', '-7 day')`);
        return uuid;
    }

    // ************ //
    // Public DELETE methods
    // ************ //

    public static async deleteRecipeVersionIngredient(recipeVersionIngredientID: number): Promise<void> {
        await DatabaseService.db.run(`DELETE FROM RecipeVersionIngredients WHERE RecipeVersionIngredientID = ?`, recipeVersionIngredientID);
    }

    public static async deleteRecipeVersionItem(recipeVersionItemID: number): Promise<void> {
        await DatabaseService.db.run(`DELETE FROM RecipeVersionItems WHERE RecipeVersionItemID = ?`, recipeVersionItemID);
    }

    public static async deleteInstruction(instructionID: number): Promise<void> {
        await DatabaseService.db.run(`DELETE FROM Instructions WHERE InstructionID = ?`, instructionID);
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
                Prep: recipeIngredient.Prep || undefined,
                Sub: recipeIngredient.Sub || undefined,
            };
        } catch (error) {
            throw new Error('Error getting recipe ingredient', { cause: error });
        }
    }

    private static async getRecipePantryIngredient(pantryIngredient: RecipeVersionPantryIngredientRaw): Promise<RecipeIngredient> {
        try {
            const ingredient = await DatabaseService.getIngredientById(pantryIngredient.IngredientID);
            if (!ingredient) throw new Error('Item not found');
            return {
                RecipeVersionIngredientID: pantryIngredient.RecipeVersionPantryIngredientID,
                RecipeVersionID: pantryIngredient.RecipeVersionID,
                Ingredient: ingredient,
                Quantity: 0,
                Measurement: '',
            };
        } catch (error) {
            throw new Error('Error getting pantry ingredient', { cause: error });
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
            };
        } catch (error) {
            throw new Error('Error getting recipe item', { cause: error });
        }
    }

    // Utility methods
    private static filterAllowedColumns<T extends object>(allowedColumns: string[], input: T): Partial<T> {
        const validKeys = Object.keys(input).filter(key => allowedColumns.includes(key));
        const output: Partial<T> = {};

        for (const key of validKeys) {
            output[key as keyof T] = input[key as keyof T];
        }

        return output;
    }
}

await DatabaseService.initialize('database.db').catch((error) => {
    console.error(`Error initializing database: ${error}`);
});
