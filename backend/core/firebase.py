import firebase_admin
from firebase_admin import credentials, firestore

# Path to your service account key JSON file (CHANGE FOR AWS)
SERVICE_ACCOUNT_FILE = "firebase_key.json"

# Initialize Firebase
cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
firebase_admin.initialize_app(cred)

# Initialize Firestore database
db = firestore.client()


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


def get_document(collection_name, document_id):
    """
    Retrieves a document (recipe, user, etc.) from a specified Firestore collection.

    :param collection_name: The name of the Firestore collection
    :param document_id: The ID of the document to retrieve
    :return: The document data or an error message
    """
    try:
        doc_ref = db.collection(collection_name).document(document_id)
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict()
        else:
            return f"Document {document_id} does not exist."
    except Exception as e:
        return f"Error getting document: {e}"


def load_r3():
    """
    Retrieves all food recipes from firestore

    :return: A list of beverage objects or an error message
    """
    try:
        recipe_ref = db.collection("food-recipes")
        recipes = recipe_ref.stream()  # list of firestore document objects
        recipes = [recipe.to_dict() for recipe in recipes]
        return {recipe['recipe-id']: recipe for recipe in recipes}
    except Exception as e:
        return f"Error retrieving collection: {e}"


def load_beverages():
    """
    Retrieves all beverages from firestore

    :return: A list of beverage objects or an error message
    """
    try:
        bev_ref = db.collection("beverages")
        bevs = bev_ref.stream()  # list of firestore document objects
        bevs = [bev.to_dict() for bev in bevs]
        return {bev['bev-id']: bev for bev in bevs}
    except Exception as e:
        return f"Error retrieving collection: {e}"
