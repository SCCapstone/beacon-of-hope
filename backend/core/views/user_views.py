from django.http import JsonResponse, HttpRequest, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from firebase_admin import firestore


from ..modules.firebase import FirebaseManager

from datetime import datetime
from bson import ObjectId
import logging
import json
from termcolor import colored

firebaseManager = FirebaseManager()
db = firestore.client()
# DB manager

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)


@csrf_exempt
def create_user(request: HttpRequest):
    """
    Creating a user
    """
    if request.method != "POST":
        return JsonResponse({"Error": "Invalid Request Method"}, status=400)
    try:
        data = json.loads(request.body)

        # generate new user id for the user
        user_id = str(ObjectId())

        user = {
            "_id": user_id,
            "first_name": data.get("first_name", ""),
            "last_name": data.get("last_name", ""),
            "email": data.get("email", ""),
            "password": data.get("password", ""),
            "plan_ids": [],
            "dietary_preferences": {
                "preferences": [""],
                "numerical_preferences": {
                    "dairyPreference": 0,
                    "nutsPreference": 0,
                    "meatPreference": 0,
                },
            },
            "dietary_conditions": {
                "diabetes": True,
                "gluten_free": True,
                "vegan": True,
                "vegetarian": True,
            },
            "demographicsInfo": data.get("demographicsInfo", {}),
            "meal_plan_config": {},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "temp_day_plans": {},
            "day_plans": {},
            "bandit_counter": 1,  # we'll check if this is 0 mod 5 to determine when to get new items for a user
            "favorite_items": {
                "Main Course": [],
                "Side": [],
                "Dessert": [],
                "Beverage": [],
            },
            "nutritional_goals": {
                "calories": 0,
                "carbs": 0,
                "protein": 0,
                "fiber": 0,
            },
        }
        logger.info(f"Creating user {user_id}")

        msg, status = firebaseManager.add_user(user_id, user)
        if status != 200:
            return JsonResponse({"Error": msg}, status=500)

        return JsonResponse(user, status=200)
    except:
        return JsonResponse(
            {"Error": "There was an error in creating user profile"}, status=400
        )


@csrf_exempt
def login_user(request: HttpRequest):
    """Login user"""
    if request.method != "POST":
        return JsonResponse({"Error": "Invalid Request Method"}, status=400)
    try:
        data = json.loads(request.body)
        user, _ = firebaseManager.get_user_by_email(
            user_email=data["email"], password=data["password"]
        )

        if isinstance(user, Exception):
            logger.info(colored(f"{user}", "red"))
            return JsonResponse({"Error": str(user)}, status=500)
        logger.info(colored(f"Logging in user with id: {user['_id']}", "green"))
        return JsonResponse(user, status=200)

    except KeyError as e:  # Handle missing keys
        return JsonResponse({"Error": f"Missing key: {str(e)}"}, status=400)

    except Exception as e:
        return JsonResponse(
            {"Error": str(e)}, status=400
        )  # Ensure the error is JSON serializable


@csrf_exempt
def update_user(request: HttpRequest, user_id: str):
    """Update user"""
    if request.method != "PATCH":
        return JsonResponse({"Error": "Invalid Request Method"}, status=400)
    try:
        logger.info("Update User API Endpoint called ...")
        logger.info("Parsing Request Body ...")
        data = json.loads(request.body)

        # Update Name
        if "name" in data:
            logger.info("Updating Name")
            name = data["name"]
            first, last = name.split()

            msg, status = firebaseManager.update_user_attr(user_id, "first_name", first)
            if status != 200:
                logger.info(msg)
                return JsonResponse({"Error": msg}, status=500)

            msg, status = firebaseManager.update_user_attr(user_id, "last_name", last)
            if status != 200:
                logger.info(msg)
                return JsonResponse({"Error": msg}, status=500)

        # Update Email
        if "email" in data:
            email = data["email"]
            logger.info("Updating Email")
            msg, status = firebaseManager.update_user_attr(user_id, "email", email)
            if status != 200:
                logger.info(msg)
                return JsonResponse({"Error": msg}, status=500)

        # Update Dietary Preferences
        if "dietaryPreferences" in data:
            logger.info("Updating Dietary Preferences")
            dietaryPreferences = data["dietaryPreferences"]

            for attr in ["preferences", "numerical_preferences"]:
                if attr in dietaryPreferences:
                    dietaryPreferences

                    msg, status = firebaseManager.update_user_attr(
                        user_id,
                        f"dietary_preferences.{attr}",
                        dietaryPreferences[attr],
                    )
                    if status != 200:
                        logger.info(msg)
                        return JsonResponse({"Error": msg}, status=500)

        if "demographicsInfo" in data:
            logger.info("Updating Demographics Info")
            demographicsInfo = data["demographicsInfo"]
            for attr in ["ethnicity", "race", "gender", "height", "weight", "age"]:
                if attr in demographicsInfo:
                    msg, status = firebaseManager.update_user_attr(
                        user_id, f"demographicsInfo.{attr}", demographicsInfo[attr]
                    )
                    if status != 200:
                        logger.info(msg)
                        return JsonResponse({"Error": msg}, status=500)

        if "dietary_conditions" in data:
            logger.info("Updating Dietary Conditions")
            dietary_conditions = data["dietary_conditions"]
            for attr in ["diabetes", "gluten_free", "vegan", "vegetarian"]:
                if attr in dietary_conditions:
                    msg, status = firebaseManager.update_user_attr(
                        user_id, f"dietary_conditions.{attr}", dietary_conditions[attr]
                    )
                    if status != 200:
                        logger.info(msg)
                        return JsonResponse({"Error": msg}, status=500)

        if "nutritional_goals" in data:
            logger.info("Updating Nutritional Goals")
            nutritional_goals = data["nutritional_goals"]

            msg, status = firebaseManager.update_user_attr(
                user_id, "nutritional_goals", nutritional_goals
            )
            if status != 200:
                logger.info(msg)
                return JsonResponse({"Error": msg}, status=500)

        # Update Last Updated Timestamp
        logger.info("Updating Timestamp")
        msg, status = firebaseManager.update_user_attr(
            user_id, "updated_at", datetime.now()
        )
        if status != 200:
            logger.info(msg)
            return JsonResponse({"Error": msg}, status=status)

        # Return Updated User

        logger.info(colored("Retrieving User", "light_yellow"))
        user, status = firebaseManager.get_user_by_id(user_id)
        if status != 200:
            logger.info(user)
            return JsonResponse({"Error": user}, status=status)
        return JsonResponse(user.to_dict(), status=status)
    except:
        return JsonResponse(
            {"Error": "There was some error in updating the user"}, status=500
        )


@csrf_exempt
def delete_account(request: HttpRequest, user_id: str):
    if request.method != "DELETE":
        return JsonResponse({"Error": "Invalid Request Method"}, status=400)
    try:
        firebaseManager.delete_user(user_id)
        # 204 No Content for successful deletion
        return HttpResponse(status=204)
    except:
        return JsonResponse({"Error": f"Couldn't delete user: {user_id}"}, status=500)


@csrf_exempt
def exit_default(request: HttpRequest):
    """
    Reset a user's data to default values while preserving their user ID.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request method. Use POST."}, status=400)

    try:
        data = json.loads(request.body)
        if "user_id" not in data:
            return JsonResponse(
                {"error": "Missing required field: user_id"}, status=400
            )

        user_id = data["user_id"]
        default_user = {
            "first_name": "",
            "last_name": "",
            "email": "",
            "password": "",
            "plan_ids": [],
            "dietary_preferences": {
                "preferences": [""],
                "numerical_preferences": {
                    "dairyPreference": 0,
                    "nutsPreference": 0,
                    "meatPreference": 0,
                },
            },
            "dietary_conditions": {
                "diabetes": True,
                "gluten_free": True,
                "vegan": True,
                "vegetarian": True,
            },
            "demographicsInfo": {},
            "meal_plan_config": {},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "temp_day_plans": {},
            "day_plans": {},
            "bandit_counter": 1,  # we'll check if this is 0 mod 5 to determine when to get new items for a user
            "favorite_items": {
                "Main Course": [],
                "Side": [],
                "Dessert": [],
                "Beverage": [],
            },
            "nutritional_goals": {"calories": 0, "carbs": 0, "protein": 0, "fiber": 0},
        }

        for field, value in default_user.items():
            msg, status = firebaseManager.update_user_attr(user_id, field, value)
            if status != 200:
                return JsonResponse(
                    {"error": f"Failed to update field '{field}': {msg}"}, status=status
                )

        return JsonResponse(
            {
                "success": True,
                "message": "Successfully reset user data to default values",
                "user_id": user_id,
            },
            status=200,
        )

    except Exception as e:
        logger.exception("exit_default failed")
        return JsonResponse({"error": f"Unexpected error: {str(e)}"}, status=500)


@csrf_exempt
def set_nutritional_goals(request: HttpRequest):
    """
    Set nutritional goals for a user.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request method. Use POST."}, status=400)

    try:
        data = json.loads(request.body)
        print(data)
        required_fields = ["user_id", "daily_goals"]
        if not all(k in data for k in required_fields):
            return JsonResponse(
                {"error": "Missing required fields: user_id or daily_goals"},
                status=400,
            )

        user_id = data["user_id"]
        daily_goals = data["daily_goals"]

        required_nutrients = ["calories", "carbs", "protein", "fiber"]
        if not all(nutrient in daily_goals for nutrient in required_nutrients):
            return JsonResponse(
                {"error": "Missing required nutrients in daily_goals"},
                status=400,
            )

        for nutrient, value in daily_goals.items():
            if not isinstance(value, (int, float)) or value < 0:
                return JsonResponse(
                    {
                        "error": f"Invalid value for {nutrient}. Must be a positive number."
                    },
                    status=400,
                )

        msg, status = firebaseManager.update_user_attr(
            user_id, "nutritional_goals", daily_goals
        )
        if status != 200:
            return JsonResponse(
                {"error": f"Failed to update nutritional goals: {msg}"}, status=status
            )

        return JsonResponse(
            {
                "success": True,
                "message": "Successfully updated nutritional goals",
                "daily_goals": daily_goals,
            },
            status=200,
        )

    except Exception as e:
        logger.exception("set_nutritional_goals failed")
        return JsonResponse({"error": f"Unexpected error: {str(e)}"}, status=500)


@csrf_exempt
def get_nutritional_goals(request: HttpRequest, user_id: str):
    """
    Get nutritional goals for a user.
    """
    if request.method != "GET":
        return JsonResponse({"error": "Invalid request method. Use GET."}, status=400)

    try:
        user, status = firebaseManager.get_user_by_id(user_id)
        if status != 200:
            return JsonResponse(
                {"error": "Failed to retrieve user data"}, status=status
            )
        nutritional_goals = user.get_nutritional_goals()
        return JsonResponse(
            {"success": True, "daily_goals": nutritional_goals}, status=200
        )

    except Exception as e:
        logger.exception("get_nutritional_goals failed")
        return JsonResponse({"error": f"Unexpected error: {str(e)}"}, status=500)


# @csrf_exempt
@api_view(["POST"])
def logout_user(request):
    try:
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"error": "Missing user_id"}, status=400)

        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()

        if not user_doc.exists:
            return Response({"error": "User not found"}, status=404)

        user_data = user_doc.to_dict()
        temp_day_plans = user_data.get("temp_day_plans", {})

        for day, temp_plan_id in temp_day_plans.items():
            temp_day_plan_ref = db.collection("temp_day_plans").document(temp_plan_id)
            temp_day_plan_ref.delete()

        user_ref.update({"temp_day_plans": {}})

        return Response(
            {"message": "Successfully logged out and cleared temp day plans."},
            status=200,
        )

    except Exception as e:
        print("🔥🔥🔥 ERROR:", e)
        return Response({"error": str(e)}, status=500)
