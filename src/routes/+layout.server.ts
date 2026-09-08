import { getDataInfo } from '$lib/server/dataService';
import { DatabaseService } from '$lib/server/databaseService';

export async function load({ locals }) {
    const [dataInfo, recipeCount] = await Promise.all([
        getDataInfo(),
        DatabaseService.getRecipeCount().catch(error => {
            console.error('Could not count recipes:', error);
            return 0;
        }),
    ]);

    return {
        user: locals.user,
        dataInfo,
        recipeCount,
    };
}
