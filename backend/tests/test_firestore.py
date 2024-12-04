# tests/test_firestore.py
from django.test import TestCase
from core.firebase import add_document, get_document


class FirestoreTestCase(TestCase):
    def setUp(self):
        self.recipe_data = {
            "recipe_name": "apple-pie",
            "data_provenance": {
                "source_url": "https://copykat.com/mcdonalds-hot-apple-pie/",
                "last_system_access": "2024-09-22 14:30:32.965810",
            },
            "macronutrients": {
                "Calories": {"measure": "417", "unit": "kcal"},
                "Carbohydrates": {"measure": "38", "unit": "g"},
                "Protein": {"measure": "4", "unit": "g"},
                "Fat": {"measure": "27", "unit": "g"},
                "Saturated Fat": {"measure": "8", "unit": "g"},
                "Cholesterol": {"measure": "11", "unit": "mg"},
                "Sodium": {"measure": "264", "unit": "mg"},
                "Potassium": {"measure": "92", "unit": "mg"},
                "Fiber": {"measure": "2", "unit": "g"},
                "Sugar": {"measure": "9", "unit": "g"},
                "Vitamin A": {"measure": "155", "unit": "IU"},
                "Vitamin C": {"measure": "2.3", "unit": "mg"},
                "Calcium": {"measure": "14", "unit": "mg"},
                "Iron": {"measure": "1.7", "unit": "mg"},
            },
            "food_role": ["Dessert", "Side"],
            "ingredients": [
                {
                    "name": "Granny Smith apple",
                    "quantity": {"measure": "1", "unit": ""},
                    "allergies": {"id": "", "category": "", "ref": "", "details": ""},
                    "alternative": "",
                    "quality_characteristic": "",
                    "image": "",
                },
                {
                    "name": "red apple",
                    "quantity": {"measure": "1", "unit": ""},
                    "allergies": {"id": "", "category": "", "ref": "", "details": ""},
                    "alternative": "",
                    "quality_characteristic": "",
                    "image": "",
                },
                {
                    "name": "butter",
                    "quantity": {"measure": "3", "unit": "tablespoons"},
                    "allergies": {
                        "id": "",
                        "category": ["Dairy"],
                        "ref": [
                            "https://www.healthline.com/nutrition/milk-allergy-symptoms#milk-allergy"
                        ],
                        "details": "",
                    },
                    "alternative": "",
                    "quality_characteristic": "",
                    "image": "",
                },
                {
                    "name": "brown sugar",
                    "quantity": {"measure": "3", "unit": "tablespoons"},
                    "allergies": {"id": "", "category": "", "ref": "", "details": ""},
                    "alternative": "",
                    "quality_characteristic": "",
                    "image": "",
                },
                {
                    "name": "ground cinnamon",
                    "quantity": {"measure": "1/2", "unit": "teaspoon"},
                    "allergies": {"id": "", "category": "", "ref": "", "details": ""},
                    "alternative": "",
                    "quality_characteristic": "",
                    "image": "",
                },
                {
                    "name": "nutmeg",
                    "quantity": {"measure": "1/4", "unit": "teaspoon"},
                    "allergies": {"id": "", "category": "", "ref": "", "details": ""},
                    "alternative": "",
                    "quality_characteristic": "",
                    "image": "",
                },
                {
                    "name": "allspice",
                    "quantity": {"measure": "1/4", "unit": "teaspoon"},
                    "allergies": {"id": "", "category": "", "ref": "", "details": ""},
                    "alternative": "",
                    "quality_characteristic": "",
                    "image": "",
                },
                {
                    "name": "vanilla extract",
                    "quantity": {"measure": "1/4", "unit": "teaspoon"},
                    "allergies": {"id": "", "category": "", "ref": "", "details": ""},
                    "alternative": "",
                    "quality_characteristic": "",
                    "image": "",
                },
                {
                    "name": "lemon juice",
                    "quantity": {"measure": "1", "unit": "teaspoon"},
                    "allergies": {"id": "", "category": "", "ref": "", "details": ""},
                    "alternative": "",
                    "quality_characteristic": "",
                    "image": "",
                },
                {
                    "name": "salt",
                    "quantity": {"measure": "1/4", "unit": "teaspoon"},
                    "allergies": {
                        "id": "",
                        "category": ["Salt"],
                        "ref": [
                            "https://www.healthline.com/nutrition/how-much-sodium-per-day#recommendations"
                        ],
                        "details": "",
                    },
                    "alternative": "",
                    "quality_characteristic": "",
                    "image": "",
                },
                {
                    "name": "puff pastry",
                    "quantity": {"measure": "2", "unit": "sheets"},
                    "allergies": {
                        "id": "",
                        "category": "",
                        "ref": "",
                        "details": "cut into 8 inch squares",
                    },
                    "alternative": "",
                    "quality_characteristic": "",
                    "image": "",
                },
            ],
            "hasDairy": True,
            "hasMeat": False,
            "hasNuts": False,
            "prep_time": "10 minutes",
            "cook_time": "15 minutes",
            "total_time": "25 minutes",
            "serves": "8",
            "instructions": [
                {
                    "original_text": "Defrost the puff pastry according to package directions.",
                    "input_condition": ["have_puff_pastry"],
                    "task": [
                        {
                            "action_name": "Defrost puff pastry",
                            "output_quality": [
                                "Puff pastry should be defrosted according to package directions."
                            ],
                            "background_knowledge": {
                                "tool": [],
                                "failure": [
                                    "Puff pastry not defrosted properly",
                                    "Puff pastry still frozen",
                                ],
                            },
                        }
                    ],
                    "output_condition": ["defrosted_puff_pastry"],
                    "modality": {"image": [], "video": ""},
                },
                {
                    "original_text": "Dice apples into small pieces and place apples in a pot over medium heat.",
                    "input_condition": ["have_apples"],
                    "task": [
                        {
                            "action_name": "Dice apples and place in pot over medium heat",
                            "output_quality": [
                                "Apples should be diced into small pieces and placed in pot over medium heat."
                            ],
                            "background_knowledge": {
                                "tool": ["Knife", "Pot"],
                                "failure": [
                                    "Apples not diced properly",
                                    "Apples not placed in pot",
                                ],
                            },
                        }
                    ],
                    "output_condition": ["diced_apples_in_pot"],
                    "modality": {"image": [], "video": ""},
                },
                {
                    "original_text": "To the pot add butter, brown sugar, cinnamon, nutmeg, allspice, vanilla extract, lemon juice, and salt.",
                    "input_condition": [
                        "diced_apples_in_pot",
                        "have_butter",
                        "have_brown_sugar",
                        "have_cinnamon",
                        "have_nutmeg",
                        "have_allspice",
                        "have_vanilla_extract",
                        "have_lemon_juice",
                        "have_salt",
                    ],
                    "task": [
                        {
                            "action_name": "Add ingredients to pot",
                            "output_quality": [
                                "Butter, brown sugar, cinnamon, nutmeg, allspice, vanilla extract, lemon juice, and salt should be added to the pot."
                            ],
                            "background_knowledge": {
                                "tool": [],
                                "failure": ["Ingredients not added to pot"],
                            },
                        }
                    ],
                    "output_condition": ["ingredients_added_to_apples"],
                    "modality": {"image": [], "video": ""},
                },
                {
                    "original_text": "Cook apples for about 10 to 12 minutes or until the apples are softened.",
                    "input_condition": ["ingredients_added_to_apples"],
                    "task": [
                        {
                            "action_name": "Cook apples",
                            "output_quality": [
                                "Apples should be softened after cooking for 10 to 12 minutes."
                            ],
                            "background_knowledge": {
                                "tool": [],
                                "failure": [
                                    "Apples not cooked properly",
                                    "Apples not softened",
                                ],
                            },
                        }
                    ],
                    "output_condition": ["cooked_apples"],
                    "modality": {"image": [], "video": ""},
                },
                {
                    "original_text": "Cut puff pastry into 8 squares.",
                    "input_condition": ["defrosted_puff_pastry"],
                    "task": [
                        {
                            "action_name": "Cut puff pastry into squares",
                            "output_quality": [
                                "Puff pastry should be cut into 8 squares."
                            ],
                            "background_knowledge": {
                                "tool": ["Knife"],
                                "failure": [
                                    "Puff pastry not cut into 8 squares",
                                    "Uneven squares",
                                ],
                            },
                        }
                    ],
                    "output_condition": ["cut_puff_pastry_squares"],
                    "modality": {"image": [], "video": ""},
                },
                {
                    "original_text": "Spoon 1 heaping tablespoon of cooked apples onto one side of each one of the squares.",
                    "input_condition": ["cut_puff_pastry_squares", "cooked_apples"],
                    "task": [
                        {
                            "action_name": "Spoon cooked apples onto pastry",
                            "output_quality": [
                                "1 heaping tablespoon of cooked apples should be on one side of each square."
                            ],
                            "background_knowledge": {
                                "tool": ["Spoon"],
                                "failure": [
                                    "Apples not properly measured",
                                    "Apples not placed on one side",
                                ],
                            },
                        }
                    ],
                    "output_condition": ["apples_on_puff_pastry"],
                    "modality": {"image": [], "video": ""},
                },
                {
                    "original_text": "Brush water on the edge of each one of the squares and fold the squares over on each other. Use a fork to crimp the edges together.",
                    "input_condition": ["apples_on_puff_pastry"],
                    "task": [
                        {
                            "action_name": "Brush water on edges and fold squares",
                            "output_quality": [
                                "Water should be brushed on the edges of each square.",
                                "Squares should be folded over and edges crimped with a fork.",
                            ],
                            "background_knowledge": {
                                "tool": ["Brush", "Fork"],
                                "failure": [
                                    "Edges not sealed properly",
                                    "Filling leaks out",
                                ],
                            },
                        }
                    ],
                    "output_condition": ["sealed_puff_pastry_squares"],
                    "modality": {"image": [], "video": ""},
                },
                {
                    "original_text": "Add enough oil to a large pot or deep fryer to cover the bottom 3 inches.",
                    "input_condition": ["have_oil", "have_large_pot_or_deep_fryer"],
                    "task": [
                        {
                            "action_name": "Add oil to pot",
                            "output_quality": [
                                "Oil should cover the bottom 3 inches of the pot or deep fryer."
                            ],
                            "background_knowledge": {
                                "tool": ["Large Pot or Deep Fryer"],
                                "failure": ["Not enough oil added"],
                            },
                        }
                    ],
                    "output_condition": ["oil_in_pot"],
                    "modality": {"image": [], "video": ""},
                },
                {
                    "original_text": "Heat oil until 350 degrees. The oil will be ready when you drop a small piece of dough in the oil and it cooks rapidly.",
                    "input_condition": ["oil_in_pot"],
                    "task": [
                        {
                            "action_name": "Heat oil to 350 degrees",
                            "output_quality": ["Oil should be heated to 350 degrees."],
                            "background_knowledge": {
                                "tool": ["Thermometer"],
                                "failure": ["Oil not hot enough", "Oil too hot"],
                            },
                        }
                    ],
                    "output_condition": ["heated_oil"],
                    "modality": {"image": [], "video": ""},
                },
                {
                    "original_text": "Cook pies 2 at a time, for about 1 minute on each side.",
                    "input_condition": ["heated_oil", "sealed_puff_pastry_squares"],
                    "task": [
                        {
                            "action_name": "Cook pies",
                            "output_quality": [
                                "Pies should be cooked for about 1 minute on each side."
                            ],
                            "background_knowledge": {
                                "tool": [],
                                "failure": [
                                    "Pies not cooked evenly",
                                    "Pies overcooked",
                                ],
                            },
                        }
                    ],
                    "output_condition": ["cooked_pies"],
                    "modality": {"image": [], "video": ""},
                },
                {
                    "original_text": "Remove pies when both sides are golden brown.",
                    "input_condition": ["cooked_pies"],
                    "task": [
                        {
                            "action_name": "Remove pies from oil",
                            "output_quality": [
                                "Both sides of the pies should be golden brown."
                            ],
                            "background_knowledge": {
                                "tool": ["Slotted Spoon or Tongs"],
                                "failure": [
                                    "Pies not golden brown",
                                    "Pies undercooked",
                                ],
                            },
                        }
                    ],
                    "output_condition": ["golden_brown_pies"],
                    "modality": {"image": [], "video": ""},
                },
                {
                    "original_text": "Place fried pies on a wire rack to drain excess oil.",
                    "input_condition": ["golden_brown_pies"],
                    "task": [
                        {
                            "action_name": "Drain pies on wire rack",
                            "output_quality": [
                                "Excess oil should be drained from the pies."
                            ],
                            "background_knowledge": {
                                "tool": ["Wire Rack"],
                                "failure": ["Excess oil remains on pies"],
                            },
                        }
                    ],
                    "output_condition": ["drained_pies"],
                    "modality": {"image": [], "video": ""},
                },
                {
                    "original_text": "If you want to keep the pies warm, hold them in a 200-degree oven until you are ready to serve.",
                    "input_condition": ["drained_pies"],
                    "task": [
                        {
                            "action_name": "Keep pies warm in oven",
                            "output_quality": [
                                "Pies should be kept warm in a 200-degree oven."
                            ],
                            "background_knowledge": {
                                "tool": ["Oven"],
                                "failure": ["Pies not kept warm"],
                            },
                        }
                    ],
                    "output_condition": ["warm_pies"],
                    "modality": {"image": [], "video": ""},
                },
            ],
            "recipe-id": "36",
        }

    def test_add_recipe(self):
        # Add a Recipe document to Firestore
        result = add_document(
            "food-recipes", self.recipe_data["recipe-id"], self.recipe_data
        )
        self.assertEqual(
            result, f'Document {self.recipe_data["recipe-id"]} added successfully.'
        )

    def test_get_recipe(self):
        # Ensure the Recipe data is retrievable after adding it
        add_document("food-recipes", self.recipe_data["recipe-id"], self.recipe_data)
        retrieved_recipe = get_document("food-recipes", self.recipe_data["recipe-id"])
        self.assertEqual(retrieved_recipe, self.recipe_data)
