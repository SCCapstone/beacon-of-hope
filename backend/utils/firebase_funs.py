def add_document(db, collection_name, document_id, data):
    """
    Add a document to Firestore DB.
    """
    try:
        doc_ref = db.collection(collection_name).document(document_id)
        doc_ref.set(data)
        print(f"Document {document_id} added to {collection_name}.")
    except Exception as e:
        print(f"Failed to add document {document_id} to {collection_name}: {e}")


def get_document(db, collection_name, document_id):
    """
    Retrieves a document from a specified Firestore collection.

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
