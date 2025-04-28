import firebase_admin
from firebase_admin import credentials, firestore
from functools import cache
from typing import List, Dict
from .user import User
import logging
from termcolor import colored

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

# Path to  service account key JSON file (CHANGE FOR AWS)
SERVICE_ACCOUNT_FILE = "firebase_key.json"


class FirebaseManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseManager, cls).__new__(cls)
            cls._instance._initialize_firebase()
        return cls._instance

    def _initialize_firebase(self):
        try:
            # Try to get the default app, which will raise an error if not initialized
            firebase_admin.get_app()
        except ValueError:
            # If no default app exists, initialize it
            cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
            firebase_admin.initialize_app(cred)

        # Initialize Firestore database
        self.db = firestore.client()

    """General functions for adding, retrieving, and deleting a function based on collection name and doc id"""

    def _add_document(self, collection_name, document_id, data):
        """
        Adds a document (recipe, user, etc.) to a specified Firestore collection.
        Returns a tuple: (result message, status code)
        """
        try:
            doc_ref = self.db.collection(collection_name).document(document_id)
            doc_ref.set(data)
            return (f"Document {document_id} added successfully.", 200)
        except Exception as e:
            return (f"Error adding document: {e}", 500)

    def _get_document(self, collection_name, document_id):
        """
        Retrieves a document (recipe, user, etc.) from a specified Firestore collection.
        Returns a tuple: (document data or error message, status code)
        """
        try:
            doc_ref = self.db.collection(collection_name).document(document_id)
            doc = doc_ref.get()
            if doc.exists:
                return (doc.to_dict(), 200)
            else:
                return (f"Document {document_id} does not exist.", 404)
        except Exception as e:
            return (f"Error getting document: {e}", 500)

    def _exists_document(self, collection_name, document_id):
        doc_ref = self.db.collection(collection_name).document(document_id)
        doc = doc_ref.get()
        return doc.exists

    def _exists_field_in_document(self, collection_name, document_id, field):
        doc_ref = self.db.collection(collection_name).document(document_id)
        doc = doc_ref.get()
        return field in doc.to_dict()

    def _get_documents_by_attr(self, collection_name, key, value):
        """
        Returns all documents that have {key: value} in their schema.
        Returns a tuple: (list of documents or error message, status code)
        """
        try:
            collection_ref = self.db.collection(collection_name)
            docs_stream = collection_ref.where(key, "==", value).stream()
            docs = [doc.to_dict() for doc in docs_stream]
            if docs:
                return (docs, 200)
            else:
                return (f"No document found for {{{key}: {value}}}", 404)
        except Exception as e:
            return (f"Error retrieving documents: {e}", 500)

    def _update_document(self, collection_name, document_id, data):
        """
        Updates a document in a specified Firestore collection.
        Returns a tuple: (result message, status code)
        """
        try:
            doc_ref = self.db.collection(collection_name).document(document_id)
            doc_ref.update(data)
            return (f"Document {document_id} updated successfully.", 200)
        except Exception as e:
            return (f"Error updating document: {e}", 500)

    def _update_document_attr(self, collection_name, document_id, key, value):
        """
        Updates a specific field of a Firestore document.
        Returns a tuple: (result message, status code)
        """
        try:
            doc_ref = self.db.collection(collection_name).document(document_id)
            doc_ref.update({key: value})
            return (f"Document {document_id} updated successfully.", 200)
        except Exception as e:
            return (f"Error updating document: {e}", 500)

    def _update_document_list_attr(self, collection_name, document_id, key, list_val):
        """
        Appends an element to a list in a Firestore document.
        Returns a tuple: (result message, status code)
        """
        try:
            doc_ref = self.db.collection(collection_name).document(document_id)
            doc_ref.update({key: firestore.ArrayUnion([list_val])})
            return (
                f"Successfully appended {list_val} to {key} in document {document_id}.",
                200,
            )
        except Exception as e:
            return (f"Error updating document: {e}", 500)

    def _update_document_dict_attr(
        self, collection_name, document_id, dict_field_name, key, value
    ):
        """
        Updates or adds a key-value pair in a dictionary field of a Firestore document.

        Args:
            collection_name (str): Name of the Firestore collection
            document_id (str): ID of the document to update
            dict_field_name (str): Name of the dictionary field in the document
            key (str): Dictionary key to update or add
            value: Value to set for the specified key

        Returns:
            tuple: (result message, status code)
        """
        try:
            doc_ref = self.db.collection(collection_name).document(document_id)

            # Construct the field path for the nested update
            field_path = f"{dict_field_name}.{key}"

            # Update the specific key in the dictionary
            doc_ref.update({field_path: value})

            return (
                f"Successfully updated key '{key}' to '{value}' in dictionary '{dict_field_name}' of document {document_id}.",
                200,
            )
        except Exception as e:
            return (f"Error updating document: {e}", 500)

    def _delete_document(self, collection_name, document_id):
        """
        Deletes a document from a specified Firestore collection.
        Returns a tuple: (result message, status code)
        """
        try:
            doc_ref = self.db.collection(collection_name).document(document_id)
            doc_ref.delete()
            return (f"Document {document_id} deleted successfully.", 200)
        except Exception as e:
            return (f"Error deleting document: {e}", 500)

    """User Retrieval functions"""

    def get_user_by_email(self, user_email: str, password: str):
        """
        Fetches a user document from Firestore based on the 'email' field.
        Returns a tuple: (user data or error message, status code)
        """
        try:
            users, status = self._get_documents_by_attr(
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

    def get_user_by_id(self, user_id: str):
        """
        Retrieves a single user from Firestore.
        Returns a tuple: (user data or error message, status code)
        """
        try:
            user_dict, status = self._get_document("users", user_id)
            user = User(user_dict)
            return (user, status)
        except Exception as e:
            return (f"Error retrieving user {user_id}: {e}", 500)

    def update_user_attr(self, user_id: str, attr: str, val):
        """
        Updates a user's single attribute
        Returns: status code
        """
        try:
            msg, status = self._update_document_attr("users", user_id, attr, val)
            return (msg, status)
        except Exception as e:
            return (
                f"Error editing user {user_id} with value {val} for attr {attr}: {e}",
                500,
            )

    def get_user_attr(self, user_id: str, attr: str):
        """
        Get user's particular attribute
        """
        try:
            user_dict, status = self._get_document("users", user_id)
            if status != 200:
                return (
                    f"There was an error in retrieving the user: {user_dict}",
                    status,
                )

            if attr in user_dict:
                return (user_dict[attr], 200)
            return ("This attribute doesn't exist", 500)

        except Exception as e:
            return (
                f"Error retrieving user {user_id} with value for attr {attr}: {e}",
                500,
            )

    """Food and Beverage item retrieval functions"""

    @cache
    def get_r3(self):
        """
        Retrieves all food recipes from Firestore.
        Returns a tuple: (dictionary of recipes, status code)
        """
        try:
            recipe_ref = self.db.collection("food-recipes")
            recipes_stream = recipe_ref.stream()  # list of Firestore document objects
            recipes = [recipe.to_dict() for recipe in recipes_stream]
            recipes_dict = {recipe["recipe-id"]: recipe for recipe in recipes}
            return (recipes_dict, 200)
        except Exception as e:
            return (f"Error retrieving r3: {e}", 500)

    @cache
    def get_beverages(self):
        """
        Retrieves all beverages from Firestore.
        Returns a tuple: (dictionary of beverages, status code)
        """
        try:
            bev_ref = self.db.collection("beverages")
            bevs_stream = bev_ref.stream()  # list of Firestore document objects
            bevs = [bev.to_dict() for bev in bevs_stream]
            bevs_dict = {bev["bev-id"]: bev for bev in bevs}
            return (bevs_dict, 200)
        except Exception as e:
            return (f"Error retrieving collection: {e}", 500)

    def get_single_r3(self, recipe_id: str):
        """
        Retrieves a single recipe (R3 representation) from Firestore.
        Returns a tuple: (recipe data or error message, status code)
        """
        try:
            recipe, status = self._get_document("food-recipes", recipe_id)
            return (recipe, status)
        except Exception as e:
            return (f"Error retrieving recipe {recipe_id}: {e}", 500)

    def get_single_beverage(self, beverage_id: str):
        """
        Retrieves a single beverage from Firestore.
        Returns a tuple: (beverage data or error message, status code)
        """
        try:
            beverage, status = self._get_document("beverages", beverage_id)
            return (beverage, status)
        except Exception as e:
            return (f"Error accessing Firestore for beverage {beverage_id}: {e}", 500)

    """Meal plan retrieval functions"""

    def get_latest_user_meal_plan(self, user_id: str):
        """
        Retrieves a meal plan for a specific user.
        Returns a tuple: (meal plan data or error message, status code)
        """
        try:
            user, status = self._get_document("users", user_id)
            if status != 200:
                return (user, status)

            plan_ids = user.get("plan_ids", [])
            if not plan_ids:
                return ("No meal plans found for user.", 404)

            # return the last meal plan in the list
            plan_id = str(plan_ids[-1])
            meal_plan, status = self._get_document("meal_plans", plan_id)
            return (meal_plan, status)
        except Exception as e:
            return (f"Error retrieving meal plans for user {user_id}: {e}", 500)

    def get_all_user_meal_plans(self, user_id: str):
        """
        Retrieves all meal plan for a specific user.
        Returns a tuple: (meal plan data or error message, status code)
        """
        try:
            user, status = self._get_document("users", user_id)
            if status != 200:
                return (user, status)

            plan_ids = user.get("plan_ids", [])
            if not plan_ids:
                return ("No meal plans found for user.", 404)

            try:
                meal_plans = [
                    self._get_document("meal_plans", str(plan_id))[0]
                    for plan_id in plan_ids
                ]
                return (meal_plans, 200)
            except:
                return (
                    {
                        "Error": f"There was an error in retrieving the user {user_id}'s meal plans"
                    },
                    500,
                )
        except Exception as e:
            return (f"Error retrieving meal plans for user {user_id}: {e}", 500)

    def get_day_plans(self, user_id: str, dates: List[str]):
        """
        Retrieves a set of meal plans for a specific user based on given dates.
        Returns a tuple: (meal plan data or error message, status code)
        """
        try:
            logger.info(colored("Retrieving user", "cyan"))
            user, status = self._get_document("users", user_id)
            if status != 200:
                return (user, status)

            logger.info(
                colored(
                    "Checking if the user has dayplans and converting dates to a set",
                    "cyan",
                )
            )
            dates = set(dates)  # convert to set for checking inclusion in constant time
            day_plans = {}
            if "day_plans" not in user:
                return ("No day plans found for user.", 404)

            logger.info(colored(f"User day plans: {user['day_plans']}", "cyan"))
            for date, day_plan_ids in user["day_plans"].items():
                if date in dates:
                    # retrieve all corresponding day plans for each id
                    all_plans = []
                    for day_plan_id in day_plan_ids:
                        day_plan, status = self._get_document("day_plans", day_plan_id)
                        if status != 200:
                            return (day_plan, status)
                        if day_plan["meals"]:
                            all_plans.append(day_plan["meals"])

                    meals = {}
                    for d in all_plans:
                        meals.update(d)

                    day_plan = {
                        "user_id": day_plan["user_id"],
                        "meals": meals,
                        "_id": day_plan["_id"],
                    }

                    if day_plan["meals"]:
                        day_plans[date] = day_plan
            # return the day_plans
            return (day_plans, status)
        except Exception as e:
            return (f"Error retrieving meal plans for user {user_id}: {e}", 500)

    """Object creation functions"""

    def add_user(self, user_id: str, user: Dict):
        """
        Adds a new user.
        Returns a tuple: (result message, status code)
        """
        return self._add_document("users", user_id, user)

    def add_meal_plan(self, user_id, meal_plan):
        """
        Saves a meal plan to Firestore and updates the user's plan_ids list.
        Returns a tuple: (result message, status code)
        """
        try:
            meal_plan_id = meal_plan["_id"]
            update_res, update_status = self._update_document_list_attr(
                "users", user_id, "plan_ids", meal_plan_id
            )
            if update_status != 200:
                return (update_res, update_status)

            add_res, add_status = self._add_document(
                "meal_plans", meal_plan_id, meal_plan
            )
            if add_status != 200:
                return (add_res, add_status)

            return ("Meal plan added successfully.", 200)
        except Exception as e:
            return (f"There was an issue saving the meal plan: {e}", 500)

    def add_dayplan_temp(self, user_id, date, day_plan):
        # in the user object in firebase, we want to store a sub-object of the following form
        # day_plans: {"2025-03-01": day_plan_id}
        # where day_plan_id links to a day plan object in the day_plans collection
        try:
            # add a reference to the user's day plan in the user firebase object
            update_res, update_status = self._update_document_dict_attr(
                "users", user_id, "temp_day_plans", date, day_plan["_id"]
            )
            if update_status != 200:
                print("dayplan id wasn't added")
                return (update_res, update_status)

            # save the user's dayplan
            add_res, add_status = self._add_document(
                "temp_day_plans", day_plan["_id"], day_plan
            )
            if add_status != 200:
                print("dayplan was not saved")
                return (add_res, add_status)

            return ("Day Plan saved successfully", 200)
        except Exception as e:
            return (f"There was an issue saving the day plan: {e}", 500)

    def create_dayplan_object(self, user_id: str, date: str, day_plan_id: str):
        # Need to create a dayplan object as well as a reference to it in the user's object
        # if dayplan already exists
        if self._exists_document("day_plans", day_plan_id):
            logger.info(colored("Day plan object already exists", "cyan"))
            date_ids_map, status = self.get_user_attr(user_id=user_id, attr="day_plans")
            if status != 200:
                return date_ids_map, status
            # appending day plan id to the specific date for the user
            day_plan_ids = date_ids_map.get(date, [])

            if day_plan_id not in day_plan_ids:
                day_plan_ids.append(day_plan_id)

            msg, status = self._update_document_dict_attr(
                "users", user_id, "day_plans", date, day_plan_ids
            )
            if status != 200:
                return msg, status
            return (f"Day Plan Object Already Exists, {msg}", 200)
        else:
            # if dayplan doesn't exist, we create a new one
            logger.info(colored("Creating new dayplan object", "cyan"))
            day_plan = {"_id": day_plan_id, "user_id": user_id, "meals": {}}
            msg, status = self._add_document("day_plans", day_plan_id, day_plan)
            if status != 200:
                return msg, status

            logger.info(
                colored("Updating user information with new day plan id", "cyan")
            )

            date_ids_map, status = self.get_user_attr(user_id=user_id, attr="day_plans")
            if status != 200:
                return date_ids_map, status
            # appending day plan id to the specific date for the user
            day_plan_ids = date_ids_map.get(date, [])

            if day_plan_id not in day_plan_ids:
                day_plan_ids.append(day_plan_id)
            msg, status = self._update_document_dict_attr(
                "users", user_id, "day_plans", date, day_plan_ids
            )
            if status != 200:
                return msg, status
            return (f"Day Plan Object Created, {msg}", 200)

    def get_temp_dayplan_by_id(self, day_plan_id):
        return self._get_document("temp_day_plans", day_plan_id)

    def get_dayplan_by_id(self, day_plan_id):
        return self._get_document("day_plans", day_plan_id)

    def store_meal_in_dayplan(self, day_plan_id: str, meal: Dict):
        return self._update_document_dict_attr(
            "day_plans", day_plan_id, "meals", meal["_id"], meal
        )

    def get_meal_items(self, meal_id: str, day_plan_id: str) -> Dict:
        day_plan, status = self.get_dayplan_by_id(day_plan_id)
        if status != 200:
            return (
                f"There was an error in retrieving the previously stored meal plan: {day_plan}",
                status,
            )

        # skip over requested meal and updates
        for meal in day_plan["meals"]:
            if meal["_id"] == meal_id:
                return (meal["meal_types"], 200)

        return ("That meal does not exist in the database", 500)

    """Object deletion functions"""

    def delete_user(self, user_id):
        """
        Deletes a user from Firestore.
        Also deletes associated day plans and meal plans.
        Returns a tuple: (result message, status code)
        """
        try:
            # Delete the user document
            self._delete_document("users", user_id)

            # Delete associated day plans
            day_plans = (
                self.db.collection("day_plans").where("user_id", "==", user_id).stream()
            )
            for plan in day_plans:
                self.db.collection("day_plans").document(plan.id).delete()

            # Delete associated temp day plans
            temp_day_plans = (
                self.db.collection("temp_day_plans")
                .where("user_id", "==", user_id)
                .stream()
            )
            for temp_plan in temp_day_plans:
                self.db.collection("temp_day_plans").document(temp_plan.id).delete()

            return ("User and associated plans deleted successfully.", 200)
        except Exception as e:
            return (f"User either doesn't exist or couldn't delete user: {e}", 500)

    def remove_meal_from_dayplan(self, meal_id_to_delete, dayplan_ids):
        for dayplan_id in dayplan_ids:
            day_plan, status = self.get_dayplan_by_id(dayplan_id)
            if status != 200:
                return (
                    f"There was an error in retrieving the previously stored meal plan: {day_plan}",
                    status,
                )

            if meal_id_to_delete not in day_plan["meals"]:
                continue

            meals = {
                id: meal
                for id, meal in day_plan["meals"].items()
                if id != meal_id_to_delete
            }

            return self._update_document_attr("day_plans", dayplan_id, "meals", meals)
        return ("Meal did not exist to delete", 200)

    def add_favorite_items(self, user_id: str, new_favorite_items: Dict[str, int]):
        # create the permanent favorite items if the field doesn't already exist
        try:
            if not self._exists_field_in_document(
                "users", user_id, "permanent_favorite_items"
            ):
                favorite_items = {
                    "Main Course": [],
                    "Side": [],
                    "Beverage": [],
                    "Dessert": [],
                }
                msg, status = self.update_user_attr(
                    user_id, "permanent_favorite_items", favorite_items
                )
                if status != 200:
                    return (
                        f"There was an error in creating a new favorite items field in the user: {msg}",
                        status,
                    )

            # get the current permanent favorite items
            permanent_favorite_items, status = self.get_user_attr(
                user_id, "permanent_favorite_items"
            )
            if status != 200:
                return (
                    f"There was some error in retrieving the permanent favorite items from the user: {permanent_favorite_items}",
                    status,
                )
            for key, val in new_favorite_items.items():
                new_items = set(permanent_favorite_items[key] + [val])
                permanent_favorite_items[key] = list(new_items)

            msg, status = self.update_user_attr(
                user_id, "permanent_favorite_items", permanent_favorite_items
            )
            if status != 200:
                return (
                    f"There was an error in updating the new favorite items field in the user: {msg}",
                    status,
                )
            return (msg, status)
        except Exception as e:
            return (
                f"There was an error in favoriting the item (firebase.py): {e}",
                500,
            )

    def remove_favorite_items(
        self, user_id: str, to_remove_favorite_items: Dict[str, int]
    ):
        # create the permanent favorite items if the field doesn't already exist
        try:
            if not self._exists_field_in_document(
                "users", user_id, "permanent_favorite_items"
            ):
                favorite_items = {
                    "Main Course": [],
                    "Side": [],
                    "Beverage": [],
                    "Dessert": [],
                }
                msg, status = self.update_user_attr(
                    user_id, "permanent_favorite_items", favorite_items
                )
                if status != 200:
                    return (
                        f"There was an error in creating a new favorite items field in the user: {msg}",
                        status,
                    )

            # get the current permanent favorite items
            permanent_favorite_items, status = self.get_user_attr(
                user_id, "permanent_favorite_items"
            )
            if status != 200:
                return (
                    f"There was some error in retrieving the permanent favorite items from the user: {permanent_favorite_items}",
                    status,
                )
            for key, val in to_remove_favorite_items.items():
                old_items = set(permanent_favorite_items[key])
                if val in old_items:
                    old_items.remove(val)

                permanent_favorite_items[key] = list(old_items)

            msg, status = self.update_user_attr(
                user_id, "permanent_favorite_items", permanent_favorite_items
            )
            if status != 200:
                return (
                    f"There was an error in updating the new favorite items field in the user: {msg}",
                    status,
                )
            return (msg, status)
        except Exception as e:
            return (
                f"There was an error in favoriting the item (firebase.py): {e}",
                500,
            )

    def get_security_question_by_email(email: str):
        """Helper method to get security question and answer hash for a user"""
        try:
            # Normalize email
            email = email.lower().strip()
            
            # Get user document from Firebase
            users_ref = db.collection('users')
            query_ref = users_ref.where('email', '==', email).limit(1)
            docs = query_ref.get()
            
            if not docs:
                return None, None, 404  # user not found
            
            user_doc = docs[0]
            user_data = user_doc.to_dict()
            
            security_question = user_data.get('security_question')
            security_answer_hash = user_data.get('security_answer_hash')
            
            if not security_question or not security_answer_hash:
                return None, None, 400  # security question not configured
            
            return security_question, security_answer_hash, 200
        except Exception as e:
            logger.error(f"Error getting security question: {str(e)}")
            return None, None, 500


    def get_user_by_email_only(self, email: str):
        """Return user dict by email without checking password."""
        users = self.db.collection("users").where("email","==",email).limit(1).stream()
        for doc in users:
            data = doc.to_dict()
            return data, 200
        return None, 404