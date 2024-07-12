import * as dataService from "$lib/server/dataService";
import { DatabaseService } from "$lib/server/databaseService.js";
import { insertRecipeFromFile } from "$lib/server/recipeService";
import * as crypto from "crypto";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const WEBHOOK_SECRET: string = process.env.WEBHOOK_SECRET || "";

const verify_signature = async (req: Request) => {
    const signature = crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(JSON.stringify(await req.json()))
        .digest("hex");
    const trusted = Buffer.from(`sha256=${signature}`, 'ascii');
    const untrusted = Buffer.from(req.headers.get("x-hub-signature-256") || '', 'ascii');
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

    const rawRecipes = dataService.getRecipeFiles();
    for (const rawRecipe of rawRecipes) {
        // Insert the recipe into the database
        try {
            await insertRecipeFromFile(rawRecipe.name, rawRecipe.instructionPath);
        } catch (error) {
            console.error(`Error inserting recipe ${rawRecipe.name}:`, error);
        }

        // Read the image
        const image = fs.readFileSync(rawRecipe.imagePath);
        const targetImagePath = path.join('upload', 'images', 'recipes', `${rawRecipe.name}.webp`);

        // Create the directory if it does not exist
        const targetImageDirectory = path.dirname(targetImagePath);
        if (!fs.existsSync(targetImageDirectory)) {
            fs.mkdirSync(targetImageDirectory, { recursive: true });
        }

        // Copy the image to the upload directory
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
