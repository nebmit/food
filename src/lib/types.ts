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
    Measurement?: string;
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
    PortionQuantity: number;
    PortionDescriptor: string;
    ActiveTimeMinutes: number;
    PassiveTimeMinutes: number;
    ComplexityRating?: number;
    MayhemRating?: number;
    Ingredients: RecipeIngredient[];
    Items: RecipeItem[];
    Instructions: Instruction[];
}

export interface Recipe {
    RecipeID: number;
    RecipeName: string;
    MainVersion: RecipeVersion;
}

export class ItemNotFoundException extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'ItemNotFoundException';
        Object.setPrototypeOf(this, ItemNotFoundException.prototype);
    }
}
