import fs from 'fs';
import { packageUpSync } from 'package-up';
import path from 'path';
import sharp from 'sharp';
import { simpleGit } from 'simple-git';
import { ParsingException, type DataInfo } from '../types';
import { DatabaseService } from './databaseService';
import { insertParsedRecipe, parseRecipeFile } from './recipeService';

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

const projectRoot = path.dirname(packageUpSync() || '/');
const localPath = path.join(projectRoot, 'data');
const schemaPath = path.join(projectRoot, 'db_schema.sql');

const repoLabel = (() => {
    const match = repoUrl.match(/([^/:]+\/[^/]+?)(?:\.git)?\/?$/);
    return match ? match[1] : repoUrl;
})();

let cachedDataInfo: DataInfo | null = null;

async function readDataInfo(): Promise<DataInfo> {
    if (!fs.existsSync(localPath)) {
        return { revision: null, branch: null, repoLabel };
    }
    const repo = git.cwd(localPath);
    const revision = (await repo.revparse(['--short', 'HEAD'])).trim();
    const branch = (await repo.revparse(['--abbrev-ref', 'HEAD'])).trim();
    return { revision, branch, repoLabel };
}

/**
 * Revision and branch of the cloned data repository, for the page footer.
 * Cached; refreshed on every seed.
 */
export async function getDataInfo(): Promise<DataInfo> {
    if (!cachedDataInfo) {
        cachedDataInfo = await readDataInfo().catch(error => {
            console.warn(`Could not read data repository info: ${error}`);
            return { revision: null, branch: null, repoLabel };
        });
    }
    return cachedDataInfo;
}

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
        if (!fs.lstatSync(recipePath).isDirectory()) continue;

        const entries = fs.readdirSync(recipePath);
        const instructionFile = entries.find(entry => entry === 'recipe.yaml');
        // The corpus is not consistent about the extension's case (image.WEBP exists).
        const imageFile = entries.find(entry => /^image\.webp$/i.test(entry));

        if (!instructionFile || !imageFile) {
            const reason = !instructionFile ? 'no recipe.yaml' : 'no image.webp';
            console.warn(`Skipping recipes/${element}: ${reason}`);
            continue;
        }

        array.push({
            name: element,
            instructionPath: path.join(recipePath, instructionFile),
            imagePath: path.join(recipePath, imageFile)
        });
    }

    return array;
}

export async function updateDatabase() {
    // Pull the latest data
    await update();

    // Parse everything before touching the database, so a malformed recipe
    // aborts before the old data is dropped. Name the culprit.
    const rawRecipes = getRecipeFiles();
    const parsedRecipes = rawRecipes.map(rawRecipe => {
        try {
            return {
                name: rawRecipe.name,
                recipe: parseRecipeFile(rawRecipe.instructionPath),
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new ParsingException(`${rawRecipe.name}: ${message}`);
        }
    });
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await DatabaseService.runInTransaction(async () => {
        await DatabaseService.rebuildRecipeStorage(schema);
        for (const parsedRecipe of parsedRecipes) {
            await insertParsedRecipe(parsedRecipe.name, parsedRecipe.recipe);
        }
    });

    for (const rawRecipe of rawRecipes) {
        // Read the image
        const image = fs.readFileSync(rawRecipe.imagePath);
        const targetImagePath = path.join('upload', 'images', 'recipes', `${rawRecipe.name}.webp`);

        // Create the directory if it does not exist
        const targetImageDirectory = path.dirname(targetImagePath);
        if (!fs.existsSync(targetImageDirectory)) {
            fs.mkdirSync(targetImageDirectory, { recursive: true });
        }

        // Copy the image to the upload directory
        await sharp(image)
            .resize(800)
            .webp({ quality: 80 })
            .toFile(targetImagePath);
    }

    // Refresh the caches after seeding
    cachedIngredientNames = await DatabaseService.getAllIngredientNames();
    cachedDataInfo = null;
    await getDataInfo();
}
