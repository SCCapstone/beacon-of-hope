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

import time

from .recommendation_helpers import (
    configure_bandit,
    train_bandit,
    test_bandit,
    gen_bandit_rec,
    calculate_goodness,
)
from .firebase import (
    get_beverages,
    get_r3,
    get_single_r3,
    get_single_beverage,
    get_user_by_email,
    add_user,
    delete_user,
    get_latest_user_meal_plan,
    get_all_user_meal_plans,
    get_day_plans,
    add_meal_plan,
    add_dayplan,
)

logger = logging.getLogger(__name__)  # neccesary to generate meal plan


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
        food_items, _ = get_r3()
        beverages, _ = get_beverages()

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
                    "meal_time": meal_config.get("meal_time", ""),
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

                msg, status = add_dayplan(user_id, date, day_plan)
                if status != 200:
                    print(msg)

            msg, status = add_meal_plan(user_id, meal_plan)
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

        # Configure bandit
        start = time.time()
        try:
            bandit_trial_path, trial_num = configure_bandit(num_days)
        except:
            return JsonResponse(
                {"error": "There was an error in configuring the bandit setup"},
                status=500,
            )
        end = time.time()
        execution_time = end - start
        print(f"Configuring bandit: {execution_time:.4f} seconds")

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
        print(f"Training bandit: {execution_time:.4f} seconds")

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
        print(f"Testing bandit: {execution_time:.4f} seconds")

        # Generate Bandit Recommendation
        start = time.time()
        try:
            days = gen_bandit_rec(
                trial_num,
                user_preferences,
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
            return JsonResponse(
                {"error": "There was an error in generating the meal plan"},
                status=500,
            )
        end = time.time()
        execution_time = end - start
        print(f"Generating Rec: {execution_time:.4f} seconds")

        # import pdb
        # pdb.set_trace()
        start = time.time()
        scores = calculate_goodness(meal_plan, meal_configs, user_preferences)
        meal_plan["scores"] = scores
        end = time.time()
        execution_time = end - start
        print(f"Evaluating Rec: {execution_time:.4f} seconds")

        try:
            # save day plans to firebase
            for date, day_plan in meal_plan["days"].items():
                day_plan["user_id"] = user_id
                day_plan["meal_plan_id"] = meal_plan["_id"]
                msg, status = add_dayplan(user_id, date, day_plan)
                if status != 200:
                    print(msg)

            # save meal plan to firebase
            add_meal_plan(user_id, meal_plan)

            return JsonResponse(meal_plan, status=200)
        except Exception as e:
            print(f"Error while saving meal plan: {e}")
            return JsonResponse(meal_plan, status=201)
    except:
        return JsonResponse(
            {"error": "There was an error in generating the meal plan x"},
            status=500,
        )


def get_recipe_info(request: HttpRequest, recipe_id):
    if request.method != "GET":
        return JsonResponse({"error": "Incorrect HTTP method"}, status=400)
    # Get R3 representation of the specified recipe
    r3, _ = get_single_r3(recipe_id)

    if isinstance(r3, Exception):
        return JsonResponse({"Error": "Error retrieving recipe"}, status=400)

    return JsonResponse(r3, status=200, safe=isinstance(r3, dict))


def get_beverage_info(request: HttpRequest, beverage_id):
    if request.method != "GET":
        return JsonResponse({"error": "Incorrect HTTP method"}, status=400)
    bev, _ = get_single_beverage(beverage_id)
    if isinstance(bev, Exception):
        return JsonResponse({"Error": "Error retrieving beverage"}, status=400)
    return JsonResponse(bev, status=200)


@csrf_exempt
def create_user(request: HttpRequest):
    """
    Creating a user
    """
    if request.method != "POST":
        return JsonResponse({"Error": "Invalid Request Method"}, status=400)
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


@csrf_exempt
def login_user(request: HttpRequest):
    """Login user"""
    if request.method != "POST":
        return JsonResponse({"Error": "Invalid Request Method"}, status=400)
    try:
        data = json.loads(request.body)
        user, _ = get_user_by_email(user_email=data["email"], password=data["password"])
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
def delete_account(request: HttpRequest, user_id: str):
    if request.method != "DELETE":
        return JsonResponse({"Error": "Invalid Request Method"}, status=400)
    try:
        delete_user(user_id)
        # 204 No Content for successful deletion
        return HttpResponse(status=204)
    except:
        return JsonResponse({"Error": f"Couldn't delete user: {user_id}"}, status=500)


def retrieve_meal_plan(request: HttpRequest, user_id: str):
    if request.method != "GET":
        return JsonResponse({"Error": "Invalid Request Method"}, status=400)
    meal_plan, _ = get_latest_user_meal_plan(user_id=user_id)
    if isinstance(meal_plan, Exception):
        return JsonResponse({"Error": str(meal_plan)}, status=500)
    return JsonResponse(meal_plan, status=200)


def retrieve_all_meal_plans(request: HttpRequest, user_id: str):
    if request.method != "GET":
        return JsonResponse({"Error": "Invalid Request Method"}, status=400)

    meal_plans, _ = get_all_user_meal_plans(user_id=user_id)
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
        day_plans, status = get_day_plans(user_id, dates)
        print(status)
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
