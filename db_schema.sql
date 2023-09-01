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
    FOREIGN KEY (RecipeVersionID) REFERENCES RecipeVersions(RecipeVersionID),
    FOREIGN KEY (IngredientID) REFERENCES Ingredients(IngredientID)
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

-- Insert data into Recipes Table
INSERT INTO Recipes (RecipeID, RecipeName, MainVersionID, PortionQuantity, PortionDescriptor, EstimatedTime, ComplexityRating, MayhemRating)
VALUES
    (1, 'Pasta Bolognese', 1, 4, 'Servings', 45, 3, 2),
    (2, 'Tacos', 2, 4, 'Servings', 30, 2, 1),
    (3, 'Chocolate Cake', 3, 1, 'Cake', 90, 4, 5);

-- Insert data into RecipeVersions Table
INSERT INTO RecipeVersions (RecipeVersionID, ParentVersionID, VersionComment)
VALUES
    (1, NULL, 'Initial version'),
    (2, NULL, 'Initial version'),
    (3, NULL, 'Initial version'),
    (4, 1, 'Reduced salt'),
    (5, 2, 'More spicy');

-- Insert data into Ingredients Table
INSERT INTO Ingredients (IngredientID, IngredientName, IsRecipe, RecipeID)
VALUES
    (1, 'Spaghetti', 0, NULL),
    (2, 'Ground Beef', 0, NULL),
    (3, 'Tomato Sauce', 0, NULL),
    (4, 'Taco Shell', 0, NULL),
    (5, 'Chicken', 0, NULL),
    (6, 'Chocolate', 0, NULL),
    (7, 'Flour', 0, NULL),
    (8, 'Egg', 0, NULL);

-- Insert data into RecipeIngredients Table
INSERT INTO RecipeIngredients (RecipeIngredientID, RecipeVersionID, IngredientID, Quantity, Measurement)
VALUES
    (1, 1, 1, 400, 'grams'),
    (2, 1, 2, 250, 'grams'),
    (3, 1, 3, 400, 'ml'),
    (4, 2, 4, 8, 'pieces'),
    (5, 2, 5, 300, 'grams'),
    (6, 3, 6, 200, 'grams'),
    (7, 3, 7, 300, 'grams'),
    (8, 3, 8, 4, 'pieces');

-- Insert data into Instructions Table
INSERT INTO Instructions (InstructionID, RecipeVersionID, StepNumber, StepDetail)
VALUES
    (1, 1, 1, 'Boil the spaghetti'),
    (2, 1, 2, 'Cook the ground beef'),
    (3, 1, 3, 'Mix with tomato sauce'),
    (4, 2, 1, 'Prepare taco shells'),
    (5, 2, 2, 'Cook the chicken'),
    (6, 3, 1, 'Mix the flour and chocolate'),
    (7, 3, 2, 'Add eggs'),
    (8, 3, 3, 'Bake the cake');

-- Insert data into IngredientTags Table
INSERT INTO IngredientTags (TagID, TagName)
VALUES
    (1, 'Vegetarian'),
    (2, 'Gluten-Free'),
    (3, 'Dairy-Free');

-- Insert data into IngredientTagAssignment Table
INSERT INTO IngredientTagAssignment (AssignmentID, IngredientID, TagID)
VALUES
    (1, 1, 2),
    (2, 3, 1),
    (3, 4, 2),
    (4, 5, 3),
    (5, 6, 1),
    (6, 8, 1);
