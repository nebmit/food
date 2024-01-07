import * as dataService from "$lib/server/dataService";
import { DatabaseService } from "$lib/server/databaseService.js";
import { processAndInsertRecipeFromString } from "$lib/server/recipeService";
import * as crypto from "crypto";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const WEBHOOK_SECRET: string = process.env.WEBHOOK_SECRET || "";

const verify_signature = async (req: Request) => {
    const signature = crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest("hex");
    let trusted = Buffer.from(`sha256=${signature}`, 'ascii');
    let untrusted = Buffer.from(req.headers.get("x-hub-signature-256") || '', 'ascii');
    if (trusted.length !== untrusted.length) {
        return false;
    }
    return crypto.timingSafeEqual(trusted, untrusted);
};

async function updateDatabase() {
    // Pull the latest data
    await dataService.update();

    // Clear existing database recipes
    await DatabaseService.clearRecipes();

    const rawRecipes = dataService.getRawRecipes();
    for (const rawRecipe of rawRecipes) {
        // Insert the recipe into the database
        const recipeId = await processAndInsertRecipeFromString(rawRecipe.name, rawRecipe.instructions);

        // Upload the image to the cloud
        const image = fs.readFileSync(rawRecipe.imagePath);
        const targetImagePath = path.join('upload', 'images', 'recipes', `${recipeId}.webp`);
        const sharpInstance = sharp(image);
        sharpInstance
            .resize(800)
            .webp({ quality: 80 })
            .toFile(targetImagePath);
    }
}

let isUpdating = false;
async function debouncedUpdateDatabase() {
    if (isUpdating) {
        return;
    }

    isUpdating = true;

    try {
        await updateDatabase();
    } catch (error) {
        console.error('Error updating database:', error);
    } finally {
        isUpdating = false;
    }
}

export async function POST({ request }) {
    // Verify the webhook signature
    if (! await verify_signature(request)) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Update the database
    debouncedUpdateDatabase();


    // Return a success response
    return new Response(null, { status: 200 });
}
