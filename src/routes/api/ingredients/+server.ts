import { getIngredientNames } from '$lib/server/dataService';
import { json } from '@sveltejs/kit';

export async function GET() {
    const names = await getIngredientNames();
    return json(names);
}
