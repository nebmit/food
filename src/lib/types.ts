export interface Tag {
    TagID: number;
    TagName: string;
}

export interface Instruction {
    InstructionID: number;
    RecipeVersionID: number;
    StepNumber: number;
    StepDetail: string;
}

export interface Ingredient {
    IngredientID: number;
    IngredientName: string;
    IsRecipe: boolean;
    RecipeID?: number;
    Tags: Tag[];
}

export interface RecipeIngredient {
    RecipeVersionIngredientID: number;
    RecipeVersionID: number;
    Ingredient: Ingredient;
    Quantity: number;
    Measurement: string;
    Prep?: string;
    Sub?: string;
}

export interface Item {
    ItemID: number;
    ItemName: string;
}

export interface RecipeItem {
    RecipeVersionItemID: number;
    RecipeVersionID: number;
    Item: Item;
    Quantity: number;
}

export interface RecipeVersion {
    RecipeVersionID: number;
    ParentVersionID?: number;
    VersionComment?: string;
    Description: string;
    Source: string;
    Cuisine: string;
    PortionQuantity: number;
    PortionDescriptor: string;
    ActiveTimeMinutes: number;
    PassiveTimeMinutes: number;
    ComplexityRating?: number;
    MayhemRating?: number;
    Ingredients: RecipeIngredient[];
    PantryIngredients: RecipeIngredient[];
    Items: RecipeItem[];
    Instructions: Instruction[];
    Notes: string[];
}

export interface Recipe {
    RecipeID: number;
    RecipeName: string;
    MainVersion: RecipeVersion;
}

export interface CartIngredient {
    ingredient: Ingredient,
    quantity: number,
    measurement: string
}

export class ItemNotFoundException extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'ItemNotFoundException';
        Object.setPrototypeOf(this, ItemNotFoundException.prototype);
    }
}

export class ParsingException extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'ParsingException';
        Object.setPrototypeOf(this, ParsingException.prototype);
    }
}
