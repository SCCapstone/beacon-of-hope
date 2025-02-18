import firebase_admin
from firebase_admin import credentials, firestore

# Path to  service account key JSON file (CHANGE FOR AWS)
SERVICE_ACCOUNT_FILE = "firebase_key.json"

# Initialize Firebase
cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
firebase_admin.initialize_app(cred)

# Initialize Firestore database
db = firestore.client()


"""General functions for adding, retrieving, and deleting a function based on collection name and doc id"""


def add_document(collection_name, document_id, data):
    """
    Adds a document (recipe, user, etc.) to a specified Firestore collection.
    Returns a tuple: (result message, status code)
    """
    try:
        doc_ref = db.collection(collection_name).document(document_id)
        doc_ref.set(data)
        return (f"Document {document_id} added successfully.", 200)
    except Exception as e:
        return (f"Error adding document: {e}", 500)


def get_document(collection_name, document_id):
    """
    Retrieves a document (recipe, user, etc.) from a specified Firestore collection.
    Returns a tuple: (document data or error message, status code)
    """
    try:
        doc_ref = db.collection(collection_name).document(document_id)
        doc = doc_ref.get()
        if doc.exists:
            return (doc.to_dict(), 200)
        else:
            return (f"Document {document_id} does not exist.", 404)
    except Exception as e:
        return (f"Error getting document: {e}", 500)


def get_documents_by_attr(collection_name, key, value):
    """
    Returns all documents that have {key: value} in their schema.
    Returns a tuple: (list of documents or error message, status code)
    """
    try:
        collection_ref = db.collection(collection_name)
        docs_stream = collection_ref.where(key, "==", value).stream()
        docs = [doc.to_dict() for doc in docs_stream]
        if docs:
            return (docs, 200)
        else:
            return (f"No document found for {{{key}: {value}}}", 404)
    except Exception as e:
        return (f"Error retrieving documents: {e}", 500)


def update_document(collection_name, document_id, data):
    """
    Updates a document in a specified Firestore collection.
    Returns a tuple: (result message, status code)
    """
    try:
        doc_ref = db.collection(collection_name).document(document_id)
        doc_ref.update(data)
        return (f"Document {document_id} updated successfully.", 200)
    except Exception as e:
        return (f"Error updating document: {e}", 500)


def update_document_attr(collection_name, document_id, key, value):
    """
    Updates a specific field of a Firestore document.
    Returns a tuple: (result message, status code)
    """
    try:
        doc_ref = db.collection(collection_name).document(document_id)
        doc_ref.update({key: value})
        return (f"Document {document_id} updated successfully.", 200)
    except Exception as e:
        return (f"Error updating document: {e}", 500)


def update_document_list_attr(collection_name, document_id, key, list_val):
    """
    Appends an element to a list in a Firestore document.
    Returns a tuple: (result message, status code)
    """
    try:
        doc_ref = db.collection(collection_name).document(document_id)
        doc_ref.update({key: firestore.ArrayUnion([list_val])})
        return (
            f"Successfully appended {list_val} to {key} in document {document_id}.",
            200,
        )
    except Exception as e:
        return (f"Error updating document: {e}", 500)


def delete_document(collection_name, document_id):
    """
    Deletes a document from a specified Firestore collection.
    Returns a tuple: (result message, status code)
    """
    try:
        doc_ref = db.collection(collection_name).document(document_id)
        doc_ref.delete()
        return (f"Document {document_id} deleted successfully.", 200)
    except Exception as e:
        return (f"Error deleting document: {e}", 500)


"""User Retrieval functions"""


def get_user_by_email(user_email: str, password: str):
    """
    Fetches a user document from Firestore based on the 'email' field.
    Returns a tuple: (user data or error message, status code)
    """
    try:
        users, status = get_documents_by_attr(
            collection_name="users", key="email", value=user_email
        )
        if status != 200:
            return (f"Error retrieving documents: {users}", status)

        if isinstance(users, list):
            if len(users) == 0:
                return ("No user found.", 404)
            user = users[0]
            if user.get("password") == password:
                return (user, 200)
            else:
                return ("Incorrect password", 401)
        else:
            return ("Unexpected error retrieving user.", 500)
    except Exception as e:
        return (
            f"There was an error retrieving the user with email: {user_email}. Exception: {e}",
            500,
        )


"""Food and Beverage item retrieval functions"""


def get_r3():
    """
    Retrieves all food recipes from Firestore.
    Returns a tuple: (dictionary of recipes, status code)
    """
    try:
        recipe_ref = db.collection("food-recipes")
        recipes_stream = recipe_ref.stream()  # list of Firestore document objects
        recipes = [recipe.to_dict() for recipe in recipes_stream]
        recipes_dict = {recipe["recipe-id"]: recipe for recipe in recipes}
        return (recipes_dict, 200)
    except Exception as e:
        return (f"Error retrieving r3: {e}", 500)


def get_beverages():
    """
    Retrieves all beverages from Firestore.
    Returns a tuple: (dictionary of beverages, status code)
    """
    try:
        bev_ref = db.collection("beverages")
        bevs_stream = bev_ref.stream()  # list of Firestore document objects
        bevs = [bev.to_dict() for bev in bevs_stream]
        bevs_dict = {bev["bev-id"]: bev for bev in bevs}
        return (bevs_dict, 200)
    except Exception as e:
        return (f"Error retrieving collection: {e}", 500)


def get_single_r3(recipe_id):
    """
    Retrieves a single recipe (R3 representation) from Firestore.
    Returns a tuple: (recipe data or error message, status code)
    """
    try:
        recipe, status = get_document("food-recipes", recipe_id)
        return (recipe, status)
    except Exception as e:
        return (f"Error retrieving recipe {recipe_id}: {e}", 500)


def get_single_beverage(beverage_id):
    """
    Retrieves a single beverage from Firestore.
    Returns a tuple: (beverage data or error message, status code)
    """
    try:
        beverage, status = get_document("beverages", beverage_id)
        return (beverage, status)
    except Exception as e:
        return (f"Error accessing Firestore for beverage {beverage_id}: {e}", 500)


"""Meal plan retrieval functions"""


def get_user_mealplan(user_id, latest=True, date=None):
    """
    Retrieves a meal plan for a specific user.
    Returns a tuple: (meal plan data or error message, status code)
    """
    try:
        user, status = get_document("users", user_id)
        if status != 200:
            return (user, status)

        plan_ids = user.get("plan_ids", [])
        if not plan_ids:
            return ("No meal plans found for user.", 404)

        # If latest is True, retrieve the most recent plan.
        plan_id = str(plan_ids[-1]) if latest else str(plan_ids[-1])
        meal_plan, status = get_document("mealplans", plan_id)
        return (meal_plan, status)
    except Exception as e:
        return (f"Error retrieving meal plans for user {user_id}: {e}", 500)


def get_latest_user_mealplan(user_id):
    # Placeholder for future implementation.
    return ("Not implemented", 501)


"""Object creation functions"""


def add_user(user_id, user):
    """
    Adds a new user.
    Returns a tuple: (result message, status code)
    """
    return add_document("users", user_id, user)


def add_mealplan(user_id, meal_plan):
    """
    Saves a meal plan to Firestore and updates the user's plan_ids list.
    Returns a tuple: (result message, status code)
    """
    try:
        meal_plan_id = meal_plan["_id"]
        update_res, update_status = update_document_list_attr(
            "users", user_id, "plan_ids", meal_plan_id
        )
        if update_status != 200:
            return (update_res, update_status)

        add_res, add_status = add_document("mealplans", meal_plan_id, meal_plan)
        if add_status != 200:
            return (add_res, add_status)

        return ("Meal plan added successfully.", 200)
    except Exception as e:
        return (f"There was an issue saving the meal plan: {e}", 500)


"""Object deletion functions"""


def delete_user(user_id):
    """
    Deletes a user from Firestore.
    Returns a tuple: (result message, status code)
    """
    try:
        return delete_document("users", user_id)
    except Exception as e:
        return (f"User either doesn't exist or couldn't delete user: {e}", 500)
