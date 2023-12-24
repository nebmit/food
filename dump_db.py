import sqlite3
import os
import shutil
import logging

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# Configuration variables
DATABASE_PATH = "./database.db"
IMAGES_BASE_PATH = "upload/images/recipes/"
OUTPUT_BASE_PATH = "recipes/"

os.makedirs(OUTPUT_BASE_PATH, exist_ok=True)


def main():
    """
    Main function that connects to the SQLite database, fetches recipes, and processes each recipe.
    """
    try:
        # Connect to the SQLite Database
        conn = sqlite3.connect(DATABASE_PATH)
    except sqlite3.Error as error:
        logging.error("Database connection failed: %s", error)
        return

    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM Recipes")
        recipes = cursor.fetchall()
    except sqlite3.Error as error:
        logging.error("Failed to fetch recipes: %s", error)
        conn.close()
        return

    for recipe in recipes:
        try:
            process_recipe(cursor, recipe)
        except sqlite3.Error as error:
            logging.error("Failed to process recipe %s: %s", recipe[1], error)
        except IOError as error:
            logging.error("Failed to process recipe %s: %s", recipe[1], error)

    # Close the database connection
    conn.close()


def process_recipe(cursor, recipe):
    """
    Process a recipe by creating a directory, fetching and writing details, 
    and copying an image if available.

    Args:
        cursor: SQLite cursor object.
        recipe: Tuple containing recipe details.

    """
    recipe_id, recipe_name, main_version_id = recipe
    print(recipe_id, recipe_name, main_version_id)

    # Sanitize recipe_name for use in file paths and create a directory
    recipe_dir = os.path.join(OUTPUT_BASE_PATH, sanitize_filename(recipe_name))
    os.makedirs(recipe_dir, exist_ok=True)

    # Fetch and write details for the recipe to a text file
    fetch_and_write_details(cursor, main_version_id, recipe_dir)

    # Copy image if it exists
    copy_image(recipe_id, recipe_dir)


def fetch_and_write_details(cursor, version_id, directory):
    """
    Fetch and write details for a recipe version to a text file.

    Args:
        cursor: SQLite cursor object.
        version_id: ID of the recipe version.
        directory: Directory to write the details file.

    """
    # Fetch the main version details for the recipe
    cursor.execute(
        "SELECT * FROM RecipeVersions WHERE RecipeVersionID = ?", (version_id,)
    )
    recipe_version = cursor.fetchone()

    # Fetch ingredients for the recipe version
    cursor.execute(
        """
        SELECT IngredientName, Quantity, Measurement 
        FROM RecipeVersionIngredients 
        JOIN Ingredients ON Ingredients.IngredientID = RecipeVersionIngredients.IngredientID 
        WHERE RecipeVersionID = ?
        """,
        (version_id,),
    )
    ingredients = cursor.fetchall()

    # Fetch items for the recipe version
    cursor.execute(
        """
        SELECT ItemName, Quantity 
        FROM RecipeVersionItems 
        JOIN Items ON Items.ItemID = RecipeVersionItems.ItemID 
        WHERE RecipeVersionID = ?
        """,
        (version_id,),
    )
    items = cursor.fetchall()

    # Fetch instructions for the recipe version
    cursor.execute(
        "SELECT StepNumber, StepDetail FROM Instructions WHERE RecipeVersionID = ?",
        (version_id,),
    )
    instructions = cursor.fetchall()

    # Write the version details to a text file
    with open(os.path.join(directory, "recipe.txt"), "w", encoding="utf-8") as file:
        file.write(
            f"{recipe_version[3]} ;; {recipe_version[4]} ;; {recipe_version[5]} ;; "
            f"{recipe_version[6]} ;; {recipe_version[7]} ;; {recipe_version[8]} ;;\n"
        )
        file.write("INGREDIENTS\n")
        for ingredient in ingredients:
            file.write(f"{ingredient[0]} :: {ingredient[1]} :: {ingredient[2]} ;;\n")
        file.write("ITEMS\n")
        for item in items:
            file.write(f"{item[0]} :: {item[1]} ;;\n")
        file.write("INSTRUCTIONS\n")
        for instruction in instructions:
            file.write(f"{instruction[0]} :: {instruction[1]} ;;\n")


def copy_image(recipe_id, directory):
    """
    Copy an image file to the recipe directory if it exists.

    Args:
        recipe_id: ID of the recipe.
        directory: Directory to copy the image file to.

    """
    image_src = os.path.join(IMAGES_BASE_PATH, f"{recipe_id}.webp")
    image_dest = os.path.join(directory, "image.webp")
    if os.path.exists(image_src):
        shutil.copyfile(image_src, image_dest)
    else:
        logging.warning("No image found for RecipeID %s", recipe_id)


def sanitize_filename(name):
    """
    Sanitize a filename by removing special characters.

    Args:
        name: Filename to sanitize.

    Returns:
        Sanitized filename.

    """
    keepcharacters = (" ", ".", "_")
    return "".join(c for c in name if c.isalnum() or c in keepcharacters).rstrip()


if __name__ == "__main__":
    main()
