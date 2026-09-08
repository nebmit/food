import { DatabaseService } from '$lib/server/databaseService';
import { ItemNotFoundException } from '$lib/types';
import { error, redirect } from '@sveltejs/kit';

/** Sends the visitor to a random recipe page. */
export async function GET() {
    let name: string;
    try {
        name = await DatabaseService.getRandomRecipeName();
    } catch (e) {
        if (e instanceof ItemNotFoundException) error(404, 'No recipes yet');
        throw e;
    }
    redirect(303, `/recipe/${encodeURIComponent(name)}`);
}
