import firebase_admin
from firebase_admin import credentials, firestore
from tqdm import tqdm

GUEST_ID = "67ee9325af31921234bf1241"


def initialize_firestore():
    """
    Initialize Firebase Admin SDK.
    """
    cred = credentials.Certificate("firebase_key.json")
    # Only initialize the app if it hasn't been initialized yet
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    return firestore.client()


db = initialize_firestore()


def delete_document(collection_name, document_id):
    """
    Deletes a single document from the specified collection.
    """

    # keep the guest user
    if collection_name == "users" and document_id == GUEST_ID:
        return
    try:
        doc_ref = db.collection(collection_name).document(document_id)
        doc_ref.delete()
        print(f"Deleted document {document_id} from collection {collection_name}.")
    except Exception as e:
        print(
            f"Error deleting document {document_id} from collection {collection_name}: {e}"
        )


def depopulate_collection(collection_name):
    """
    Deletes all documents in a given collection.
    """
    docs = db.collection(collection_name).get()
    if not docs:
        print(f"No documents found in collection {collection_name}.")
        return
    for doc in tqdm(docs, total=len(docs)):
        delete_document(collection_name, doc.id)


def depopulate_all_data():
    """
    Depopulates the database by clearing out only the 'users' and 'mealplans' collections.
    """
    collections_to_clear = ["users", "meal_plans", "day_plans", "temp_day_plans"]
    for coll in tqdm(collections_to_clear, total=len(collections_to_clear)):
        print(f"\nDepopulating collection: {coll}")
        depopulate_collection(coll)
        print(f"Finished depopulating collection: {coll}")


if __name__ == "__main__":
    depopulate_all_data()
