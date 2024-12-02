import firebase_admin
from firebase_admin import credentials, firestore
import json
import os
from typing import List
from backend.utils.firebase_funs import add_document


def initialize_firestore():
    """
    Initialize Firebase Admin SDK
    """
    cred = credentials.Certificate("firebase_key.json")
    firebase_admin.initialize_app(cred)
    return firestore.client()


def populate_data():
    # Initialize Firestore database
    db = initialize_firestore()

    # upload food item recipes to firestore db
    r3_files: List[str] = [
        os.path.join("items_data", file)
        for file in os.listdir("items_data")
        if file != "beverages.json"
    ]

    r3_recipes: list = []
    for r3_file in r3_files:
        with open(r3_file, "r") as file:
            r3 = json.load(file)
            r3 = r3["recipe-ids"]
            for i, recipe in r3.items():
                recipe["recipe-id"] = i
                r3_recipes.append(recipe)
                print(recipe)

    for recipe in r3_recipes:
        add_document(db, "food-recipes", recipe["recipe-id"], recipe)

    # upload beverage names to firestore db
    beverage_file: str = os.path.join("items_data", "beverages.json")
    beverages = []
    with open(beverage_file, "r") as file:
        bevs = json.load(file)
        bevs = bevs["beverage_ids"]
        for i, bev in bevs.items():
            bev["bev-id"] = i
            beverages.append(bev)

    for beverage in beverages:
        add_document(db, "beverages", beverage["bev-id"], beverage)


if __name__ == "__main__":
    populate_data()
