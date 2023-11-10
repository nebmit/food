import { DatabaseService } from "$lib/server/databaseService";
import { ItemNotFoundException } from "$lib/types.js";
import { error } from "@sveltejs/kit";

export const load = async ({ params }) => {
    const { CartID } = params;

    try {
        const cart = await DatabaseService.getCartByUUID(CartID);
        return {
            cart
        };
    } catch (e) {
        if (e instanceof ItemNotFoundException) {
            throw error(404, 'Cart not found');
        }
        throw e;
    }
};