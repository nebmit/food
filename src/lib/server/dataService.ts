import fs from 'fs';
import { packageUpSync } from 'package-up';
import path from 'path';
import sharp from 'sharp';
import { simpleGit } from 'simple-git';
import { DatabaseService } from './databaseService';
import { insertRecipeFromFile } from './recipeService';

let cachedIngredientNames: string[] | null = null;

/**
 * Returns the cached list of ingredient names.
 * Lazily queries the database on first access; refreshed on every seed.
 */
export async function getIngredientNames(): Promise<string[]> {
    if (!cachedIngredientNames) {
        cachedIngredientNames = await DatabaseService.getAllIngredientNames();
    }
    return cachedIngredientNames;
}

const git = simpleGit();
const repoUrl = process.env.GIT_REPO_URL || 'https://github.com/nebmit/food-data.git';

const localPath = path.join(path.dirname(packageUpSync() || '/'), 'data');


async function update() {
    // Check if the directory exists
    if (fs.existsSync(localPath)) {
        // If exists, fetch all branches and set the directory to the repository
        const repo = git.cwd(localPath);
        await repo.fetch();

        // Pull the latest changes from the current branch's upstream branch
        await repo.pull();
    } else {
        // If not exists, clone the repository
        await git.clone(repoUrl, localPath);
    }
}

function getRecipeFiles(): Array<{ name: string, instructionPath: string, imagePath: string }> {
    const array = new Array<{ name: string, instructionPath: string, imagePath: string }>();

    const recipesPath = `${localPath}/recipes`;

    // Iterate over all folders within recipes
    const elements = fs.readdirSync(recipesPath);
    for (const element of elements) {
        const recipePath = path.join(recipesPath, element);
        if (fs.lstatSync(recipePath).isDirectory()) {
            const instructionPath = path.join(recipePath, 'recipe.yaml');
            const imagePath = path.join(recipePath, 'image.webp');

            if (!fs.existsSync(imagePath) || !fs.existsSync(instructionPath)) {
                continue;
            }

            array.push({
                name: element,
                instructionPath: instructionPath,
                imagePath: imagePath
            });
        }
    }

    return array;
}

export async function updateDatabase() {
    // Pull the latest data
    await update();

    // Clear existing database recipes
    await DatabaseService.clearRecipes();

    const rawRecipes = getRecipeFiles();
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

    // Refresh the ingredient name cache after seeding
    cachedIngredientNames = await DatabaseService.getAllIngredientNames();
}
