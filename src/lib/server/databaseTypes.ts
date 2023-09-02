export interface RecipeRaw {
    RecipeID: number;
    RecipeName: string;
    MainVersionID: number;
    PortionQuantity: number;
    PortionDescriptor: string;
    EstimatedTime: number;
    ComplexityRating?: number; // Optional because it can be NULL
    MayhemRating?: number; // Optional because it can be NULL
}

export interface RecipeVersionRaw {
    RecipeVersionID: number;
    ParentVersionID?: number; // Optional because it can be NULL
    VersionComment?: string; // Optional because it can be NULL
}

export interface IngredientRaw {
    IngredientID: number;
    IngredientName: string;
    IsRecipe: boolean;
    RecipeID?: number; // Optional because it can be NULL
}

export interface RecipeIngredientRaw {
    RecipeIngredientID: number;
    RecipeVersionID: number;
    IngredientID: number;
    Quantity: number;
    Measurement?: string; // Optional because it can be NULL
}

export interface InstructionRaw {
    InstructionID: number;
    RecipeVersionID: number;
    StepNumber: number;
    StepDetail: string;
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
