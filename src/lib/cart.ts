import type { CartIngredient, Recipe } from "./types";

const CART_KEY = 'CART';
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
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
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

function getCartIngredients(): CartIngredient[] {
    const cart = getCart();
    const rules = getMergeRules();

    const ingredientMap: Record<string, CartIngredient> = {};

    cart.forEach(recipePair => {
        const multiplier = recipePair.quantity / recipePair.recipe.MainVersion.PortionQuantity;
        recipePair.recipe.MainVersion.Ingredients.forEach(recipeIngredient => {
            if (recipeIngredient.Ingredient.IsRecipe) return;

            const rawName = recipeIngredient.Ingredient.IngredientName;
            const resolvedName = resolveIngredientName(rawName, rules);
            const quantity = recipeIngredient.Quantity;
            const measurement = recipeIngredient.Measurement;
            const key = `${resolvedName.toLowerCase()}-${measurement}`;

            if (ingredientMap[key]) {
                ingredientMap[key].quantity += quantity * multiplier;
            } else {
                ingredientMap[key] = {
                    ingredient: { ...recipeIngredient.Ingredient, IngredientName: resolvedName },
                    quantity: quantity * multiplier,
                    measurement: measurement,
                };
            }
        });
    });

    return Object.values(ingredientMap);
}

export { addMergeRule, getCart, getCartIngredients, getMergeRules, removeMergeRule, setToCart };
