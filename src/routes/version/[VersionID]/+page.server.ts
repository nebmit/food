import { DatabaseService } from "$lib/server/databaseService";
import type { RecipeVersionIngredientRaw, RecipeVersionRaw } from "$lib/server/databaseTypes.js";
import type { Instruction, RecipeVersion } from "$lib/types";
import { error, fail } from '@sveltejs/kit';

export async function load({ params }) {
    try {
        const RecipeVersionID = parseInt(params.VersionID);
        const recipeVersion: RecipeVersion = await DatabaseService.getRecipeVersionById(RecipeVersionID);
        return {
            recipeVersion
        };
    } catch (e) {
        throw error(404, 'Not found');
    }
}

export const actions = {
    removeIngredient: async ({ request }) => {
        const data = await request.formData();

        const recipeVersionIngredientID = parseInt(data.get("recipeVersionIngredientID") as string);

        if (!recipeVersionIngredientID) {
            return fail(400, { error: "Ingredient ID is required." });
        }

        DatabaseService.deleteRecipeVersionIngredient(recipeVersionIngredientID);
    },
    removeItem: async ({ request }) => {
        const data = await request.formData();

        const recipeVersionItemID = parseInt(data.get("recipeVersionItemID") as string);

        if (!recipeVersionItemID) {
            return fail(400, { error: "Item ID is required." });
        }

        DatabaseService.deleteRecipeVersionItem(recipeVersionItemID);
    },
    removeInstruction: async ({ request }) => {
        const data = await request.formData();

        const instructionID = parseInt(data.get("instructionID") as string);

        if (!instructionID) {
            return fail(400, { error: "Instruction ID is required." });
        }

        DatabaseService.deleteInstruction(instructionID);
    },
    saveVersion: async ({ request }) => {
        const data = await request.formData();

        const recipeVersionID = parseInt(data.get("recipeVersionID") as string);
        const activeTimeMinutes = parseInt(data.get("activeTimeMinutes") as string);
        const passiveTimeMinutes = parseInt(data.get("passiveTimeMinutes") as string);
        const complexityRating = parseInt(data.get("complexityRating") as string);
        const mayhemRating = parseInt(data.get("mayhemRating") as string);
        const portionQuantity = parseInt(data.get("portionQuantity") as string);
        const portionDescriptor = data.get("portionDescriptor") as string;
        const versionComment = data.get("versionComment") as string;

        if (!recipeVersionID) {
            return fail(400, { error: "Recipe Version ID is required." });
        }

        if (!activeTimeMinutes) {
            return fail(400, { error: "Active Time Minutes is required." });
        }

        if (!passiveTimeMinutes) {
            return fail(400, { error: "Passive Time Minutes is required." });
        }

        if (!complexityRating) {
            return fail(400, { error: "Complexity Rating is required." });
        }

        if (!mayhemRating) {
            return fail(400, { error: "Mayhem Rating is required." });
        }

        if (!portionQuantity) {
            return fail(400, { error: "Portion Quantity is required." });
        }

        if (!portionDescriptor) {
            return fail(400, { error: "Portion Descriptor is required." });
        }

        if (!versionComment) {
            return fail(400, { error: "Version Comment is required." });
        }

        const recipeVersion: Partial<RecipeVersionRaw> = {
            ActiveTimeMinutes: activeTimeMinutes,
            PassiveTimeMinutes: passiveTimeMinutes,
            ComplexityRating: complexityRating,
            MayhemRating: mayhemRating,
            PortionQuantity: portionQuantity,
            PortionDescriptor: portionDescriptor,
            VersionComment: versionComment
        };

        DatabaseService.patchRecipeVersion(recipeVersionID, recipeVersion);
    },
    saveInstruction: async ({ request }) => {
        const data = await request.formData();

        const instructionID = parseInt(data.get("instructionID") as string);
        const stepDetail = data.get("stepDetail") as string;

        if (!instructionID) {
            return fail(400, { error: "Instruction ID is required." });
        }

        if (!stepDetail) {
            return fail(400, { error: "Step Detail is required." });
        }

        const instruction: Partial<Instruction> = {
            StepDetail: stepDetail
        };

        DatabaseService.patchInstruction(instructionID, instruction);
    },
    saveIngredient: async ({ request }) => {
        const data = await request.formData();

        const recipeVersionIngredientID = parseInt(data.get("recipeVersionIngredientID") as string);
        const measurement = data.get("measurement") as string;
        const quantity = parseInt(data.get("quantity") as string);

        if (!recipeVersionIngredientID) {
            return fail(400, { error: "Ingredient ID is required." });
        }

        if (!measurement) {
            return fail(400, { error: "Measurement is required." });
        }

        if (!quantity) {
            return fail(400, { error: "Quantity is required." });
        }

        const ingredient: Partial<RecipeVersionIngredientRaw> = {
            Measurement: measurement,
            Quantity: quantity
        };

        DatabaseService.patchRecipeVersionIngredient(recipeVersionIngredientID, ingredient);
    },
    saveItem: async ({ request }) => {
        const data = await request.formData();

        const recipeVersionItemID = parseInt(data.get("recipeVersionItemID") as string);
        const quantity = parseInt(data.get("quantity") as string);

        if (!recipeVersionItemID) {
            return fail(400, { error: "Item ID is required." });
        }

        if (!quantity) {
            return fail(400, { error: "Quantity is required." });
        }

        const item: Partial<RecipeVersionIngredientRaw> = {
            Quantity: quantity
        };

        DatabaseService.patchRecipeVersionItem(recipeVersionItemID, item);
    }
};