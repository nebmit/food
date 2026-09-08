export interface RecipeRaw {
    RecipeID: number;
    RecipeName: string;
    MainVersionID: number;
}

export interface RecipeVersionRaw {
    RecipeVersionID: number;
    ParentVersionID?: number;
    VersionComment?: string;
    SchemaVersion: number;
    Description: string;
    Source: string;
    Cuisine: string;
    PortionQuantity: number;
    PortionDescriptor: string;
    ActiveTimeMinutes: number;
    PassiveTimeMinutes: number;
    ComplexityRating: number;
    MayhemRating: number;
}

export interface IngredientRaw {
    IngredientID: number;
    IngredientName: string;
    IsRecipe: boolean;
    RecipeID?: number;
}

export interface RecipeVersionTableRaw {
    RecipeVersionTableID: number;
    RecipeVersionID: number;
    TableNumber: number;
    TableName: string;
}

export interface RecipeStageRaw {
    RecipeStageID: number;
    RecipeVersionID: number;
    RecipeVersionTableID: number;
    StageNumber: number;
    StageKey: string;
    Setup: boolean;
    Action: string;
    Hint?: string;
}

export interface RecipeStageInputRaw {
    RecipeStageInputID: number;
    RecipeStageID: number;
    InputNumber: number;
    IngredientID?: number;
    SourceRecipeStageID?: number;
    Quantity?: number;
    Measurement?: string;
    Hint?: string;
    Part?: string;
}

export interface RequiredItemRaw {
    ItemID: number;
    ItemName: string;
}

export interface RecipeVersionItemRaw {
    RecipeVersionItemID: number;
    RecipeVersionID: number;
    ItemID: number;
    ItemNumber: number;
    Quantity: number;
    Sub?: string;
}

export interface RecipeTagRaw {
    RecipeTagID: number;
    TagName: string;
}

export interface RecipeVersionTagAssignmentRaw {
    RecipeVersionTagAssignmentID: number;
    RecipeVersionID: number;
    RecipeTagID: number;
    TagNumber: number;
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
