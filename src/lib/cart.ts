import type { CartIngredient, Recipe } from "./types";

const CART_KEY = 'CART';

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

function getCartIngredients(): CartIngredient[] {
    const cart = getCart();

    const ingredientMap: { [key: number]: CartIngredient } = {};

    cart.forEach(recipePair => {
        const multiplier = recipePair.quantity / recipePair.recipe.MainVersion.PortionQuantity;
        recipePair.recipe.MainVersion.Ingredients.forEach(recipeIngredient => {
            if (recipeIngredient.Ingredient.IsRecipe) return;

            const id = recipeIngredient.Ingredient.IngredientID;
            const quantity = recipeIngredient.Quantity;
            const measurement = recipeIngredient.Measurement;

            if (ingredientMap[id]) {
                ingredientMap[id].quantity += quantity * multiplier;
            } else {
                ingredientMap[id] = {
                    ingredient: recipeIngredient.Ingredient,
                    quantity: quantity * multiplier,
                    measurement: measurement
                };
            }
        });
    });

    const aggregatedIngredients = Object.values(ingredientMap);
    return aggregatedIngredients;
}

export { getCart, getCartIngredients, setToCart };
