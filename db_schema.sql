-- Recipes Table
CREATE TABLE Recipes (
    RecipeID INTEGER PRIMARY KEY,
    RecipeName TEXT NOT NULL,
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
    Measurement TEXT,
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

-- Recipes Table
INSERT INTO Recipes (RecipeID, RecipeName, MainVersionID) 
VALUES (1, 'Spaghetti Bolognese', 1);

-- RecipeVersions Table
INSERT INTO RecipeVersions (RecipeVersionID, ParentVersionID, VersionComment, PortionQuantity, PortionDescriptor, ActiveTimeMinutes, PassiveTimeMinutes, ComplexityRating, MayhemRating)
VALUES (1, NULL, 'Initial version', 4, 'servings', 30, 10, 2, 1);

-- Ingredients Table
INSERT INTO Ingredients (IngredientID, IngredientName)
VALUES (1, 'Spaghetti'), 
       (2, 'Ground Beef'), 
       (3, 'Tomato Sauce'), 
       (4, 'Onion'),
       (5, 'Garlic'), 
       (6, 'Salt'), 
       (7, 'Black Pepper'), 
       (8, 'Olive Oil');

-- RecipeIngredients Table
INSERT INTO RecipeVersionIngredients (RecipeVersionIngredientID, RecipeVersionID, IngredientID, Quantity, Measurement)
VALUES (1, 1, 1, 400, 'grams'),
       (2, 1, 2, 300, 'grams'),
       (3, 1, 3, 400, 'ml'),
       (4, 1, 4, 1, 'whole'),
       (5, 1, 5, 2, 'cloves'),
       (6, 1, 6, 1, 'tsp'),
       (7, 1, 7, 0.5, 'tsp'),
       (8, 1, 8, 2, 'tbsp');

-- Items Table
INSERT INTO Items (ItemID, ItemName)
VALUES (1, 'Pot'), 
       (2, 'Frying Pan'), 
       (3, 'Knife'), 
       (4, 'Cutting Board');

-- RecipeVersionItems Table
INSERT INTO RecipeVersionItems (RecipeVersionItemID, RecipeVersionID, ItemID, Quantity)
VALUES (1, 1, 1, 1),
       (2, 1, 2, 1),
       (3, 1, 3, 1),
       (4, 1, 4, 1);

-- Instructions Table
INSERT INTO Instructions (InstructionID, RecipeVersionID, StepNumber, StepDetail)
VALUES (1, 1, 1, 'Dice the onion and garlic.'),
       (2, 1, 2, 'Heat the olive oil in a frying pan.'),
       (3, 1, 3, 'Fry the onion and garlic until translucent.'),
       (4, 1, 4, 'Add the ground beef and cook until browned.'),
       (5, 1, 5, 'Add the tomato sauce, salt, and black pepper. Simmer for 10 minutes.'),
       (6, 1, 6, 'In a separate pot, boil water and cook the spaghetti as per the package instructions.'),
       (7, 1, 7, 'Drain the spaghetti and serve with the sauce on top.');

-- IngredientTags Table (just as an example of categorization)
INSERT INTO IngredientTags (TagID, TagName)
VALUES (1, 'Carb'), 
       (2, 'Meat'), 
       (3, 'Vegetable'), 
       (4, 'Seasoning');

-- IngredientTagAssignment Table
INSERT INTO IngredientTagAssignment (AssignmentID, IngredientID, TagID)
VALUES (1, 1, 1), 
       (2, 2, 2), 
       (3, 3, 3), 
       (4, 4, 3),
       (5, 5, 3), 
       (6, 6, 4), 
       (7, 7, 4), 
       (8, 8, 4);
