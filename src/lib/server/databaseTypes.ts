export interface RecipeRaw {
    RecipeID: number;
    RecipeName: string;
    MainVersionID: number;
}

export interface RecipeVersionRaw {
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
}

export interface IngredientRaw {
    IngredientID: number;
    IngredientName: string;
    IsRecipe: boolean;
    RecipeID?: number;
}

export interface RecipeVersionIngredientRaw {
    RecipeVersionIngredientID: number;
    RecipeVersionID: number;
    IngredientID: number;
    Quantity: number;
    Measurement: string;
    Prep?: string;
    Sub?: string;
}

export interface RecipeVersionPantryIngredientRaw {
    RecipeVersionPantryIngredientID: number;
    RecipeVersionID: number;
    IngredientID: number;
    Quantity: number;
    Measurement: string;
}

export interface RequiredItemRaw {
    ItemID: number;
    ItemName: string;
}

export interface RecipeVersionItemRaw {
    RecipeVersionItemID: number;
    RecipeVersionID: number;
    ItemID: number;
    Quantity: number;
}

export interface InstructionRaw {
    InstructionID: number;
    RecipeVersionID: number;
    StepNumber: number;
    StepDetail: string;
}

export interface NoteRaw {
    NoteID: number;
    RecipeVersionID: number;
    NoteNumber: number;
    NoteText: string;
}

export interface IngredientTagRaw {
    TagID: number;
    TagName: string;
}

export interface IngredientTagAssignmentRaw {
    AssignmentID: number;
    IngredientID: number;
    TagID: number;
}
