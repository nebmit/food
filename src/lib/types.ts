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
    RecipeIngredientID: number;
    RecipeVersionID: number;
    Ingredient: Ingredient;
    Quantity: number;
    Measurement?: string;
}

export interface RecipeVersion {
    RecipeVersionID: number;
    ParentVersionID?: number;
    VersionComment?: string;
    Ingredients: RecipeIngredient[];
    Instructions: Instruction[];
}

export interface Recipe {
    RecipeID: number;
    RecipeName: string;
    MainVersion: RecipeVersion;
    PortionQuantity: number;
    PortionDescriptor: string;
    ComplexityRating?: number;
    MayhemRating?: number;
}