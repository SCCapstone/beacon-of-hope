# tests/test_firestore.py
from django.test import TestCase
from core.firebase import add_document, get_document


class FirestoreTestCase(TestCase):
    def setUp(self):
        # Sample data for testing
        self.user_data = {
            "user_id": "user_1",
            "name": "Alice",
            "email": "alice@example.com",
            "age": 25,
        }

        self.ingredient_data = {
            "ingredient_id": "ingredient_1",
            "name": "Flour",
            "quantity": "2 cups",
        }

        self.recipe_data = {
            "recipe_id": "recipe_1",
            "title": "Pancakes",
            "description": "A quick pancake recipe",
            "user_id": "user_1",
            "ingredients": [
                {
                    "ingredient_id": "ingredient_1",
                    "name": "Flour",
                    "quantity": "2 cups",
                },
                {"ingredient_id": "ingredient_2", "name": "Milk", "quantity": "1 cup"},
            ],
        }

    def test_add_user(self):
        # Add a User document to Firestore
        result = add_document("users", self.user_data["user_id"], self.user_data)
        self.assertEqual(
            result, f'Document {self.user_data["user_id"]} added successfully.'
        )

    def test_add_ingredient(self):
        # Add an Ingredient document to Firestore
        result = add_document(
            "ingredients", self.ingredient_data["ingredient_id"], self.ingredient_data
        )
        self.assertEqual(
            result,
            f'Document {self.ingredient_data["ingredient_id"]} added successfully.',
        )

    def test_add_recipe(self):
        # Add a Recipe document to Firestore
        result = add_document(
            "recipes", self.recipe_data["recipe_id"], self.recipe_data
        )
        self.assertEqual(
            result, f'Document {self.recipe_data["recipe_id"]} added successfully.'
        )

    def test_get_user(self):
        # Ensure the User data is retrievable after adding it
        add_document("users", self.user_data["user_id"], self.user_data)
        retrieved_user = get_document("users", self.user_data["user_id"])
        self.assertEqual(retrieved_user, self.user_data)

    def test_get_ingredient(self):
        # Ensure the Ingredient data is retrievable after adding it
        add_document(
            "ingredients", self.ingredient_data["ingredient_id"], self.ingredient_data
        )
        retrieved_ingredient = get_document(
            "ingredients", self.ingredient_data["ingredient_id"]
        )
        self.assertEqual(retrieved_ingredient, self.ingredient_data)

    def test_get_recipe(self):
        # Ensure the Recipe data is retrievable after adding it
        add_document("recipes", self.recipe_data["recipe_id"], self.recipe_data)
        retrieved_recipe = get_document("recipes", self.recipe_data["recipe_id"])
        self.assertEqual(retrieved_recipe, self.recipe_data)
