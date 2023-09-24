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
VALUES (1, 'Chicken Fried Rice', 1),
       (2, 'Gourmet Burger', 2),
       (3, 'Garlic Parmesan Fries', 3);

-- RecipeVersions Table
INSERT INTO RecipeVersions (RecipeVersionID, ParentVersionID, VersionComment, PortionQuantity, PortionDescriptor, ActiveTimeMinutes, PassiveTimeMinutes, ComplexityRating, MayhemRating)
VALUES (1, NULL, 'Initial version', 4, 'servings', 30, 0, 2, 1),
       (2, NULL, 'Initial version', 4, 'servings', 30, 0, 3, 1),
       (3, NULL, 'Initial version', 4, 'servings', 25, 0, 2, 1);

-- Ingredients Table
INSERT INTO Ingredients (IngredientID, IngredientName)
VALUES (1, 'White Rice'),
       (2, 'Chicken Breast'),
       (3, 'Carrot'),
       (4, 'Bell Pepper'),
       (5, 'Frozen Peas'),
       (6, 'Egg'),
       (7, 'Garlic'),
       (8, 'Soy Sauce'),
       (9, 'Vegetable Oil'),
       (10, 'Ground Beef'),
       (11, 'Burger Bun'),
       (12, 'Cheddar Cheese'),
       (13, 'Tomato'),
       (14, 'Red Onion'),
       (15, 'Lettuce'),
       (16, 'Olive Oil'),
       (17, 'Mayonnaise'),
       (18, 'Ketchup'),
       (19, 'Dijon Mustard'),
       (20, 'Worcestershire Sauce'),
       (21, 'Potato'),
       (22, 'Parmesan Cheese'),
       (23, 'Minced Garlic');

-- RecipeVersionIngredients Table
INSERT INTO RecipeVersionIngredients (RecipeVersionIngredientID, RecipeVersionID, IngredientID, Quantity, Measurement)
VALUES (1, 1, 1, 400, 'grams'),
       (2, 1, 2, 400, 'grams'),
       (3, 1, 3, 2, 'whole'),
       (4, 1, 4, 2, 'whole'),
       (5, 1, 5, 200, 'grams'),
       (6, 1, 6, 4, 'whole'),
       (7, 1, 7, 8, 'cloves'),
       (8, 1, 8, 120, 'ml'),
       (9, 1, 9, 4, 'tbsp'),
       (10, 2, 10, 450, 'grams'),
       (11, 2, 11, 4, 'whole'),
       (12, 2, 12, 4, 'slices'),
       (13, 2, 13, 1, 'whole'),
       (14, 2, 14, 1, 'whole'),
       (15, 2, 15, 4, 'leaves'),
       (16, 2, 16, 2, 'tbsp'),
       (17, 2, 17, 60, 'ml'),
       (18, 2, 18, 2, 'tbsp'),
       (19, 2, 19, 1, 'tbsp'),
       (20, 2, 20, 1, 'tsp'),
       (21, 3, 21, 4, 'whole'),
       (22, 3, 22, 50, 'grams'),
       (23, 3, 23, 2, 'tbsp'),
       (24, 3, 16, 2, 'tbsp');

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
       (4, 1, 4, 1),
       (5, 2, 1, 1),
       (6, 2, 2, 1),
       (7, 2, 3, 1),
       (8, 2, 4, 1),
       (9, 3, 1, 1),
       (10, 3, 2, 1),
       (11, 3, 3, 1),
       (12, 3, 4, 1);

-- Instructions Table
INSERT INTO Instructions (InstructionID, RecipeVersionID, StepNumber, StepDetail)
-- Instructions for Chicken Fried Rice
VALUES (1, 1, 1, 'Heat {0.25:Vegetable Oil} in a large skillet or wok over medium-high heat.'),
       (2, 1, 2, 'Add the {Chicken Breast} cubes, seasoning them with salt and pepper. Cook until no longer pink. Remove and set aside.'),
       (3, 1, 3, 'In the same skillet, add {0.25:Vegetable Oil}. Add {1:Garlic}, {1:Carrot}, and {1:Bell Pepper}. Sauté for 2-3 minutes.'),
       (4, 1, 4, 'Add {1:Frozen Peas} and cook for another 2 minutes.'),
       (5, 1, 5, 'Push the vegetables to one side of the skillet. Pour {1:Egg} into the other side and scramble.'),
       (6, 1, 6, 'Add the {1:White Rice} to the skillet, mixing it with the vegetables and eggs.'),
       (7, 1, 7, 'Pour {1:Soy Sauce} over the rice mixture. Add the cooked chicken back into the skillet.'),
       (8, 1, 8, 'Stir everything together and cook for another 2-3 minutes.'),
-- Instructions for Gourmet Burger
       (10, 2, 1, 'Preheat your grill or stovetop grilling pan over medium-high heat.'),
       (11, 2, 2, 'Mix together all the ingredients for the sauce in a small bowl. Set aside.'),
       (12, 2, 3, 'Form the {1:Ground Beef} into 4 burger patties. Make a small indent in the center of each patty.'),
       (13, 2, 4, 'Drizzle {Olive Oil} over the patties and season both sides with Salt and Black Pepper.'),
       (14, 2, 5, 'Place the patties on the preheated grill or pan. Cook for about 4 minutes per side or to your desired doneness.'),
       (15, 2, 6, 'Just before the burgers are done, place one {Cheddar Cheese} slice on each patty to melt.'),
       (16, 2, 7, 'Toast {Burger Bun} until lightly browned.'),
       (17, 2, 8, 'To assemble the burgers, spread the prepared sauce on the bottom half of each bun. Add {Lettuce}, then the burger patty with melted cheese, followed by {Tomato} and {Red Onion} slices.'),
       (18, 2, 9, 'Top with the other half of the bun. Serve immediately.'),
-- Instructions for Garlic Parmesan Fries
       (19, 3, 1, 'Preheat your oven to 220°C (425°F). Line a baking sheet with parchment paper.'),
       (20, 3, 2, 'Cut the {Potato} into 1/2-inch thick slices, then cut each slice into 1/2-inch thick fries.'),
       (21, 3, 3, 'Toss the slices with {1:Olive Oil}, {1:Minced Garlic}, Salt, and Black Pepper in a large bowl.'),
       (22, 3, 4, 'Spread the fries evenly on the prepared baking sheet.'),
       (23, 3, 5, 'Bake for 20-25 minutes, flipping halfway through, until they are golden and crisp.'),
       (24, 3, 6, 'Remove the fries from the oven and immediately toss them with {1:Parmesan Cheese}.');

