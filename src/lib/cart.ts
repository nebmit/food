import { aggregateIngredients } from "./recipeIngredients";
import type { CartIngredient, Recipe } from "./types";

// The v2 read model changed the stored recipe shape; older entries are ignored.
const CART_KEY = 'CART_V2';
const MERGE_RULES_KEY = 'MERGE_RULES';

/**
 * A merge rule maps a "source" ingredient name to a "target" ingredient name.
 * When building the shopping list, all source quantities get folded into the target.
 * Example: { "unsalted butter": "butter" } means "unsalted butter" rows
 * appear under "butter" on the list.
 */
export type MergeRules = Record<string, string>;

type Pair = {
    recipe: Recipe
    quantity: number
};

function getCart(): Pair[] {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    try {
        const cart: Pair[] = JSON.parse(raw);
        return cart.filter(item => Array.isArray(item?.recipe?.MainVersion?.Tables));
    } catch {
        return [];
    }
}

function setCart(cart: Pair[]) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function setToCart(recipe: Recipe, quantity: number) {
    if (quantity <= 0) return removeFromCart(recipe);

    const productPair = { recipe, quantity };
    const cart = getCart();
    const existingProduct = cart.find(item => item.recipe.RecipeID === productPair.recipe.RecipeID);

    if (existingProduct) {
        existingProduct.quantity = productPair.quantity;
    } else {
        cart.push(productPair);
    }

    setCart(cart);
}

function removeFromCart(recipe: Recipe) {
    let cart = getCart();
    cart = cart.filter(item => item.recipe.RecipeID !== recipe.RecipeID);
    setCart(cart);
}

// --- Merge rules ---

function getMergeRules(): MergeRules {
    const raw = localStorage.getItem(MERGE_RULES_KEY);
    return raw ? JSON.parse(raw) : {};
}

function saveMergeRules(rules: MergeRules) {
    localStorage.setItem(MERGE_RULES_KEY, JSON.stringify(rules));
}

/**
 * Merge `sourceName` into `targetName`. All future shopping lists will
 * combine these under `targetName`.
 */
function addMergeRule(sourceName: string, targetName: string) {
    const rules = getMergeRules();
    rules[sourceName.toLowerCase()] = targetName;
    saveMergeRules(rules);
}

/**
 * Remove a merge rule so the ingredient appears separately again.
 */
function removeMergeRule(sourceName: string) {
    const rules = getMergeRules();
    delete rules[sourceName.toLowerCase()];
    saveMergeRules(rules);
}

/**
 * Resolve the display name for an ingredient, following merge chains.
 */
function resolveIngredientName(name: string, rules: MergeRules): string {
    const seen = new Set<string>();
    let current = name;
    while (rules[current.toLowerCase()] && !seen.has(current.toLowerCase())) {
        seen.add(current.toLowerCase());
        current = rules[current.toLowerCase()];
    }
    return current;
}

// --- Shopping list ---

/**
 * Every ingredient input of every recipe in the cart, scaled to the chosen
 * servings and summed by name and measurement. Qualitative amounts ("to taste")
 * land on the list with quantity 0 and no measurement.
 */
function getCartIngredients(): CartIngredient[] {
    const cart = getCart();
    const rules = getMergeRules();

    const ingredientMap: Record<string, CartIngredient> = {};

    cart.forEach(recipePair => {
        const version = recipePair.recipe.MainVersion;
        const multiplier = recipePair.quantity / version.PortionQuantity;

        for (const entry of aggregateIngredients(version, { includeRecipeIngredients: false })) {
            const resolvedName = resolveIngredientName(entry.ingredient.IngredientName, rules);
            const measurement = entry.measurement ?? '';
            const quantity = entry.quantity === undefined ? 0 : entry.quantity * multiplier;
            const key = `${resolvedName.toLowerCase()}-${measurement}`;

            if (ingredientMap[key]) {
                ingredientMap[key].quantity += quantity;
            } else {
                ingredientMap[key] = {
                    ingredient: { ...entry.ingredient, IngredientName: resolvedName },
                    quantity,
                    measurement,
                };
            }
        }
    });

    return Object.values(ingredientMap);
}

export { addMergeRule, getCart, getCartIngredients, getMergeRules, removeMergeRule, setToCart };
