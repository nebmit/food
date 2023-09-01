-- Recipes Table
CREATE TABLE Recipes (
    RecipeID INTEGER PRIMARY KEY,
    RecipeName TEXT NOT NULL,
    MainVersionID INTEGER,
    PortionQuantity REAL NOT NULL,
    PortionDescriptor TEXT NOT NULL,
    EstimatedTime INTEGER NOT NULL,
    ComplexityRating INTEGER CHECK (ComplexityRating BETWEEN 1 AND 5),
    MayhemRating INTEGER CHECK (MayhemRating BETWEEN 1 AND 5),
    FOREIGN KEY (MainVersionID) REFERENCES RecipeVersions(RecipeVersionID)
);

-- RecipeVersions Table
CREATE TABLE RecipeVersions (
    RecipeVersionID INTEGER PRIMARY KEY,
    ParentVersionID INTEGER,
    VersionComment TEXT,
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
CREATE TABLE IF NOT EXISTS RecipeIngredients (
    RecipeIngredientID INTEGER PRIMARY KEY,
    RecipeVersionID INTEGER NOT NULL,
    IngredientID INTEGER NOT NULL,
    Quantity REAL NOT NULL,
    Measurement TEXT,
    FOREIGN KEY (RecipeVersionID) REFERENCES RecipeVersions(VersionID),
    FOREIGN KEY (IngredientID) REFERENCES Ingredients(IngredientID)
);

-- Instructions Table
CREATE TABLE IF NOT EXISTS Instructions (
    InstructionID INTEGER PRIMARY KEY,
    RecipeVersionID INTEGER NOT NULL,
    StepNumber INTEGER NOT NULL,
    StepDetail TEXT NOT NULL,
    FOREIGN KEY (RecipeVersionID) REFERENCES RecipeVersions(VersionID)
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
