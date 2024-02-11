-- Recipes Table
CREATE TABLE Recipes (
    RecipeID INTEGER PRIMARY KEY,
    RecipeName TEXT NOT NULL UNIQUE,
    MainVersionID INTEGER,
    FOREIGN KEY (MainVersionID) REFERENCES RecipeVersions(RecipeVersionID)
);

-- RecipeVersions Table
CREATE TABLE RecipeVersions (
    RecipeVersionID INTEGER PRIMARY KEY,
    ParentVersionID INTEGER,
    VersionComment TEXT,
    PortionQuantity REAL NOT NULL,
    PortionDescriptor TEXT NOT NULL,
    ActiveTimeMinutes INTEGER NOT NULL,
    PassiveTimeMinutes INTEGER NOT NULL,
    ComplexityRating INTEGER CHECK (ComplexityRating BETWEEN 1 AND 5),
    MayhemRating INTEGER CHECK (MayhemRating BETWEEN 1 AND 5),
    FOREIGN KEY (ParentVersionID) REFERENCES RecipeVersions(RecipeVersionID)
);

-- Ingredients Table
CREATE TABLE IF NOT EXISTS Ingredients (
    IngredientID INTEGER PRIMARY KEY,
    IngredientName TEXT NOT NULL UNIQUE,
    IsRecipe BOOLEAN NOT NULL DEFAULT 0,
    RecipeID INTEGER,
    FOREIGN KEY (RecipeID) REFERENCES Recipes(RecipeID)
);

-- RecipeIngredients Table
CREATE TABLE IF NOT EXISTS RecipeVersionIngredients (
    RecipeVersionIngredientID INTEGER PRIMARY KEY,
    RecipeVersionID INTEGER NOT NULL,
    IngredientID INTEGER NOT NULL,
    Quantity REAL NOT NULL,
    Measurement TEXT NOT NULL DEFAULT 'whole',
    FOREIGN KEY (RecipeVersionID) REFERENCES RecipeVersions(RecipeVersionID),
    FOREIGN KEY (IngredientID) REFERENCES Ingredients(IngredientID)
);

-- RecipeCommonIngredients Table
---- Identical to RecipeIngredients Table but represents ingredients that are not shown to the user,
---- though referenced by the ingredient steps.
CREATE TABLE IF NOT EXISTS RecipeVersionCommonIngredients (
    RecipeVersionCommonIngredientID INTEGER PRIMARY KEY,
    RecipeVersionID INTEGER NOT NULL,
    IngredientID INTEGER NOT NULL,
    Quantity REAL NOT NULL,
    Measurement TEXT NOT NULL DEFAULT 'whole',
    FOREIGN KEY (RecipeVersionID) REFERENCES RecipeVersions(RecipeVersionID),
    FOREIGN KEY (IngredientID) REFERENCES Ingredients(IngredientID)
);

-- Items Table
CREATE TABLE IF NOT EXISTS Items (
    ItemID INTEGER PRIMARY KEY,
    ItemName TEXT NOT NULL UNIQUE
);

-- RecipeVersionItems Table
CREATE TABLE IF NOT EXISTS RecipeVersionItems (
    RecipeVersionItemID INTEGER PRIMARY KEY,
    RecipeVersionID INTEGER NOT NULL,
    ItemID INTEGER NOT NULL,
    Quantity INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (RecipeVersionID) REFERENCES RecipeVersions(RecipeVersionID),
    FOREIGN KEY (ItemID) REFERENCES Items(ItemID)
);

-- Instructions Table
CREATE TABLE IF NOT EXISTS Instructions (
    InstructionID INTEGER PRIMARY KEY,
    RecipeVersionID INTEGER NOT NULL,
    StepNumber INTEGER NOT NULL,
    StepDetail TEXT NOT NULL,
    FOREIGN KEY (RecipeVersionID) REFERENCES RecipeVersions(RecipeVersionID)
);

-- IngredientTags Table
CREATE TABLE IF NOT EXISTS IngredientTags (
    TagID INTEGER PRIMARY KEY,
    TagName TEXT NOT NULL UNIQUE
);

-- IngredientTagAssignment Table
CREATE TABLE IF NOT EXISTS IngredientTagAssignment (
    AssignmentID INTEGER PRIMARY KEY,
    IngredientID INTEGER NOT NULL,
    TagID INTEGER NOT NULL,
    UNIQUE (IngredientID, TagID),
    FOREIGN KEY (IngredientID) REFERENCES Ingredients(IngredientID),
    FOREIGN KEY (TagID) REFERENCES IngredientTags(TagID)
);

-- Cart Table
CREATE TABLE IF NOT EXISTS Cart (
    CartID INTEGER PRIMARY KEY,
    UUID TEXT NOT NULL,
    Contents TEXT NOT NULL,
    CreatedDate TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
