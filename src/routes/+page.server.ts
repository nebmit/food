import { DatabaseService } from "$lib/server/databaseService";
import type { RecipeSummary } from "$lib/types";

export async function load() {
    try {
        const summaries: RecipeSummary[] = await DatabaseService.getRecipeSummaries();
        return { summaries };
    } catch (error) {
        console.error("Error loading recipe summaries:", error);
        return { summaries: [] as RecipeSummary[] };
    }
}
