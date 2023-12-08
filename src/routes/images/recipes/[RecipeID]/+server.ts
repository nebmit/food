import fs from 'fs';
import path from 'path';

export async function GET({ params }) {
    const recipeID = params.RecipeID;
    const imagePath = path.join('upload', 'images', 'recipes', `${recipeID}.webp`);
    if (!fs.existsSync(imagePath)) {
        return new Response(null, { status: 404 });
    }
    return new Response(fs.readFileSync(imagePath), {
        headers: {
            'Content-Type': 'image/webp'
        }
    });
}
