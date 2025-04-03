# TODO Fix to not use csrf_exempt for safety purposes
from django.shortcuts import render
from django.http import JsonResponse, HttpRequest, HttpResponse
from django.views.decorators.csrf import csrf_exempt

from .recommendation_helpers import (
    configure_bandit,
    train_bandit,
    test_bandit,
    gen_bandit_rec,
    calculate_goodness,
    get_favorite_items,
)
from .firebase import FirebaseManager

import random
from datetime import datetime, timedelta
from bson import ObjectId
import logging
import json
import time


firebaseManager = FirebaseManager()  # DB manager

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)


"""Recommendation API Endpoints"""


@csrf_exempt
def random_recommendation(request: HttpRequest):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request method"}, status=405)
    try:
        data: dict = json.loads(request.body)
        meal_plan_name = data.get("meal_plan_name", "User Meal Plan")

        if "starting_date" not in data:
            starting_date = datetime.now()
        else:
            starting_date = datetime.strptime(data["starting_date"], "%Y-%m-%d")

        if "meal_plan_config" not in data:
            return JsonResponse(
                {"error": "Request body is missing key 'meal_plan_config'"},
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
                    "error": "meal_plan_config key is missing key 'meal_configs' or 'num_days'"
                },
                status=403,
            )

        num_days = meal_plan_config["num_days"]
        num_meals = meal_plan_config["num_meals"]
        meal_configs = meal_plan_config["meal_configs"]

        if "user_preferences" not in data or "user_id" not in data:
            return JsonResponse(
                {
                    "error": "Request body is missing key 'user_preferences' or 'user_id'"
                },
                status=403,
            )
        user_preferences = data["user_preferences"]
        user_id = data["user_id"]

        # Retrieve food and beverage data
        food_items, _ = firebaseManager.get_r3()
        beverages, _ = firebaseManager.get_beverages()

        if isinstance(food_items, Exception):
            logger.error(f"Error retrieving food items: {food_items}")
            return JsonResponse({"error": "Error retrieving food items."}, status=500)

        if isinstance(beverages, Exception):
            logger.error(f"Error retrieving beverages: {beverages}")
            return JsonResponse({"error": "Error retrieving beverages."}, status=500)

        # Generate meal plan
        logger.info("Generating meal plan...")
        days = {}

        for day_index in range(num_days):
            meals = []
            for meal_config in meal_configs:
                meal_types = {}

                # Add beverage if required
                if meal_config["meal_types"]["beverage"]:
                    meal_types["beverage"] = random.choice(list(beverages.keys()))

                # Add main course if required
                if meal_config["meal_types"]["main_course"]:
                    meal_types["main_course"] = random.choice(list(food_items.keys()))

                # Add side dish if required
                if meal_config["meal_types"]["side"]:
                    meal_types["side_dish"] = random.choice(list(food_items.keys()))

                # Add dessert if required

                if meal_config["meal_types"]["dessert"]:
                    meal_types["dessert"] = random.choice(list(food_items.keys()))
                meal = {
                    "_id": str(ObjectId()),  # Unique ID for the meal
                    # "meal_time": meal_config.get("meal_time", ""),
                    "meal_name": meal_config.get("meal_name", ""),
                    "meal_types": meal_types,
                }
                meals.append(meal)
            date_str = (starting_date + timedelta(days=day_index)).strftime("%Y-%m-%d")
            days[date_str] = {"_id": str(ObjectId()), "meals": meals}

        # Construct meal plan object
        meal_plan = {
            "_id": str(ObjectId()),  # Unique ID for the meal plan
            "user_id": user_id,  # Link to the specific user
            "name": meal_plan_name,
            "days": days,
        }

        scores = calculate_goodness(meal_plan, meal_configs, user_preferences)
        meal_plan["scores"] = scores
        # save meal plan to firebase

        try:
            for date, day_plan in meal_plan["days"].items():
                day_plan["user_id"] = user_id
                day_plan["meal_plan_id"] = meal_plan["_id"]

                msg, status = firebaseManager.add_dayplan(user_id, date, day_plan)
                if status != 200:
                    print(msg)

            msg, status = firebaseManager.add_meal_plan(user_id, meal_plan)
            if status != 200:
                print(msg)
            return JsonResponse(meal_plan, status=200)
        except Exception as e:
            print(
                f"Error while saving meal plan to database. Here is a copy of the generated meal plan: {e}"
            )
            return JsonResponse(meal_plan, status=201)
    except Exception as e:
        logger.exception("An error occurred while generating the meal plan.")
        return JsonResponse({"error": f"{e}"}, status=500)


@csrf_exempt
def bandit_recommendation(request: HttpRequest):
    """
    Generate bandit-based meal recommendations for the specified number of days based on user opinions and constraints.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Incorrect HTTP method"}, status=400)
    try:
        data: dict = json.loads(request.body)
        meal_plan_name = data.get("meal_plan_name", "User Meal Plan")

        if "starting_date" not in data:
            starting_date = datetime.now()
        else:
            starting_date = datetime.strptime(data["starting_date"], "%Y-%m-%d")

        if "meal_plan_config" not in data:
            return JsonResponse(
                {"error": "Request body is missing key 'meal_plan_config'"},
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
                    "error": "meal_plan_config key is missing key 'meal_configs' or 'num_days'"
                },
                status=403,
            )

        num_days = meal_plan_config["num_days"]
        num_meals = meal_plan_config["num_meals"]
        meal_configs = meal_plan_config["meal_configs"]

        if "user_preferences" not in data or "user_id" not in data:
            return JsonResponse(
                {
                    "error": "Request body is missing key 'user_preferences' or 'user_id'"
                },
                status=403,
            )
        user_preferences = data["user_preferences"]
        user_id = data["user_id"]
        if not user_id:
            # TODO, handle default case

            ...
        print(f"User ID: {user_id}")

        logger.info("User data parsed")

        # Update user
        need_to_train = True  # training flag
        if user_id:
            try:
                user, status = firebaseManager.get_user_by_id(user_id)
                if status != 200:
                    logger.info(user)
                    return JsonResponse(
                        {"Error": user},
                        status=status,
                    )

                bandit_counter = user["bandit_counter"]
                logger.info(f"User bandit counter: {bandit_counter}")
                if (
                    bandit_counter % 5 != 0
                    and user.get("favorite_items")
                    and all(
                        user["favorite_items"][key]
                        for key in ["Beverage", "Main Course", "Side", "Dessert"]
                    )
                ):
                    # flip flag
                    need_to_train = False

                    # increment the user's bandit counter
                    msg, status = firebaseManager.update_user_attr(
                        user_id, "bandit_counter", bandit_counter + 1
                    )
                    if status != 200:
                        logger.info(msg)
                        return JsonResponse(
                            {
                                "Error": "There was an error in incrementing the bandit counter"
                            },
                            status=status,
                        )

                    favorite_items = user["favorite_items"]
                    logger.info("User past favorite items retrieved")
                else:
                    logger.info(
                        "User favorite items will be replaced, bandit being retrained ..."
                    )
            except:
                # TODO, error message
                return JsonResponse(
                    {
                        "error": "There was an error in retrieving the user's past favorite items"
                    },
                    status=500,
                )

        start = time.time()
        if need_to_train:
            # Configure bandit
            try:
                bandit_trial_path, trial_num = configure_bandit(num_days)
            except:
                return JsonResponse(
                    {"error": "There was an error in configuring the bandit setup"},
                    status=500,
                )
            end = time.time()
            execution_time = end - start
            logger.info(f"Configuring bandit: {execution_time:.4f} seconds")

            # Train Bandit
            start = time.time()
            success = train_bandit(bandit_trial_path)
            if not success:
                return JsonResponse(
                    {"error": "There was an error in training the boosted bandit"},
                    status=500,
                )
            end = time.time()
            execution_time = end - start
            logger.info(f"Training bandit: {execution_time:.4f} seconds")

            # Test Bandit
            start = time.time()
            success = test_bandit(bandit_trial_path)
            if not success:
                return JsonResponse(
                    {"error": "There was an error in testing the boosted bandit"},
                    status=500,
                )
            end = time.time()
            execution_time = end - start
            logger.info(f"Testing bandit: {execution_time:.4f} seconds")

            # get the favorite items recommended by the bandit and save them to firebase
            favorite_items = get_favorite_items(trial_num, user_preferences)
            if user_id:
                msg, status = firebaseManager.update_user_attr(
                    user_id, "favorite_items", favorite_items
                )
                if status != 200:
                    logger.info(msg)
                    return JsonResponse({"error": msg}, status)

        # Generate Bandit Recommendation
        start = time.time()
        logger.info("Generating recommendation")
        try:
            days = gen_bandit_rec(
                favorite_items,
                num_days,
                meal_configs,
                starting_date,
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
                {"error": "There was an error in generating the meal plan"},
                status=500,
            )
        end = time.time()
        execution_time = end - start
        logger.info(f"Generating Rec: {execution_time:.4f} seconds")

        start = time.time()
        scores = calculate_goodness(meal_plan, meal_configs, user_preferences)
        meal_plan["scores"] = scores
        end = time.time()
        execution_time = end - start
        logger.info(f"Evaluating Rec: {execution_time:.4f} seconds")

        logger.info(f"Saving meal plan to firebase")
        try:
            if user_id:
                # save day plans to firebase
                for date, day_plan in meal_plan["days"].items():
                    day_plan["user_id"] = user_id
                    day_plan["meal_plan_id"] = meal_plan["_id"]
                    msg, status = firebaseManager.add_dayplan(user_id, date, day_plan)
                    if status != 200:
                        logger.info(msg)
                        return JsonResponse({"Error": msg}, status=status)

                # save meal plan to firebase
                msg, status = firebaseManager.add_meal_plan(user_id, meal_plan)
                if status != 200:
                    logger.info(msg)
                    return JsonResponse({"Error": msg}, status=status)

                # update user meal config and update user dietary preferences
                msg, status = firebaseManager.update_user_attr(
                    user_id, "meal_plan_config", meal_plan_config
                )
                if status != 200:
                    logger.info(msg)
                    return JsonResponse({"Error": msg}, status=status)

                msg, status = firebaseManager.update_user_attr(
                    user_id,
                    "dietary_preferences.numerical_preferences",
                    user_preferences,
                )
                if status != 200:
                    logger.info(msg)
                    return JsonResponse({"Error": msg}, status=status)

            return JsonResponse(meal_plan, status=200)
        except Exception as e:
            print(f"Error while saving meal plan: {e}")
            return JsonResponse(meal_plan, status=201)
    except:
        return JsonResponse(
            {"error": "There was an error in generating the meal plan x"},
            status=500,
        )


@csrf_exempt
def regenerate_partial_meal_plan(request: HttpRequest):
    """
    Regenerate specific meals in an existing meal plan using bandit recommendations.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Incorrect HTTP method"}, status=400)
    try:
        data: dict = json.loads(request.body)

        required_fields = ["user_id", "dates_to_regenerate"]
        for field in required_fields:
            if field not in data:
                return JsonResponse(
                    {"error": f"Request body is missing required field: {field}"},
                    status=403,
                )

        user_id = data["user_id"]
        user, status = firebaseManager.get_user_by_id(user_id)
        if status != 200:
            return JsonResponse(
                {"Error": f"There was an error in retrieving the user: {user}"},
                status=500,
            )

        user_preferences = user.get_numerical_preferences()
        meal_plan_config = user.get_meal_plan_config()

        dates_to_regenerate = data["dates_to_regenerate"]
        meal_plan_config = data["meal_plan_config"]

        # Get the user's current meal plan
        meal_plan = data.get("meal_plan")
        if not meal_plan:
            meal_plan, status = firebaseManager.get_latest_user_meal_plan(
                user_id=user_id
            )
            if status != 200:
                return JsonResponse(
                    {"error": "Failed to retrieve current meal plan"}, status=status
                )

        user, status = firebaseManager.get_user_by_id(user_id)
        if status != 200:
            return JsonResponse(
                {"error": "Failed to retrieve user data"}, status=status
            )

        bandit_counter = user["bandit_counter"]
        need_to_train = True

        if (
            bandit_counter % 5 != 0
            and user.get("favorite_items")
            and all(
                user["favorite_items"][key]
                for key in ["Beverage", "Main Course", "Side", "Dessert"]
            )
        ):
            need_to_train = False
            favorite_items = user["favorite_items"]

            # Increment bandit counter
            msg, status = firebaseManager.update_user_attr(
                user_id, "bandit_counter", bandit_counter + 1
            )
            if status != 200:
                return JsonResponse(
                    {"error": "Failed to update bandit counter"}, status=status
                )
        else:
            logger.info("Retraining bandit for new recommendations...")

        if need_to_train:
            # Train bandit
            try:
                bandit_trial_path, trial_num = configure_bandit(
                    len(dates_to_regenerate)
                )
                if not train_bandit(bandit_trial_path):
                    return JsonResponse({"error": "Failed to train bandit"}, status=500)
                if not test_bandit(bandit_trial_path):
                    return JsonResponse({"error": "Failed to test bandit"}, status=500)

                favorite_items = get_favorite_items(trial_num, user_preferences)

                msg, status = firebaseManager.update_user_attr(
                    user_id, "favorite_items", favorite_items
                )
                if status != 200:
                    return JsonResponse(
                        {"error": "Failed to update favorite items"}, status=status
                    )
            except Exception as e:
                return JsonResponse(
                    {"error": f"Bandit training failed: {str(e)}"}, status=500
                )

        # new recommendations for specified dates = num of days of mp
        try:
            new_days = gen_bandit_rec(
                favorite_items,
                len(dates_to_regenerate),
                meal_plan_config["meal_configs"],
                datetime.strptime(dates_to_regenerate[0], "%Y-%m-%d"),
            )
        except Exception as e:
            return JsonResponse(
                {"error": f"Failed to generate new recommendations: {str(e)}"},
                status=500,
            )

        # Update meal plan with regenerated recommendations
        success_messages = []
        for date, new_day_plan in new_days.items():
            if date in dates_to_regenerate:
                new_day_plan["user_id"] = user_id
                new_day_plan["meal_plan_id"] = meal_plan["_id"]
                msg, status = firebaseManager.add_dayplan(user_id, date, new_day_plan)
                if status != 200:
                    return JsonResponse(
                        {"error": f"Failed to update day plan for {date}"},
                        status=status,
                    )

                meal_plan["days"][date] = new_day_plan
                success_messages.append(f"Successfully regenerated meals for {date}")

        # TODO fix scores for the regenerated meal plan

        # scores = calculate_goodness(meal_plan, meal_plan_config["meal_configs"], user_preferences)
        # meal_plan["scores"] = scores

        # Update meal plan in Firebase
        msg, status = firebaseManager.add_meal_plan(user_id, meal_plan)
        if status != 200:
            return JsonResponse({"error": "Failed to update meal plan"}, status=status)

        return JsonResponse(
            {"success": True, "meal_plan": meal_plan, "messages": success_messages},
            status=200,
        )

    except Exception as e:
        logger.exception("An error occurred while regenerating the meal plan")
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def edit_meal_plan(request: HttpRequest):
    """
    Edit a specific meal within a generated meal plan.
    You can add, update, or delete individual meal items (beverage, main_course, dessert, side).
    """
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request method. Use POST."}, status=400)

    try:
        data = json.loads(request.body)
        # Old required fields
        # required_fields = ["user_id", "date", "meal_name", "updates"]
        # New required fields with meal_plan
        required_fields = ["user_id", "date", "meal_name", "updates", "meal_plan"]
        for field in required_fields:
            if field not in data:
                return JsonResponse(
                    {"error": f"Missing required fields: {field}"},
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
                    "error": f"Invalid meal type in updates. Valid types are: {', '.join(valid_meal_types)}"
                },
                status=400,
            )

        # Old: Fetch latest meal plan
        # meal_plan, status = firebaseManager.get_latest_user_meal_plan(user_id)
        # if status != 200 or not isinstance(meal_plan, dict):
        #     return JsonResponse({"error": "Could not retrieve user's meal plan"}, status=status)

        if date not in meal_plan.get("days", {}):
            return JsonResponse(
                {"error": f"No meal plan exists for date: {date}"}, status=404
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
                                    {"error": f"Invalid beverage ID: {val}"}, status=400
                                )
                        else:
                            food, _ = firebaseManager.get_single_r3(val)
                            if isinstance(food, Exception):
                                return JsonResponse(
                                    {"error": f"Invalid food item ID: {val}"},
                                    status=400,
                                )
                        meal_types[key] = val
                break

        if not meal_found:
            return JsonResponse(
                {"error": f"Meal '{meal_name}' not found on {date}"}, status=404
            )

        # Update day plan in Firebase
        day_plan["user_id"] = user_id
        day_plan["meal_plan_id"] = meal_plan["_id"]
        msg, status = firebaseManager.add_dayplan(user_id, date, day_plan)
        if status != 200:
            return JsonResponse(
                {"error": f"Failed to update day plan for {date}", "details": msg},
                status=status,
            )

        # Update meal plan in Firebase
        meal_plan["days"][date] = day_plan
        msg, status = firebaseManager.add_meal_plan(user_id, meal_plan)
        if status != 200:
            return JsonResponse({"error": "Failed to update meal plan"}, status=status)

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
        return JsonResponse({"error": f"Unexpected error: {str(e)}"}, status=500)


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

        for key in ["first_name", "last_name", "email", "password", "demographicsInfo"]:
            continue
            if key not in data:
                logger.info(f"Request missing '{key}' attribute")
                return JsonResponse(
                    {"Error": f"Request missing '{key}' attribute"}, status=401
                )

        user = {
            "_id": user_id,
            "first_name": data["first_name"],
            "last_name": data["last_name"],
            "email": data["email"],
            "password": data["password"],
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
            "demographicsInfo": data.get("demographicsInfo", {}),
            "meal_plan_config": {},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "day_plans": {},
            "bandit_counter": 1,  # we'll check if this is 0 mod 5 to determine when to get new items for a user
            "favorite_items": {
                "Main Course": [],
                "Side": [],
                "Dessert": [],
                "Beverage": [],
            },
        }
        logger.info(f"Creating user {user_id}")

        msg, status = firebaseManager.add_user(user_id, user)
        if status != 200:
            return JsonResponse({"Error": msg}, status=500)

        return JsonResponse(user, status=200)
    except:
        return JsonResponse(
            {"error": "There was an error in creating user profile"}, status=400
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
            return JsonResponse({"Error": str(user)}, status=500)

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
        data = json.loads(request.body)
        if "name" not in data:
            return JsonResponse({"Error": "Missing attribute 'name'"}, status=401)
        name = data["name"]

        if "email" not in data:
            return JsonResponse({"Error": "Missing attribute 'email'"}, status=401)
        email = data["email"]

        if "dietaryRestrictions" not in data:
            return JsonResponse(
                {"Error": "Missing attribute 'preferences'"}, status=401
            )
        preferences = data["dietaryRestrictions"]

        # Update Name
        logger.info("Updating Name")
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
        logger.info("Updating Email")
        msg, status = firebaseManager.update_user_attr(user_id, "email", email)
        if status != 200:
            logger.info(msg)
            return JsonResponse({"Error": msg}, status=500)

        # Update Dietary Preferences
        logger.info("Updating Dietary Preferences")
        msg, status = firebaseManager.update_user_attr(
            user_id, "dietary_preferences.preferences", preferences
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
        logger.info("Retrieving User")
        user, status = firebaseManager.get_user_by_id(user_id)
        if status != 200:
            logger.info(msg)
            return JsonResponse({"Error": user}, status=500)

        return JsonResponse(user, status=status)

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


"""Meal Plan Retrieval and Food Item Retrieval Items"""


def retrieve_meal_plan(request: HttpRequest, user_id: str):
    if request.method != "GET":
        return JsonResponse({"Error": "Invalid Request Method"}, status=400)
    meal_plan, _ = firebaseManager.get_latest_user_meal_plan(user_id=user_id)
    if isinstance(meal_plan, Exception):
        return JsonResponse({"Error": str(meal_plan)}, status=500)
    return JsonResponse(meal_plan, status=200)


def retrieve_all_meal_plans(request: HttpRequest, user_id: str):
    if request.method != "GET":
        return JsonResponse({"Error": "Invalid Request Method"}, status=400)

    meal_plans, _ = firebaseManager.get_all_user_meal_plans(user_id=user_id)
    if isinstance(meal_plans, Exception):
        return JsonResponse({"Error": str(meal_plans)}, status=500)
    return JsonResponse({"meal_plans": meal_plans}, status=200)


@csrf_exempt
def retrieve_day_plans(request: HttpRequest, user_id: str):
    if request.method != "POST":
        return JsonResponse({"Error": "Invalid Request Method"}, status=400)
    try:
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
        print(day_plans, status)
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
        return JsonResponse({"error": "Incorrect HTTP method"}, status=400)
    # Get R3 representation of the specified recipe
    r3, _ = firebaseManager.get_single_r3(recipe_id)

    if isinstance(r3, Exception):
        return JsonResponse({"Error": "Error retrieving recipe"}, status=400)

    return JsonResponse(r3, status=200, safe=isinstance(r3, dict))


def get_beverage_info(request: HttpRequest, beverage_id):
    if request.method != "GET":
        return JsonResponse({"error": "Incorrect HTTP method"}, status=400)
    bev, _ = firebaseManager.get_single_beverage(beverage_id)
    if isinstance(bev, Exception):
        return JsonResponse({"Error": "Error retrieving beverage"}, status=400)
    return JsonResponse(bev, status=200)
