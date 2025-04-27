from django.shortcuts import render
from django.http import JsonResponse, HttpRequest, HttpResponse
from django.views.decorators.csrf import csrf_exempt

from .recommendation_helpers import (
    configure_bandit,
    train_bandit,
    test_bandit,
    gen_bandit_rec,
    calculate_goodness,
    get_bandit_favorite_items,
)
from .firebase import FirebaseManager

import random
from datetime import datetime, timedelta
from bson import ObjectId
import logging
import json
import time
from termcolor import colored

firebaseManager = FirebaseManager()  # DB manager

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

GUEST_ID = "67ee9325af31921234bf1241"

"""Recommendation API Endpoints"""


@csrf_exempt
def bandit_recommendation(request: HttpRequest):
    """
    Generate bandit-based meal recommendations for the specified number of days based on user opinions and constraints.
    """
    if request.method != "POST":
        return JsonResponse({"Error": "Incorrect HTTP method"}, status=400)
    try:
        logger.info("Bandit Meal Plan Generation API Called ...")
        logger.info("Parsing Request Body ...")
        data: dict = json.loads(request.body)
        print(data)
        meal_plan_name = data.get("meal_plan_name", "User Meal Plan")

        if "starting_date" not in data:
            starting_date = datetime.now()
        else:
            starting_date = datetime.strptime(data["starting_date"], "%Y-%m-%d")

        if "meal_plan_config" not in data:
            return JsonResponse(
                {"Error": "Request body is missing key 'meal_plan_config'"},
                status=403,
            )

        meal_plan_config = data["meal_plan_config"]

        if (
            "num_meals" not in meal_plan_config
            or "num_days" not in meal_plan_config
            or "meal_configs" not in meal_plan_config
        ):
            return JsonResponse(
                {
                    "Error": "meal_plan_config key is missing key 'meal_configs' or 'num_days'"
                },
                status=403,
            )

        num_days = meal_plan_config["num_days"]
        num_meals = meal_plan_config["num_meals"]
        meal_configs = meal_plan_config["meal_configs"]

        if "user_preferences" not in data:
            return JsonResponse(
                {"Error": "Request body is missing key 'user_preferences'"},
                status=403,
            )
        if "user_id" not in data:
            return JsonResponse(
                {"Error": "Request body is missing key 'user_id'"},
                status=403,
            )
        if "dietary_conditions" not in data:
            print(
                colored(
                    "There is no dietary conditions provided in the request body!! Assuming default values",
                    "red",
                )
            )

        user_preferences = data["user_preferences"]
        user_id = data["user_id"]
        dietary_conditions = data.get(
            "dietary_conditions",
            {
                "diabetes": False,
                "gluten_free": True,
                "vegan": True,
                "vegetarian": False,
            },
        )

        logger.info(f"User ID: {user_id}")

        user, status = firebaseManager.get_user_by_id(user_id)
        if status != 200:
            return JsonResponse(
                {"Error": user},
                status=status,
            )

        old_dietary_conditions = user.get_dietary_conditions()

        bandit_counter = user.get_bandit_counter()

        # we need to train the bandit in one of 3 cases
        #   1. Their new dietary conditions don't match old dietary conditions (They updated their conditions)
        #   2. Bandit Counter is a multiple of 5 (their items need to be refreshed)
        #   3. User has no favorite items at all (this is their first time being recommended a meal)
        need_to_train = (
            not old_dietary_conditions == dietary_conditions
            or not bandit_counter % 5
            or not user.has_favorite_items()
        )
        logger.info(f"User bandit counter: {bandit_counter}")

        # Increment bandit counter
        msg, status = user.increment_bandit_counter()
        if status != 200:
            return JsonResponse(
                {"Error": f"Failed to update bandit counter: {msg}"}, status=status
            )

        if need_to_train:
            logger.info("Retraining bandit for new recommendations...")

            # Train bandit

            try:
                start = time.time()
                bandit_trial_path, trial_num = configure_bandit(num_days)
                end = time.time()
                execution_time = end - start
                logger.info(f"Configuring bandit: {execution_time:.4f} seconds")
            except:
                return JsonResponse(
                    {"Error": "There was an error in configuring the bandit setup"},
                    status=500,
                )

            # Train Bandit
            start = time.time()
            if not train_bandit(bandit_trial_path):
                return JsonResponse(
                    {"Error": "There was an error in training the boosted bandit"},
                    status=500,
                )
            end = time.time()
            execution_time = end - start
            logger.info(f"Training bandit: {execution_time:.4f} seconds")

            # Test Bandit
            start = time.time()
            if not test_bandit(bandit_trial_path):
                return JsonResponse(
                    {"Error": "There was an error in testing the boosted bandit"},
                    status=500,
                )
            end = time.time()
            execution_time = end - start
            logger.info(f"Testing bandit: {execution_time:.4f} seconds")

            logger.info("Fetching recommended favorite items")
            # get the favorite items recommended by the bandit and save them to firebase
            favorite_items = get_bandit_favorite_items(
                trial_num, user_preferences, dietary_conditions
            )

            # update user favorite items
            logger.info("Caching favorite items in DB")
            msg, status = user.set_favorite_items(favorite_items)
            if status != 200:
                logger.info(msg)
                return JsonResponse({"Error": msg}, status)
        else:
            logger.info("Fetching user favorite items")
            favorite_items = user.get_favorite_items()

        permanent_favorite_items = user.get_permanent_favorite_items()
        if permanent_favorite_items is None:
            permanent_favorite_items = {
                "Main Course": [],
                "Side": [],
                "Dessert": [],
                "Beverage": [],
            }
        for key, item_list in permanent_favorite_items.items():
            favorite_items[key] = list(set(favorite_items[key] + item_list))

        # Generate Bandit Recommendation
        start = time.time()
        logger.info("Generating recommendation")
        try:
            days = gen_bandit_rec(
                favorite_items=favorite_items,
                num_days=num_days,
                meal_configs=meal_configs,
                starting_date=starting_date,
                dietary_conditions=dietary_conditions,
                meal_plan_name=meal_plan_name,
            )
            # Construct meal plan object
            meal_plan = {
                "_id": str(ObjectId()),  # Unique ID for the meal plan
                "user_id": user_id,  # Link to the specific user
                "name": meal_plan_name,
                "days": days,
            }
        except:
            logger.error("There was an error in generating the meal plan")
            return JsonResponse(
                {"Error": "There was an error in generating the meal plan"},
                status=500,
            )
        end = time.time()
        execution_time = end - start
        logger.info(f"Generating Rec: {execution_time:.4f} seconds")

        try:
            start = time.time()
            scores = calculate_goodness(
                meal_plan["days"], meal_configs, user_preferences
            )
            meal_plan["scores"] = scores
            end = time.time()
            execution_time = end - start
            logger.info(f"Evaluating Rec: {execution_time:.4f} seconds")
        except Exception as e:
            return JsonResponse(
                {"Error": f"There was an error evaluating the recommendation: {e}"},
                status=500,
            )

        logger.info(f"Saving meal plan to firebase")
        try:
            if user_id:
                logger.info(f"For user: {user_id}")
                # save day plans to firebase
                for date, day_plan in meal_plan["days"].items():
                    day_plan["user_id"] = user_id
                    msg, status = firebaseManager.add_dayplan_temp(
                        user_id, date, day_plan
                    )
                    if status != 200:
                        logger.info(msg)
                        return JsonResponse({"Error": msg}, status=status)

                # update user meal config and update user dietary preferences
                msg, status = user.set_meal_plan_config(meal_plan_config)
                if status != 200:
                    logger.info(msg)
                    return JsonResponse({"Error": msg}, status=status)

                msg, status = user.set_numerical_preferences(user_preferences)
                if status != 200:
                    logger.info(msg)
                    return JsonResponse({"Error": msg}, status=status)

                msg, status = user.set_dietary_conditions(dietary_conditions)
                if status != 200:
                    logger.info(msg)
                    return JsonResponse({"Error": msg}, status=status)

            return JsonResponse(meal_plan, status=200)
        except Exception as e:
            print(f"Error while saving meal plan: {e}")
            return JsonResponse(meal_plan, status=201)
    except:
        return JsonResponse(
            {"Error": "There was an error in generating the meal plan"},
            status=500,
        )


@csrf_exempt
def regenerate_partial_meal_plan(request: HttpRequest):
    """
    Regenerate specific meals in an existing meal plan using bandit recommendations.
    """
    if request.method != "POST":
        return JsonResponse({"Error": "Incorrect HTTP method"}, status=400)
    try:
        logger.info("Regenerate Meal Plan API Endpoint Called ...")
        logger.info("Parsing Request Body...")
        data: dict = json.loads(request.body)
        meal_plan_name = data.get("meal_plan_name", "User Meal Plan")
        required_fields = ["user_id", "dates_to_regenerate"]
        for field in required_fields:
            if field not in data:
                return JsonResponse(
                    {"Error": f"Request body is missing required field: {field}"},
                    status=403,
                )

        user_id = data["user_id"]
        dates_to_regenerate = data["dates_to_regenerate"]

        logger.info("Retrieving User from Firebase ...")
        user, status = firebaseManager.get_user_by_id(user_id)
        if status != 200:
            return JsonResponse(
                {"Error": f"There was an error in retrieving the user: {user}"},
                status=status,
            )

        user_preferences = user.get_numerical_preferences()
        meal_plan_config = user.get_meal_plan_config()

        bandit_counter = user.get_bandit_counter()
        need_to_train = not (bandit_counter % 5 and user.has_favorite_items())
        logger.info(f"User bandit counter: {bandit_counter}")

        # Increment bandit counter
        msg, status = user.increment_bandit_counter()
        if status != 200:
            return JsonResponse(
                {"Error": f"Failed to update bandit counter: {msg}"}, status=status
            )

        if need_to_train:
            logger.info("Retraining bandit for new recommendations...")
            # Train bandit
            try:
                # configure bandit
                bandit_trial_path, trial_num = configure_bandit(
                    len(dates_to_regenerate)
                )

                # train and test bandit
                if not train_bandit(bandit_trial_path):
                    return JsonResponse({"Error": "Failed to train bandit"}, status=500)
                if not test_bandit(bandit_trial_path):
                    return JsonResponse({"Error": "Failed to test bandit"}, status=500)

                # extract favorite items
                favorite_items = get_bandit_favorite_items(trial_num, user_preferences)

                # update user in firebase
                msg, status = user.set_favorite_items(favorite_items)
                if status != 200:
                    return JsonResponse(
                        {"Error": f"Failed to update favorite items: {msg}"},
                        status=status,
                    )
            except Exception as e:
                return JsonResponse(
                    {"Error": f"Bandit training failed: {str(e)}"}, status=500
                )
        else:
            logger.info("Fetching user favorite items")
            favorite_items = user.get_favorite_items()

        dietary_conditions = user.get_dietary_conditions()

        # Generate Bandit Recommendation
        try:
            logger.info("Generating Recommendation ...")
            days = gen_bandit_rec(
                favorite_items=favorite_items,
                num_days=len(dates_to_regenerate),
                meal_configs=meal_plan_config["meal_configs"],
                starting_date=datetime.strptime(dates_to_regenerate[0], "%Y-%m-%d"),
                dietary_conditions=dietary_conditions,
                meal_plan_name=meal_plan_name,
            )
        except Exception as e:
            return JsonResponse(
                {"Error": f"Failed to generate new recommendations: {str(e)}"},
                status=500,
            )

        # Save new day plans
        for date, day_plan in days.items():
            logger.info("Caching to Firebase")
            day_plan["user_id"] = user_id

            # overwrites existing dayplan for the same date
            msg, status = firebaseManager.add_dayplan_temp(user_id, date, day_plan)

            if status != 200:
                return JsonResponse(
                    {"Error": f"Failed to update day plan for {date}: {msg}"},
                    status=status,
                )

        try:
            logger.info("Calculating the Goodness Scores of the Plan")
            calculate_goodness(days, meal_plan_config["meal_configs"], user_preferences)
        except Exception as e:
            return JsonResponse(
                {
                    "Error": f"There was an error in calculating the goodness score of the regenerated day plan: {e}"
                },
                status=500,
            )

        return JsonResponse({"days": days}, status=200)

    except Exception as e:
        logger.exception("An error occurred while regenerating the meal plan")
        return JsonResponse({"Error": str(e)}, status=500)


@csrf_exempt
def edit_meal_plan(request: HttpRequest):
    """
    Edit a specific meal within a generated meal plan.
    You can add, update, or delete individual meal items (beverage, main_course, dessert, side).
    """
    if request.method != "POST":
        return JsonResponse({"Error": "Invalid request method. Use POST."}, status=400)

    try:
        data = json.loads(request.body)
        # Old required fields
        # required_fields = ["user_id", "date", "meal_name", "updates"]
        # New required fields with meal_plan
        required_fields = ["user_id", "date", "meal_name", "updates", "meal_plan"]
        for field in required_fields:
            if field not in data:
                return JsonResponse(
                    {"Error": f"Missing required fields: {field}"},
                    status=400,
                )

        user_id = data["user_id"]
        date = data["date"]
        meal_name = data["meal_name"].lower()
        updates = data["updates"]
        # New: Get meal plan from request body
        meal_plan = data["meal_plan"]

        # Validate updates object
        valid_meal_types = {"beverage", "main_course", "side", "dessert"}
        if not all(key in valid_meal_types for key in updates.keys()):
            return JsonResponse(
                {
                    "Error": f"Invalid meal type in updates. Valid types are: {', '.join(valid_meal_types)}"
                },
                status=400,
            )

        # Old: Fetch latest meal plan
        # meal_plan, status = firebaseManager.get_latest_user_meal_plan(user_id)
        # if status != 200 or not isinstance(meal_plan, dict):
        #     return JsonResponse({"Error": "Could not retrieve user's meal plan"}, status=status)

        if date not in meal_plan.get("days", {}):
            return JsonResponse(
                {"Error": f"No meal plan exists for date: {date}"}, status=404
            )

        day_plan = meal_plan["days"][date]
        meals = day_plan.get("meals", [])

        # Find the meal to update
        meal_found = False
        for meal in meals:
            if meal.get("meal_name", "").lower() == meal_name:
                meal_found = True
                meal_types = meal.setdefault("meal_types", {})

                # Update meal types
                for key, val in updates.items():
                    if val is None:
                        meal_types.pop(key, None)
                    else:
                        # Validate that the new item exists in the database
                        if key == "beverage":
                            beverage, _ = firebaseManager.get_single_beverage(val)
                            if isinstance(beverage, Exception):
                                return JsonResponse(
                                    {"Error": f"Invalid beverage ID: {val}"}, status=400
                                )
                        else:
                            food, _ = firebaseManager.get_single_r3(val)
                            if isinstance(food, Exception):
                                return JsonResponse(
                                    {"Error": f"Invalid food item ID: {val}"},
                                    status=400,
                                )
                        meal_types[key] = val
                break

        if not meal_found:
            return JsonResponse(
                {"Error": f"Meal '{meal_name}' not found on {date}"}, status=404
            )

        # Update day plan in Firebase
        day_plan["user_id"] = user_id

        msg, status = firebaseManager.add_dayplan_temp(user_id, date, day_plan)
        if status != 200:
            return JsonResponse(
                {"Error": f"Failed to update day plan for {date}", "details": msg},
                status=status,
            )

        # Update meal plan in Firebase
        meal_plan["days"][date] = day_plan
        msg, status = firebaseManager.add_meal_plan(user_id, meal_plan)
        if status != 200:
            return JsonResponse({"Error": "Failed to update meal plan"}, status=status)

        return JsonResponse(
            {
                "success": True,
                "updated_day_plan": day_plan,
                "message": f"Successfully updated {meal_name} for {date}",
            },
            status=200,
        )

    except Exception as e:
        logger.exception("edit_meal_plan failed")
        return JsonResponse({"Error": f"Unexpected error: {str(e)}"}, status=500)


@csrf_exempt
def save_meal(request: HttpRequest):
    """Saving a meal (Moving from temporary storage to permanent storage)"""
    if request.method != "POST":
        return JsonResponse({"Error": "Invalid Request Method"}, status=400)
    try:
        logger.info("Save Meal API Endpoint Called ...")
        logger.info("Parsing Request Body ...")
        data = json.loads(request.body)

        keys = ["date", "user_id", "meal_id"]
        for key in keys:
            if key not in data:
                return JsonResponse(
                    {"Error": f"Request Body missing required attribute: {key}"},
                    status=403,
                )

        date, user_id, meal_id = [data[key] for key in keys]
        user, status = firebaseManager.get_user_by_id(user_id)
        if status != 200:
            return JsonResponse(
                {
                    "Error": f"There was some error in retrieving the user from Firebase: {user}"
                },
                status=status,
            )
        try:
            day_plans = user.get_temp_day_plans()
        except:
            return JsonResponse(
                {"Error": "There was an error in retrieving the user's day plans"},
                status=500,
            )
        if date not in day_plans:
            return JsonResponse(
                {"Error": f"The provided date: {date} is not in the recorded plans"},
                status=403,
            )
        day_plan_id = day_plans[date]

        # create a day plan object in the permanent storage (if it already exists, this does nothing)
        msg, status = firebaseManager.create_dayplan_object(user_id, date, day_plan_id)
        if status != 200:
            return JsonResponse(
                {"Error": f"There was an error in creating the day plan object: {msg}"},
                status=status,
            )

        day_plan, status = firebaseManager.get_temp_dayplan_by_id(day_plan_id)
        if status != 200:
            return JsonResponse(
                {
                    "Error": f"There was an error in retrieving hte previously stored meal plan: {day_plan}"
                },
                status=status,
            )

        for meal in day_plan["meals"]:
            if meal["_id"] == meal_id:
                # store meal in permanent day plan
                msg, status = firebaseManager.store_meal_in_dayplan(day_plan_id, meal)

                return JsonResponse(
                    {"Message": msg},
                    status=status,
                )
        return JsonResponse(
            {
                "Error": "The requested meal does not exist in temporary meal plan storage"
            },
            status=500,
        )

    except Exception as e:
        return JsonResponse(
            {"Error": f"There was an error saving the meal plan: {e}"}, status=500
        )


@csrf_exempt
def delete_meal(request: HttpRequest):
    """Deleting a meal from permanent storage"""
    if request.method != "DELETE":
        return JsonResponse({"Error": "Invalid Request Method"}, status=400)
    try:
        logger.info("Delete Meal API Endpoint Called ...")
        logger.info("Parsing Request Body ...")
        data = json.loads(request.body)

        keys = ["date", "user_id", "meal_id"]
        for key in keys:
            if key not in data:
                return JsonResponse(
                    {"Error": f"Request Body missing required attribute: {key}"},
                    status=403,
                )

        date, user_id, meal_id = [data[key] for key in keys]

        logger.info(
            f"Getting corresponding day plan id for date {date} for user {user_id}"
        )
        user, status = firebaseManager.get_user_by_id(user_id)
        if status != 200:
            return JsonResponse(
                {
                    "Error": f"There was some error in retrieving the user from Firebase: {user}"
                },
                status=status,
            )
        try:
            day_plans = user.get_day_plans()
        except:
            return JsonResponse(
                {"Error": "There was an error in retrieving the user's day plans"},
                status=500,
            )
        if date not in day_plans:
            return JsonResponse(
                {"Error": f"The provided date: {date} is not in the recorded plans"},
                status=403,
            )
        day_plan_id = day_plans[date]

        msg, status = firebaseManager.remove_meal_from_dayplan(meal_id, day_plan_id)
        if status != 200:
            return JsonResponse(
                {"Error": f"There was an error in removing the meal, {msg}"},
                status=status,
            )
        return JsonResponse(
            {"Message": "The request meal was removed successfully"}, status=status
        )

    except Exception as e:
        return JsonResponse(
            {"Error": f"There was an error saving the meal plan: {e}"}, status=500
        )


@csrf_exempt
def favorite_meal(request: HttpRequest):
    """Deleting a meal from permanent storage"""
    if request.method != "POST":
        return JsonResponse({"Error": "Invalid Request Method"}, status=400)
    try:
        logger.info("Favorite Meal API Endpoint Called ...")
        logger.info("Parsing Request Body ...")
        data = json.loads(request.body)

        keys = ["date", "user_id", "meal_id"]
        for key in keys:
            if key not in data:
                return JsonResponse(
                    {"Error": f"Request Body missing required attribute: {key}"},
                    status=403,
                )

        date, user_id, meal_id = [data[key] for key in keys]

        logger.info(
            f"Getting corresponding day plan id for date {date} for user {user_id}"
        )
        user, status = firebaseManager.get_user_by_id(user_id)
        if status != 200:
            return JsonResponse(
                {
                    "Error": f"There was some error in retrieving the user from Firebase: {user}"
                },
                status=status,
            )
        try:
            day_plans = user.get_day_plans()
        except:
            return JsonResponse(
                {"Error": "There was an error in retrieving the user's day plans"},
                status=500,
            )
        if date not in day_plans:
            return JsonResponse(
                {"Error": f"The provided date: {date} is not in the recorded plans"},
                status=403,
            )
        day_plan_id = day_plans[date]

        logger.info("Getting Meal Items ...")
        meal_items, status = firebaseManager.get_meal_items(meal_id, day_plan_id)
        if status != 200:
            return JsonResponse(
                {"Error": f"There was an error in retrieving that meal: {meal_items}"},
                status=status,
            )

        logger.info(f"Updating Permanent Items with {meal_items}...")
        msg, status = user.update_permanent_favorite_items(meal_items)
        if status != 200:
            return JsonResponse(
                {
                    "Error": f"There was an error in updating the permanent favorite items {msg}"
                },
                status=status,
            )

        return JsonResponse({"Message": msg}, status=status)

    except Exception as e:
        return JsonResponse(
            {"Error": f"There was an error favoriting the meal: {e}"}, status=500
        )


"""User Account API Endpoints"""


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
                    "dairy": 0,
                    "nuts": 0,
                    "meat": 0,
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
                        user_id, f"demographicInfo.{attr}", demographicsInfo[attr]
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
            ...

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
            "first_name": "Guest",
            "last_name": "User",
            "email": "",
            "password": "",
            "plan_ids": [],
            "dietary_preferences": {
                "preferences": [""],
                "numerical_preferences": {
                    "dairy": 0,
                    "nuts": 0,
                    "meat": 0,
                },
            },
            "health_info": {
                "allergies": [""],
                "conditions": [""],
            },
            "demographicsInfo": {},
            "meal_plan_config": {},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "day_plans": {},
            "bandit_counter": 1,
            "favorite_items": {
                "Main Course": [],
                "Side": [],
                "Dessert": [],
                "Beverage": [],
            },
            "dietary_conditions": {
                "diabetes": False,
                "gluten_free": False,
                "vegan": False,
                "vegetarian": False,
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


"""Meal Plan Retrieval and Food Item Retrieval Items"""


@csrf_exempt
def retrieve_day_plans(request: HttpRequest, user_id: str):
    if request.method != "POST":
        return JsonResponse({"Error": "Invalid Request Method"}, status=400)
    try:
        logger.info("Retrieve Day Plans API called ...")
        logger.info("Parsing Request Body ...")
        data = json.loads(request.body)
        if "dates" not in data:
            return JsonResponse(
                {
                    "Error": "Missing required 'dates' parameter, which is a list of date strings."
                },
                400,
            )
        dates = data["dates"]
        day_plans, status = firebaseManager.get_day_plans(user_id, dates)

        if status != 200:
            return JsonResponse(
                {"Error": f"There was an error retrieving the day plans: {day_plans}"},
                status,
            )

        return JsonResponse({"day_plans": day_plans}, status=status)

    except Exception as e:
        return JsonResponse(
            {"Error": f"There was an error retrieving the day plans: {e}"}, status=500
        )


def get_recipe_info(request: HttpRequest, recipe_id):
    if request.method != "GET":
        return JsonResponse({"Error": "Incorrect HTTP method"}, status=400)
    # Get R3 representation of the specified recipe
    r3, _ = firebaseManager.get_single_r3(recipe_id)

    if isinstance(r3, Exception):
        return JsonResponse({"Error": "Error retrieving recipe"}, status=400)

    return JsonResponse(r3, status=200, safe=isinstance(r3, dict))


def get_beverage_info(request: HttpRequest, beverage_id):
    if request.method != "GET":
        return JsonResponse({"Error": "Incorrect HTTP method"}, status=400)
    bev, _ = firebaseManager.get_single_beverage(beverage_id)
    if isinstance(bev, Exception):
        return JsonResponse({"Error": "Error retrieving beverage"}, status=400)
    return JsonResponse(bev, status=200)


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
                    "dairy": 0,
                    "nuts": 0,
                    "meat": 0,
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
