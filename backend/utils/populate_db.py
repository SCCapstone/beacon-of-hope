import firebase_admin
from firebase_admin import credentials, firestore
import json
import os
from typing import List
from bson import ObjectId

# from firebase_funs import add_document
from datetime import datetime, timedelta
from bson.objectid import ObjectId


def initialize_firestore():
    """
    Initialize Firebase Admin SDK
    """
    cred = credentials.Certificate("firebase_key.json")
    firebase_admin.initialize_app(cred)
    return firestore.client()


db = initialize_firestore()


def add_document(collection_name, document_id, data):
    """
    Adds a document (recipe, user,etc.) to a specified Firestore collection.

    :param collection_name: The name of the Firestore collection
    :param document_id: The ID of the document to create
    :param data: A dictionary representing the data to store
    :return: The result of the document creation
    """
    try:
        doc_ref = db.collection(collection_name).document(document_id)
        doc_ref.set(data)
        return f"Document {document_id} added successfully."
    except Exception as e:
        return f"Error adding document: {e}"


# def populate_food_data(db):
#     """
#     Populate food recipes and beverages collections.
#     """
#     # Upload food item recipes to Firestore DB
#     r3_files: List[str] = [
#         os.path.join("items_data", file)
#         for file in os.listdir("items_data")
#         if file != "beverages.json"
#     ]

#     r3_recipes: list = []
#     for r3_file in r3_files:
#         with open(r3_file, "r") as file:
#             r3 = json.load(file)
#             r3 = r3["recipe-ids"]
#             for i, recipe in r3.items():
#                 recipe["recipe-id"] = i
#                 r3_recipes.append(recipe)

#     for recipe in r3_recipes:
#         add_document(db, "food-recipes", recipe["recipe-id"], recipe)

#     # Upload beverage names to Firestore DB
#     beverage_file: str = os.path.join("items_data", "beverages.json")
#     beverages = []
#     with open(beverage_file, "r") as file:
#         bevs = json.load(file)
#         bevs = bevs["beverage_ids"]
#         for i, bev in bevs.items():
#             bev["bev-id"] = i
#             beverages.append(bev)

#     for beverage in beverages:
#         add_document(db, "beverages", beverage["bev-id"], beverage)


def populate_users(db):
    """
    Populate User collection with updated schema.
    """
    users = [
        {
            "_id": str(ObjectId()),
            "username": "johndoe",
            "email": "johndoe@example.com",
            "plan_ids": [],
            "dietary_preferences": {
                "preferences": ["vegetarian"],
                "numerical_preferences": {
                    "dairy": -1,
                    "nuts": 0,
                    "meat": 1,
                },
            },
            "health_info": {
                "allergies": ["peanuts"],
                "conditions": ["diabetes"],
            },
            "demographicsInfo": {
                "ethnicity": "Caucasian",
                "height": None,
                "weight": None,
                "age": 29,
                "gender": "male",
            },
            "meal_plan_config": {
                "num_days": 2,
                "num_meals": 3,
                "meal_configs": [
                    {
                        "meal_name": "breakfast",
                        "meal_time": "8:00am",
                        "beverage": True,
                        "main_course": True,
                        "side": False,
                        "dessert": False,
                    }
                ],
            },
            "user_id": "674f7d4c5b4425639bef8cd666",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "_id": str(ObjectId()),
            "username": "janedoe",
            "email": "janedoe125@example.com",
            "plan_ids": [],
            "dietary_preferences": {
                "preferences": ["vegan"],
                "numerical_preferences": {
                    "dairy": -1,
                    "nuts": 0,
                    "meat": 1,
                },
            },
            "health_info": {
                "allergies": [],
                "conditions": ["hypertension"],
            },
            "demographicsInfo": {
                "ethnicity": "Asian",
                "height": None,
                "weight": None,
                "age": 35,
                "gender": "female",
            },
            "meal_plan_config": {
                "num_days": 2,
                "num_meals": 3,
                "meal_configs": [
                    {
                        "meal_name": "breakfast",
                        "meal_time": "7:30am",
                        "beverage": True,
                        "main_course": True,
                        "side": False,
                        "dessert": False,
                    },
                    {
                        "meal_name": "lunch",
                        "meal_time": "12:30pm",
                        "beverage": True,
                        "main_course": True,
                        "side": True,
                        "dessert": False,
                    },
                    {
                        "meal_name": "dinner",
                        "meal_time": "6:30pm",
                        "beverage": True,
                        "main_course": True,
                        "side": True,
                        "dessert": True,
                    },
                ],
            },
            "user_id": str(ObjectId()),
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
    ]

    for user in users:
        add_document("users", user["_id"], user)


def populate_mealplans(db):
    """
    Populate MealPlan collection dynamically for all users in the database.
    """
    # Retrieve all users from the "users" collection
    users = db.collection("users").get()

    if not users:
        raise ValueError("No users found in the database.")

    for user_doc in users:
        user_id = user_doc.id
        user_data = user_doc.to_dict()

        # Generate a new meal plan ID
        mealplan_id = str(ObjectId())

        # Create a meal plan for this user
        mealplan = {
            "_id": mealplan_id,
            "user_id": user_id,  # Link to the specific user
            "name": "Weekly Meal Plan",
            "start_date": datetime.now(),
            "end_date": datetime.now() + timedelta(days=7),
            "days": [
                {
                    "day": 0,  # Sunday
                    "meals": [
                        {
                            "meal_time": "8:00 AM",
                            "beverage": "1",
                            "main_course": "2",
                            "side_dish": "3",
                            "dessert": "4",
                        }
                    ],
                },
                {
                    "day": 1,
                    "meals": [
                        {
                            "meal_name": "Salad and Juice",
                            "meal_time": "12:00 PM",
                            "beverage": "bev126",
                            "main_course": "food126",
                            "side_dish": "food127",
                            "dessert": "food128",
                        }
                    ],
                },
            ],
            "status": "active",
            "tags": ["weekly", "health-focused"],
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        # Add the meal plan to the firebase
        add_document(db, "mealplans", mealplan["_id"], mealplan)

        # Update the user's `plan_ids` with the new meal plan ID
        db.collection("users").document(user_id).update(
            {"plan_ids": firestore.ArrayUnion([mealplan_id])}
        )

        print(
            f"MealPlan {mealplan_id} created for user {user_data['username']} and linked successfully."
        )


def populate_all_data():
    """
    Populate Firestore database with all collections.
    """
    # db = initialize_firestore()

    # populate_food_data(db)

    populate_users(db)

    # populate_mealplans(db)


if __name__ == "__main__":
    populate_all_data()
