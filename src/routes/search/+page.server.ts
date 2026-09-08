import { decodePath } from "$lib/facets";
import { DatabaseService } from "$lib/server/databaseService";
import type { RecipeSummary } from "$lib/types";

export async function load({ url }) {
    const path = decodePath(url.searchParams.get("f"));
    const query = url.searchParams.get("q") ?? "";

    try {
        const summaries: RecipeSummary[] = await DatabaseService.getRecipeSummaries();
        return { summaries, path, query };
    } catch (error) {
        console.error("Error loading recipe summaries:", error);
        return { summaries: [] as RecipeSummary[], path, query };
    }
}
