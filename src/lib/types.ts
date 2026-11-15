export interface Tag {
    TagID: number;
    TagName: string;
}

export interface Ingredient {
    IngredientID: number;
    IngredientName: string;
    IsRecipe: boolean;
    RecipeID?: number;
    Tags: Tag[];
}

/** The slice of an ingredient a stage input (and the cart) needs. */
export type StageIngredient = Pick<Ingredient, 'IngredientID' | 'IngredientName' | 'IsRecipe'>;

export interface StageIngredientInput {
    Type: 'ingredient';
    RecipeStageInputID: number;
    InputNumber: number;
    Ingredient: StageIngredient;
    /** Absent together with Measurement for qualitative amounts ("to taste"); Hint is then set. */
    Quantity?: number;
    Measurement?: string;
    Hint?: string;
}

export interface StageReferenceInput {
    Type: 'stage';
    RecipeStageInputID: number;
    InputNumber: number;
    /** StageKey of an earlier stage of the same recipe. */
    SourceStageKey: string;
    Part?: string;
}

export type StageInput = StageIngredientInput | StageReferenceInput;

export interface RecipeStage {
    RecipeStageID: number;
    StageNumber: number;
    StageKey: string;
    Setup: boolean;
    Action: string;
    Hint?: string;
    /** Whole minutes to set a timer to; absent when the stage has no set time. */
    DurationMinutes?: number;
    Inputs: StageInput[];
}

export interface RecipeTable {
    RecipeVersionTableID: number;
    TableNumber: number;
    TableName: string;
    Stages: RecipeStage[];
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
    Sub?: string;
}

export interface RecipeVersion {
    RecipeVersionID: number;
    ParentVersionID?: number;
    VersionComment?: string;
    Description: string;
    Source: string;
    Course: string;
    Cuisine: string;
    PortionQuantity: number;
    PortionDescriptor: string;
    ActiveTimeMinutes: number;
    PassiveTimeMinutes: number;
    ComplexityRating: number;
    MayhemRating: number;
    Tags: string[];
    Tables: RecipeTable[];
    Items: RecipeItem[];
    Notes: string[];
}

export interface Recipe {
    RecipeID: number;
    RecipeName: string;
    MainVersion: RecipeVersion;
}

/** What index pages need: one row per recipe, no stages. */
export interface RecipeSummary {
    RecipeID: number;
    RecipeName: string;
    Course: string;
    Cuisine: string;
    Source: string;
    ActiveTimeMinutes: number;
    PassiveTimeMinutes: number;
    ComplexityRating: number;
    MayhemRating: number;
    PortionQuantity: number;
    PortionDescriptor: string;
    Tags: string[];
}

/** Where the recipes come from, for the header crumb and footer. */
export interface DataInfo {
    /** Short hash of the data repo's HEAD, or null when the data has not been cloned. */
    revision: string | null;
    branch: string | null;
    /** `owner/repo` parsed from the clone URL. */
    repoLabel: string;
}

export interface CartIngredient {
    ingredient: StageIngredient;
    quantity: number;
    measurement: string;
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
