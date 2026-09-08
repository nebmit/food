import fs from 'fs';
import { ItemNotFoundException, ParsingException } from '../types';
import { DatabaseService } from './databaseService';
import type { IngredientRaw, RecipeTagRaw, RequiredItemRaw } from './databaseTypes';
import { parseRecipeYAML, type ParsedRecipe } from './recipeParserYAML';

export function parseRecipeFile(recipePath: string): ParsedRecipe {
    if (!recipePath.endsWith('.yaml')) {
        throw new ParsingException('Only YAML recipe files are supported');
    }
    return parseRecipeYAML(fs.readFileSync(recipePath, 'utf8'));
}

export async function insertParsedRecipe(recipeName: string, parsedRecipe: ParsedRecipe): Promise<number> {
    const versionId = await DatabaseService.insertRecipeVersion(parsedRecipe.Meta);

    for (let tagIndex = 0; tagIndex < parsedRecipe.Tags.length; tagIndex++) {
        const tag = await getOrCreateRecipeTag(parsedRecipe.Tags[tagIndex]);
        await DatabaseService.insertRecipeVersionTagAssignment({
            RecipeVersionID: versionId,
            RecipeTagID: tag.RecipeTagID,
            TagNumber: tagIndex + 1,
        });
    }

    for (let itemIndex = 0; itemIndex < parsedRecipe.Items.length; itemIndex++) {
        const parsedItem = parsedRecipe.Items[itemIndex];
        const item = await getOrCreateItem(parsedItem.ItemName);
        await DatabaseService.insertRecipeVersionItem({
            ItemID: item.ItemID,
            RecipeVersionID: versionId,
            ItemNumber: itemIndex + 1,
            Quantity: parsedItem.Quantity,
            Sub: parsedItem.Sub,
        });
    }

    const stageIds = new Map<string, number>();
    for (let tableIndex = 0; tableIndex < parsedRecipe.Tables.length; tableIndex++) {
        const parsedTable = parsedRecipe.Tables[tableIndex];
        const tableId = await DatabaseService.insertRecipeVersionTable({
            RecipeVersionID: versionId,
            TableNumber: tableIndex + 1,
            TableName: parsedTable.TableName,
        });

        for (let stageIndex = 0; stageIndex < parsedTable.Stages.length; stageIndex++) {
            const parsedStage = parsedTable.Stages[stageIndex];
            const stageId = await DatabaseService.insertRecipeStage({
                RecipeVersionID: versionId,
                RecipeVersionTableID: tableId,
                StageNumber: stageIndex + 1,
                StageKey: parsedStage.StageKey,
                Setup: parsedStage.Setup,
                Action: parsedStage.Action,
                Hint: parsedStage.Hint,
                DurationMinutes: parsedStage.DurationMinutes,
            });
            stageIds.set(parsedStage.StageKey, stageId);

            for (let inputIndex = 0; inputIndex < parsedStage.Inputs.length; inputIndex++) {
                const parsedInput = parsedStage.Inputs[inputIndex];
                if (parsedInput.Type === 'ingredient') {
                    const ingredient = await getOrCreateIngredient(parsedInput.IngredientName);
                    await DatabaseService.insertRecipeStageInput({
                        RecipeStageID: stageId,
                        InputNumber: inputIndex + 1,
                        IngredientID: ingredient.IngredientID,
                        Quantity: parsedInput.Quantity,
                        Measurement: parsedInput.Measurement,
                        Hint: parsedInput.Hint,
                    });
                    continue;
                }

                const sourceStageId = stageIds.get(parsedInput.StageKey);
                if (!sourceStageId) {
                    throw new ParsingException(`Stage '${parsedInput.StageKey}' was not stored before it was referenced`);
                }
                await DatabaseService.insertRecipeStageInput({
                    RecipeStageID: stageId,
                    InputNumber: inputIndex + 1,
                    SourceRecipeStageID: sourceStageId,
                    Part: parsedInput.Part,
                });
            }
        }
    }

    for (let noteIndex = 0; noteIndex < parsedRecipe.Notes.length; noteIndex++) {
        await DatabaseService.insertNote({
            RecipeVersionID: versionId,
            NoteNumber: noteIndex + 1,
            NoteText: parsedRecipe.Notes[noteIndex],
        });
    }

    return await DatabaseService.insertRecipe({ RecipeName: recipeName, MainVersionID: versionId });
}

async function getOrCreateIngredient(name: string): Promise<IngredientRaw> {
    try {
        return await DatabaseService.getIngredientByName(name);
    } catch (error: unknown) {
        if (error instanceof ItemNotFoundException) {
            const id = await DatabaseService.insertIngredient({ IngredientName: name });
            return await DatabaseService.getIngredientById(id);
        }
        throw error;
    }
}

async function getOrCreateItem(name: string): Promise<RequiredItemRaw> {
    try {
        return await DatabaseService.getItemByName(name);
    } catch (error: unknown) {
        if (error instanceof ItemNotFoundException) {
            const id = await DatabaseService.insertItem({ ItemName: name });
            return await DatabaseService.getItemById(id);
        }
        throw error;
    }
}

async function getOrCreateRecipeTag(name: string): Promise<RecipeTagRaw> {
    try {
        return await DatabaseService.getRecipeTagByName(name);
    } catch (error: unknown) {
        if (error instanceof ItemNotFoundException) {
            const id = await DatabaseService.insertRecipeTag({ TagName: name });
            return { RecipeTagID: id, TagName: name };
        }
        throw error;
    }
}

export async function insertRecipeFromFile(recipeName: string, recipePath: string): Promise<number> {
    const parsedRecipe = parseRecipeFile(recipePath);
    return await DatabaseService.runInTransaction(
        async () => await insertParsedRecipe(recipeName, parsedRecipe),
    );
}
