import firebase_admin
from firebase_admin import credentials, firestore
import json
import os
from typing import List
from firebase_funs import add_document
from bson import ObjectId
from datetime import datetime, timedelta
from bson.objectid import ObjectId


def initialize_firestore():
    """
    Initialize Firebase Admin SDK
    """
    cred = credentials.Certificate("firebase_key.json")
    firebase_admin.initialize_app(cred)
    return firestore.client()


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
    Populate User collection.
    """
    users = [
        {
            "_id": str(ObjectId()),
            "username": "johndoe",
            "email": "johndoe@example.com",
            "plan_ids": [],  # empty list for now
            "preferences": {
                "dietary": ["vegetarian"],
                "allergies": ["peanuts"],
                "healthConditions": ["diabetes"],
                "demographicInfo": {
                    "ethnicity": "Caucasian",
                    "height": None,
                    "weight": None,
                    "age": 29,
                    "gender": "male",
                },
                "mealTimes": {
                    "breakfast": "8:00 AM",
                    "lunch": "1:00 PM",
                    "dinner": "7:00 PM",
                    "snacks": ["10:00 AM", "4:00 PM"],
                },
            },
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "_id": str(ObjectId()),
            "username": "janedoe",
            "email": "janedoe@example.com",
            "plan_ids": [],
            "preferences": {
                "dietary": ["vegan"],
                "allergies": [],
                "healthConditions": ["hypertension"],
                "demographicInfo": {
                    "ethnicity": "Asian",
                    "height": None,
                    "weight": None,
                    "age": 35,
                    "gender": "female",
                },
                "mealTimes": {
                    "breakfast": "7:30 AM",
                    "lunch": "12:30 PM",
                    "dinner": "6:30 PM",
                    "snacks": ["10:30 AM", "3:30 PM"],
                },
            },
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
    ]

    for user in users:
        add_document(db, "users", user["_id"], user)


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
    db = initialize_firestore()

    # populate_food_data(db)

    populate_users(db)

    populate_mealplans(db)


if __name__ == "__main__":
    populate_all_data()
