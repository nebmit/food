import fs from 'fs';
import { packageUpSync } from 'package-up';
import path from 'path';
import { simpleGit } from 'simple-git';

const git = simpleGit();
const repoUrl = process.env.GIT_REPO_URL || 'https://github.com/nebmit/food-data.git';

const localPath = path.join(path.dirname(packageUpSync() || '/'), 'data');


export async function update() {
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

export function getRawRecipes(): Array<{ name: string, instructions: string, imagePath: string }> {
    const array = new Array<{ name: string, instructions: string, imagePath: string }>();

    const recipesPath = `${localPath}/recipes`;

    // Iterate over all folders within recipes
    const elements = fs.readdirSync(recipesPath);
    for (const element of elements) {
        if (fs.lstatSync(`${recipesPath}/${element}`).isDirectory()) {
            const instructionPath = `${recipesPath}/${element}/recipe.txt`;
            const imagePath = `${recipesPath}/${element}/image.webp`;

            if (!fs.existsSync(instructionPath) || !fs.existsSync(imagePath)) {
                continue;
            }

            const instructions = fs.readFileSync(instructionPath, 'utf8');

            array.push({
                name: element,
                instructions: instructions,
                imagePath: imagePath
            });
        }
    }

    return array;
}
