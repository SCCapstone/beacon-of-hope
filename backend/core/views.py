# TODO Fix to not use csrf_exempt for safety purposes
# TODO ensure all status codes are accurate
from django.shortcuts import render
from django.http import JsonResponse, HttpRequest, HttpResponse
from .models import UserPreference, MenuItem

import random
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, timedelta
from bson import ObjectId
import logging

import json

from .bandit_helpers import (
    configure_bandit,
    train_bandit,
    test_bandit,
    gen_bandit_rec,
)
from .firebase import (
    get_beverages,
    get_r3,
    get_single_r3,
    get_single_beverage,
    get_user_by_email,
    add_user,
    delete_user,
    get_user_mealplan,
    add_mealplan,
)

# TODO, add error checking for all recieved responses and send corresponding status code for errors faced

logger = logging.getLogger(__name__)  # neccesary to generate meal plan


@csrf_exempt
def random_recommendation(request: HttpRequest):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            meal_plan_config = data.get("meal_plan_config")
            user_id = data.get("user_id")

            if not meal_plan_config:
                return JsonResponse(
                    {"error": "Meal plan configuration is required."}, status=400
                )

            # Validate required fields
            num_days = meal_plan_config.get("num_days")
            num_meals = meal_plan_config.get("num_meals")
            meal_configs = meal_plan_config.get("meal_configs")

            # sanity check
            assert num_meals == len(meal_configs)

            if (
                not isinstance(num_days, int)
                or not isinstance(num_meals, int)
                or not isinstance(meal_configs, list)
            ):
                return JsonResponse(
                    {"error": "Invalid meal plan configuration."}, status=400
                )

            # Retrieve food and beverage data
            food_items = get_r3()
            beverages = get_beverages()

            if isinstance(food_items, Exception):
                logger.error(f"Error retrieving food items: {food_items}")
                return JsonResponse(
                    {"error": "Error retrieving food items."}, status=500
                )

            if isinstance(beverages, Exception):
                logger.error(f"Error retrieving beverages: {beverages}")
                return JsonResponse(
                    {"error": "Error retrieving beverages."}, status=500
                )

            # TODO need to fix
            # # Get user ID
            # user_id = request.GET.get("user_id") or request.POST.get("user_id")
            # if not user_id:
            #     logger.error("User ID is missing.")
            #     return JsonResponse({"error": "User ID is required."}, status=400)

            # Generate meal plan
            logger.info("Generating meal plan...")
            days = []
            for day_index in range(num_days):
                day = {"day": day_index, "meals": []}
                for meal_config in meal_configs:
                    meal_types = {}

                    # Add beverage if required
                    if meal_config["meal_types"]["beverage"]:
                        meal_types["beverage"] = random.choice(list(beverages.keys()))

                    # Add main course if required
                    if meal_config["meal_types"]["main_course"]:
                        meal_types["main_course"] = random.choice(
                            list(food_items.keys())
                        )

                    # Add side dish if required
                    if meal_config["meal_types"]["side"]:
                        meal_types["side_dish"] = random.choice(list(food_items.keys()))

                    # Add dessert if required

                    if meal_config["meal_types"]["dessert"]:
                        meal_types["dessert"] = random.choice(list(food_items.keys()))
                    meal = {
                        "_id": str(ObjectId()),  # Unique ID for the meal
                        "meal_time": meal_config.get("meal_time", ""),
                        "meal_name": meal_config.get("meal_name", ""),
                        "meal_types": meal_types,
                    }
                    day["meals"].append(meal)
                days.append(day)

            # Construct meal plan object
            mealplan = {
                "_id": str(ObjectId()),  # Unique ID for the meal plan
                "user_id": user_id,  # Link to the specific user
                "name": "Gen Meal Plan",
                "start_date": datetime.now(),
                "end_date": datetime.now() + timedelta(days=num_days),
                "days": days,
                "status": "active",
                "tags": ["user", "generated"],  # can change tags
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
            }

            # save meal plan to firebase
            try:
                add_mealplan(user_id, mealplan)
                return JsonResponse(mealplan, status=200)
            except Exception as e:
                print(f"Error while saving meal plan: {e}")
                return JsonResponse(mealplan, status=201)

            # logger.info(f"Generated meal plan: {mealplan}")
            return JsonResponse(mealplan)

        except Exception as e:
            logger.exception("An error occurred while generating the meal plan.")
            return JsonResponse({"error": f"{e}"}, status=500)
    else:
        return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def bandit_recommendation(request: HttpRequest):
    """
    Generate bandit-based meal recommendations for the specified number of days based on user opinions and constraints.
    """
    # TODO, clean directory of previous configurations
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            try:
                meal_plan_config = data["meal_plan_config"]
                num_days = meal_plan_config["num_days"]
                num_meals = meal_plan_config["num_meals"]
                meal_configs = meal_plan_config["meal_configs"]
            except:
                return JsonResponse(
                    {
                        "error": "Request body is missing meal_plan_config partially or completely."
                    },
                    status=403,
                )

            try:
                user_preferences = data["user_preferences"]
                user_id = data["user_id"]
            except:
                return JsonResponse(
                    {
                        "error": "Request body is missing user_preferences or user_id partially or completely."
                    },
                    status=403,
                )

            # Configure bandit
            try:
                bandit_trial_path, trial_num = configure_bandit(num_days)
            except:
                return JsonResponse(
                    {"error": "There was an error in configuring the bandit setup"},
                    status=500,
                )

            # Train Bandit
            success = train_bandit(bandit_trial_path)
            if not success:
                return JsonResponse(
                    {"error": "There was an error in training the boosted bandit"},
                    status=500,
                )

            # Test Bandit
            success = test_bandit(bandit_trial_path)
            if not success:
                return JsonResponse(
                    {"error": "There was an error in testing the boosted bandit"},
                    status=500,
                )

            # Generate Bandit Recommendation
            try:
                days = gen_bandit_rec(
                    trial_num, user_preferences, num_days, num_meals, meal_configs
                )
                # Construct meal plan object
                mealplan = {
                    "_id": str(ObjectId()),  # Unique ID for the meal plan
                    "user_id": user_id,  # Link to the specific user
                    "name": "Gen Meal Plan",
                    "start_date": datetime.now(),
                    "end_date": datetime.now() + timedelta(days=num_days),
                    "days": days,
                    "status": "active",
                    "tags": ["user", "generated"],  # can change tags
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                }

            except:
                return JsonResponse(
                    {"error": "There was an error in generating the meal plan"},
                    status=500,
                )

            # save meal plan to firebase
            try:
                add_mealplan(user_id, mealplan)
                return JsonResponse(mealplan, status=200)
            except Exception as e:
                print(f"Error while saving meal plan: {e}")
                return JsonResponse(mealplan, status=201)

        except:
            return JsonResponse(
                {"error": "There was an error in generating the meal plan x"},
                status=500,
            )
    return JsonResponse({"error": "Incorrect HTTP method"}, status=400)


def get_recipe_info(request: HttpRequest, recipe_id):
    if request.method == "GET":
        # Get R3 representation of the specified recipe
        r3 = get_single_r3(recipe_id)

        if isinstance(r3, Exception):
            return JsonResponse({"Error": "Error retrieving recipe"}, status=400)

        return JsonResponse(r3, status=200, safe=isinstance(r3, dict))


def get_beverage_info(request: HttpRequest, beverage_id):
    if request.method == "GET":
        bev = get_single_beverage(beverage_id)
        if isinstance(bev, Exception):
            return JsonResponse({"Error": "Error retrieving beverage"}, status=400)
        return JsonResponse(bev, status=200)


@csrf_exempt
def create_user(request: HttpRequest):
    """
    Creating a user
    """
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = str(ObjectId())
            user = {
                "_id": user_id,
                "first_name": data["first_name"],
                "last_name": data["last_name"],
                "username": "",
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
                "demographicsInfo": {
                    "ethnicity": "",
                    "height": "",
                    "weight": "",
                    "age": 0,
                    "gender": "",
                },
                "meal_plan_config": {
                    "num_days": 1,
                    "num_meals": 1,
                    "meal_configs": [
                        {
                            "meal_name": "breakfast",
                            "meal_time": "8:00am",
                            "beverage": True,
                            "main_course": True,
                            "side": True,
                            "dessert": True,
                        }
                    ],
                },
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
            }
            add_user(user_id, user)
            return JsonResponse(user, status=200)
        except:
            return JsonResponse(
                {"error": "There was an error in creating user profile"}, status=400
            )
    return JsonResponse({"Error": "Invalid Request Method"}, status=400)


@csrf_exempt
def login_user(request: HttpRequest):
    """Login user"""
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            user = get_user_by_email(
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

    return JsonResponse({"Error": "Invalid Request Method"}, status=400)


@csrf_exempt
def delete_account(request: HttpRequest, user_id: str):
    if request.method == "DELETE":
        try:
            delete_user(user_id)
            # 204 No Content for successful deletion
            return HttpResponse(status=204)
        except:
            return JsonResponse(
                {"Error": f"Couldn't delete user: {user_id}"}, status=500
            )
    return JsonResponse({"Error": "Invalid Request Method"}, status=400)


def retrieve_meal_plan(request: HttpRequest, user_id: str):
    if request.method == "GET":
        meal_plan = get_user_mealplan(user_id=user_id)
        if isinstance(meal_plan, Exception):
            return JsonResponse({"Error": str(meal_plan)}, status=500)
        return JsonResponse(meal_plan, status=200)
    return JsonResponse({"Error": "Invalid Request Method"}, status=400)
