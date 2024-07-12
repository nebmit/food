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

export function getRecipeFiles(): Array<{ name: string, instructionPath: string, imagePath: string }> {
    const array = new Array<{ name: string, instructionPath: string, imagePath: string }>();

    const recipesPath = `${localPath}/recipes`;

    // Iterate over all folders within recipes
    const elements = fs.readdirSync(recipesPath);
    for (const element of elements) {
        const recipePath = path.join(recipesPath, element);
        if (fs.lstatSync(recipePath).isDirectory()) {
            const instructionPathTXT = path.join(recipePath, 'recipe.txt');
            const instructionPathYAML = path.join(recipePath, 'recipe.yaml');
            const imagePath = path.join(recipePath, 'image.webp');

            if (!fs.existsSync(imagePath)) {
                continue;
            }

            let instructions = '';
            if (fs.existsSync(instructionPathYAML)) {
                instructions = instructionPathYAML;
            } else if (fs.existsSync(instructionPathTXT)) {
                instructions = instructionPathTXT;
            } else {
                continue;
            }

            array.push({
                name: element,
                instructionPath: instructions,
                imagePath: imagePath
            });
        }
    }

    return array;
}
