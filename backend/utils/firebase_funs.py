# def add_document(db, collection_name, document_id, data):
#     """
#     Add a document to Firestore DB.
#     """
#     try:
#         doc_ref = db.collection(collection_name).document(document_id)
#         doc_ref.set(data)
#         print(f"Document {document_id} added to {collection_name}.")
#     except Exception as e:
#         print(f"Failed to add document {document_id} to {collection_name}: {e}")


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


# def get_document(db, collection_name, document_id):
#     """
#     Retrieves a document from a specified Firestore collection.

#     :param collection_name: The name of the Firestore collection
#     :param document_id: The ID of the document to retrieve
#     :return: The document data or an error message
#     """
#     try:
#         doc_ref = db.collection(collection_name).document(document_id)
#         doc = doc_ref.get()
#         if doc.exists:
#             return doc.to_dict()
#         else:
#             return f"Document {document_id} does not exist."
#     except Exception as e:
#         return f"Error getting document: {e}"


# Retrieves all meal plans for a specific user.
def get_user_mealplans(db, user_id):
    """
    Retrieves all meal plans for a specific user.

    :param db: Firestore database instance
    :param user_id: The ID of the user whose meal plans to retrieve
    :return: A list of meal plans or an error message
    """
    try:
        mealplans = db.collection("mealplans").where("user_id", "==", user_id).stream()
        return [mealplan.to_dict() for mealplan in mealplans]
    except Exception as e:
        return f"Error retrieving meal plans for user {user_id}: {e}"


# # Retrieves a specific meal plan by its ID.
# def get_mealplan_by_id(db, mealplan_id):
#     """
#     Retrieves a specific meal plan by its ID.

#     :param db: Firestore database instance
#     :param mealplan_id: The ID of the meal plan to retrieve
#     :return: The meal plan data or an error message
#     """
#     try:
#         doc_ref = db.collection("mealplans").document(mealplan_id)
#         doc = doc_ref.get()
#         if doc.exists:
#             return doc.to_dict()
#         else:
#             return f"Meal plan {mealplan_id} does not exist."
#     except Exception as e:
#         return f"Error retrieving meal plan {mealplan_id}: {e}"


# # Updates a specific meal plan with new data
# def update_mealplan(db, mealplan_id, updates):
#     """
#     Updates a specific meal plan with new data.

#     :param db: Firestore database instance
#     :param mealplan_id: The ID of the meal plan to update
#     :param updates: A dictionary of updates to apply
#     :return: A success message or an error message
#     """
#     try:
#         doc_ref = db.collection("mealplans").document(mealplan_id)
#         doc_ref.update(updates)
#         return f"Meal plan {mealplan_id} updated successfully."
#     except Exception as e:
#         return f"Error updating meal plan {mealplan_id}: {e}"


# # Deletes a specific meal plan
# def delete_mealplan(db, mealplan_id):
#     """
#     Deletes a specific meal plan.

#     :param db: Firestore database instance
#     :param mealplan_id: The ID of the meal plan to delete
#     :return: A success message or an error message
#     """
#     try:
#         db.collection("mealplans").document(mealplan_id).delete()
#         return f"Meal plan {mealplan_id} deleted successfully."
#     except Exception as e:
#         return f"Error deleting meal plan {mealplan_id}: {e}"


# # Links a meal plan to a user by adding the meal plan ID to the user's `plan_ids` field
# def link_mealplan_to_user(db, user_id, mealplan_id):
#     """
#     Links a meal plan to a user by adding the meal plan ID to the user's `plan_ids` field.

#     :param db: Firestore database instance
#     :param user_id: The ID of the user
#     :param mealplan_id: The ID of the meal plan to link
#     :return: A success message or an error message
#     """
#     try:
#         user_ref = db.collection("users").document(user_id)
#         user_doc = user_ref.get()
#         if user_doc.exists:
#             user_data = user_doc.to_dict()
#             if "plan_ids" not in user_data:
#                 user_data["plan_ids"] = []
#             user_data["plan_ids"].append(mealplan_id)
#             user_ref.update({"plan_ids": user_data["plan_ids"]})
#             return f"Meal plan {mealplan_id} linked to user {user_id}."
#         else:
#             return f"User {user_id} does not exist."
#     except Exception as e:
#         return f"Error linking meal plan {mealplan_id} to user {user_id}: {e}"


# # Retrieves all meals for a specific meal plan
# def get_meals_for_mealplan(db, mealplan_id):
#     """
#     Retrieves all meals for a specific meal plan.

#     :param db: Firestore database instance
#     :param mealplan_id: The ID of the meal plan
#     :return: A list of meals or an error message
#     """
#     try:
#         mealplan_doc = db.collection("mealplans").document(mealplan_id).get()
#         if mealplan_doc.exists:
#             mealplan_data = mealplan_doc.to_dict()
#             return mealplan_data.get("meals", [])
#         else:
#             return f"Meal plan {mealplan_id} does not exist."
#     except Exception as e:
#         return f"Error retrieving meals for meal plan {mealplan_id}: {e}"
