from django.http import JsonResponse, HttpRequest, HttpResponse
from django.views.decorators.csrf import csrf_exempt

from ..modules.recommendation_helpers import (
    configure_bandit,
    train_bandit,
    test_bandit,
    gen_bandit_rec,
    calculate_goodness,
    get_bandit_favorite_items,
)
from ..modules.firebase import FirebaseManager

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
