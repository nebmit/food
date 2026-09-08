CREATE TABLE IF NOT EXISTS RecipeVersions (
    RecipeVersionID INTEGER PRIMARY KEY,
    ParentVersionID INTEGER,
    VersionComment TEXT,
    SchemaVersion INTEGER NOT NULL CHECK (SchemaVersion = 2),
    Description TEXT NOT NULL DEFAULT '',
    Source TEXT NOT NULL DEFAULT '',
    Cuisine TEXT NOT NULL DEFAULT '',
    PortionQuantity INTEGER NOT NULL CHECK (PortionQuantity > 0),
    PortionDescriptor TEXT NOT NULL,
    ActiveTimeMinutes INTEGER NOT NULL CHECK (ActiveTimeMinutes >= 0),
    PassiveTimeMinutes INTEGER NOT NULL CHECK (PassiveTimeMinutes >= 0),
    ComplexityRating INTEGER NOT NULL CHECK (ComplexityRating BETWEEN 1 AND 5),
    MayhemRating INTEGER NOT NULL CHECK (MayhemRating BETWEEN 1 AND 5),
    FOREIGN KEY (ParentVersionID) REFERENCES RecipeVersions(RecipeVersionID)
);

CREATE TABLE IF NOT EXISTS Recipes (
    RecipeID INTEGER PRIMARY KEY,
    RecipeName TEXT NOT NULL UNIQUE,
    MainVersionID INTEGER NOT NULL,
    FOREIGN KEY (MainVersionID) REFERENCES RecipeVersions(RecipeVersionID)
);

CREATE TABLE IF NOT EXISTS Ingredients (
    IngredientID INTEGER PRIMARY KEY,
    IngredientName TEXT NOT NULL UNIQUE,
    IsRecipe BOOLEAN NOT NULL DEFAULT 0,
    RecipeID INTEGER,
    FOREIGN KEY (RecipeID) REFERENCES Recipes(RecipeID)
);

-- Cooking-for-Engineers flow: ordered tables of stages, each stage consuming
-- ingredient inputs and earlier stages. The grid layout is computed at render
-- time (src/lib/cookingTable.ts); no row, column or span is stored.
CREATE TABLE IF NOT EXISTS RecipeVersionTables (
    RecipeVersionTableID INTEGER PRIMARY KEY,
    RecipeVersionID INTEGER NOT NULL,
    TableNumber INTEGER NOT NULL CHECK (TableNumber > 0),
    TableName TEXT NOT NULL,
    UNIQUE (RecipeVersionID, TableNumber),
    FOREIGN KEY (RecipeVersionID) REFERENCES RecipeVersions(RecipeVersionID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS RecipeStages (
    RecipeStageID INTEGER PRIMARY KEY,
    RecipeVersionID INTEGER NOT NULL,
    RecipeVersionTableID INTEGER NOT NULL,
    StageNumber INTEGER NOT NULL CHECK (StageNumber > 0),
    StageKey TEXT NOT NULL,
    Setup BOOLEAN NOT NULL DEFAULT 0 CHECK (Setup IN (0, 1)),
    Action TEXT NOT NULL,
    Hint TEXT,
    UNIQUE (RecipeVersionID, StageKey),
    UNIQUE (RecipeVersionTableID, StageNumber),
    FOREIGN KEY (RecipeVersionID) REFERENCES RecipeVersions(RecipeVersionID) ON DELETE CASCADE,
    FOREIGN KEY (RecipeVersionTableID) REFERENCES RecipeVersionTables(RecipeVersionTableID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS RecipeStageInputs (
    RecipeStageInputID INTEGER PRIMARY KEY,
    RecipeStageID INTEGER NOT NULL,
    InputNumber INTEGER NOT NULL CHECK (InputNumber > 0),
    IngredientID INTEGER,
    SourceRecipeStageID INTEGER,
    Quantity REAL,
    Measurement TEXT,
    Hint TEXT,
    Part TEXT,
    UNIQUE (RecipeStageID, InputNumber),
    CHECK (
        (IngredientID IS NOT NULL AND SourceRecipeStageID IS NULL)
        OR (IngredientID IS NULL AND SourceRecipeStageID IS NOT NULL)
    ),
    CHECK (
        (Quantity IS NULL AND Measurement IS NULL)
        OR (Quantity IS NOT NULL AND Measurement IS NOT NULL)
    ),
    CHECK (Quantity IS NULL OR Quantity > 0),
    CHECK (
        Measurement IS NULL OR Measurement IN (
            'grams', 'ml', 'unit', 'teaspoon', 'tablespoon', 'clove',
            'pinch', 'can', 'bunch', 'slice', 'packet', 'leaf'
        )
    ),
    CHECK (IngredientID IS NOT NULL OR (Quantity IS NULL AND Measurement IS NULL AND Hint IS NULL)),
    CHECK (SourceRecipeStageID IS NOT NULL OR Part IS NULL),
    CHECK (IngredientID IS NULL OR Quantity IS NOT NULL OR Hint IS NOT NULL),
    FOREIGN KEY (RecipeStageID) REFERENCES RecipeStages(RecipeStageID) ON DELETE CASCADE,
    FOREIGN KEY (SourceRecipeStageID) REFERENCES RecipeStages(RecipeStageID),
    FOREIGN KEY (IngredientID) REFERENCES Ingredients(IngredientID)
);

CREATE TABLE IF NOT EXISTS RecipeTags (
    RecipeTagID INTEGER PRIMARY KEY,
    TagName TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS RecipeVersionTagAssignments (
    RecipeVersionTagAssignmentID INTEGER PRIMARY KEY,
    RecipeVersionID INTEGER NOT NULL,
    RecipeTagID INTEGER NOT NULL,
    TagNumber INTEGER NOT NULL CHECK (TagNumber > 0),
    UNIQUE (RecipeVersionID, TagNumber),
    FOREIGN KEY (RecipeVersionID) REFERENCES RecipeVersions(RecipeVersionID) ON DELETE CASCADE,
    FOREIGN KEY (RecipeTagID) REFERENCES RecipeTags(RecipeTagID)
);

CREATE TABLE IF NOT EXISTS Notes (
    NoteID INTEGER PRIMARY KEY,
    RecipeVersionID INTEGER NOT NULL,
    NoteNumber INTEGER NOT NULL CHECK (NoteNumber > 0),
    NoteText TEXT NOT NULL,
    UNIQUE (RecipeVersionID, NoteNumber),
    FOREIGN KEY (RecipeVersionID) REFERENCES RecipeVersions(RecipeVersionID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Items (
    ItemID INTEGER PRIMARY KEY,
    ItemName TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS RecipeVersionItems (
    RecipeVersionItemID INTEGER PRIMARY KEY,
    RecipeVersionID INTEGER NOT NULL,
    ItemID INTEGER NOT NULL,
    ItemNumber INTEGER NOT NULL CHECK (ItemNumber > 0),
    Quantity REAL NOT NULL DEFAULT 1 CHECK (Quantity > 0),
    Sub TEXT,
    UNIQUE (RecipeVersionID, ItemNumber),
    FOREIGN KEY (RecipeVersionID) REFERENCES RecipeVersions(RecipeVersionID) ON DELETE CASCADE,
    FOREIGN KEY (ItemID) REFERENCES Items(ItemID)
);

CREATE TABLE IF NOT EXISTS IngredientTags (
    TagID INTEGER PRIMARY KEY,
    TagName TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS IngredientTagAssignment (
    AssignmentID INTEGER PRIMARY KEY,
    IngredientID INTEGER NOT NULL,
    TagID INTEGER NOT NULL,
    UNIQUE (IngredientID, TagID),
    FOREIGN KEY (IngredientID) REFERENCES Ingredients(IngredientID),
    FOREIGN KEY (TagID) REFERENCES IngredientTags(TagID)
);

CREATE TABLE IF NOT EXISTS Cart (
    CartID INTEGER PRIMARY KEY,
    UUID TEXT NOT NULL,
    Contents TEXT NOT NULL,
    CreatedDate TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
