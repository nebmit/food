import { DatabaseService } from "$lib/server/databaseService";
import type { Ingredient } from "$lib/types";
import { fail } from "@sveltejs/kit";

export const actions = {
    createCart: async ({ request }) => {
        const data = await request.formData();

        const ingredientDataString = data.get("ingredients") as string;
        const ingredientData: {
            ingredient: Ingredient;
            quantity: number;
            measurement: string;
        }[] = JSON.parse(ingredientDataString);

        if (!Array.isArray(ingredientData) || !ingredientData.every(item => {
            return typeof item === "object" &&
                Object.prototype.hasOwnProperty.call(item, "ingredient") &&
                Object.prototype.hasOwnProperty.call(item, "quantity") &&
                Object.prototype.hasOwnProperty.call(item, "measurement");
        })) {
            return fail(400, { ingredientData, error: "Ingredients are missing or invalid." });
        }

        const uuid = await DatabaseService.insertCart(ingredientData);

        return { url: `${process.env.ORIGIN}/cart/${uuid}` };
    }
};
