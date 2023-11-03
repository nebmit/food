import { DatabaseService } from "$lib/server/databaseService";
import type { Recipe } from "$lib/types";
import { error, fail } from '@sveltejs/kit';
import path from 'path';
import sharp from 'sharp';

export async function load({ params }) {
    try {
        const recipeId = parseInt(params.RecipeID, 10);
        const recipe: Recipe = await DatabaseService.getRecipeById(recipeId);
        return {
            recipe
        };
    } catch (e) {
        throw error(404, 'Recipe not found');
    }
}

export const actions = {
    modifyRecipe: async ({ request }) => {
        const data = await request.formData();

        const stringRecipeId = data.get("recipeID") as string;
        const name = data.get("name") as string;
        const image = data.get("image") as File;

        if (!name && !image) {
            return fail(400, { name, image, error: "Both name and image are missing." });
        }

        if (image) {
            if (image.type !== "image/png" || image.size > 10000000) {
                return fail(400, { image, error: "Invalid image type or size." });
            }
        }

        if (name) {
            const invalidName = name.length > 50 || name.length < 3 || name.match(/[^a-zA-Z0-9 ]/);
            if (invalidName) {
                return fail(400, { name, error: "Invalid name format." });
            }
        }

        if (!stringRecipeId) {
            return fail(400, { stringRecipeId, error: "Recipe ID is missing." });
        }
        const recipeId = parseInt(stringRecipeId, 10);
        if (isNaN(recipeId)) {
            return fail(400, { recipeId, error: "Invalid recipe ID." });
        }

        const recipe: Recipe = await DatabaseService.getRecipeById(recipeId);
        if (!recipe) {
            return fail(404, { recipeId, error: "Recipe not found." });
        }

        if (image) {
            const imagePath = path.join('static', 'images', 'recipes', `${recipeId}.webp`);
            const sharpInstance = sharp(Buffer.from(await image.arrayBuffer()));
            sharpInstance
                .resize(800)
                .webp({ quality: 80 })
                .toFile(imagePath);
        }

        if (name) {
            await DatabaseService.patchRecipe(recipeId, {
                RecipeName: name
            });
        }

        return { success: true };
    }
};