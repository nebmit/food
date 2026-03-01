import { dev } from '$app/environment';
import { updateDatabase } from '$lib/server/dataService';
import { json, error } from '@sveltejs/kit';

export async function GET() {
    if (!dev) {
        error(404);
    }

    await updateDatabase();
    return json({ status: 'seeded' });
}
