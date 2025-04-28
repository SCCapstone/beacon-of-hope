from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt

from ..modules.firebase import FirebaseManager

from termcolor import colored
import logging
import json
import pprint

firebaseManager = FirebaseManager()  # DB manager

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)


@csrf_exempt
def retrieve_day_plans(request: HttpRequest, user_id: str):
    if request.method != "POST":
        return JsonResponse({"Error": "Invalid Request Method"}, status=400)
    try:
        logger.info(colored("Retrieve Day Plans API called ...", "yellow"))
        logger.info(colored("Parsing Request Body ...", "yellow"))
        data = json.loads(request.body)
        if "dates" not in data:
            return JsonResponse(
                {
                    "Error": "Missing required 'dates' parameter, which is a list of date strings."
                },
                400,
            )
        dates = data["dates"]

        logger.info(
            colored(
                f"Retrieving the day plans for this user for dates: {dates}", "yellow"
            )
        )
        day_plans, status = firebaseManager.get_day_plans(user_id, dates)
        if status != 200:
            return JsonResponse(
                {"Error": f"There was an error retrieving the day plans: {day_plans}"},
                status,
            )

        logger.info(colored("Restructuring the meals in the dayplan object", "green"))

        for dayplan in day_plans.values():
            dayplan["meals"] = [meal for meal in dayplan["meals"].values()]

        return JsonResponse({"day_plans": day_plans}, status=status)

    except Exception as e:
        return JsonResponse(
            {"Error": f"There was an error retrieving the day plans: {e}"}, status=500
        )


# TODO, remove day plan from temp_day_plans after it is saved
@csrf_exempt
def save_meal(request: HttpRequest):
    """Saving a meal (Moving from temporary storage to permanent storage)"""
    if request.method != "POST":
        return JsonResponse({"Error": "Invalid Request Method"}, status=400)
    try:
        logger.info(colored("Save Meal API Endpoint Called ...", "yellow"))
        logger.info(colored("Parsing Request Body ...", "yellow"))
        data = json.loads(request.body)
        keys = ["date", "user_id", "meal_id"]
        for key in keys:
            if key not in data:
                return JsonResponse(
                    {"Error": f"Request Body missing required attribute: {key}"},
                    status=403,
                )

        date, user_id, meal_id = [data[key] for key in keys]
        nl_recommendations = data.get("nl_recommendations", [])

        user, status = firebaseManager.get_user_by_id(user_id)
        if status != 200:
            return JsonResponse(
                {
                    "Error": f"There was some error in retrieving the user from Firebase: {user}"
                },
                status=status,
            )
        logger.info(colored("Getting temporary day plan dates and ids", "yellow"))
        try:
            day_plans = user.get_temp_day_plans()
        except:
            return JsonResponse(
                {"Error": "There was an error in retrieving the user's day plans"},
                status=500,
            )

        logger.info(colored("Extracting day plan id corresponding to date", "yellow"))
        if date not in day_plans:
            return JsonResponse(
                {"Error": f"The provided date: {date} is not in the recorded plans"},
                status=403,
            )
        day_plan_id = day_plans.pop(
            date
        )  # user could have generated multiple plans for the same day

        logger.info(
            colored(
                f"Extracting temp day plan corresponding to id: {day_plan_id}", "yellow"
            )
        )
        day_plan, status = firebaseManager.get_temp_dayplan_by_id(day_plan_id)
        if status != 200:
            return JsonResponse(
                {
                    "Error": f"There was an error in retrieving hte previously stored meal plan: {day_plan}"
                },
                status=status,
            )

        logger.info(
            colored("Creating dayplan object if doesn't already exist", "yellow")
        )
        # create a day plan object in the permanent storage (if it already exists, this does nothing)
        msg, status = firebaseManager.create_dayplan_object(user_id, date, day_plan_id)
        if status != 200:
            return JsonResponse(
                {"Error": f"There was an error in creating the day plan object: {msg}"},
                status=status,
            )

        for meal in day_plan["meals"]:
            if meal["_id"] == meal_id:
                # store meal in permanent day plan
                meal["nl_recommendations"] = nl_recommendations
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
        logger.info(colored("Delete Meal API Endpoint Called ...", "yellow"))
        logger.info(colored("Parsing Request Body ...", "yellow"))
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
            colored(
                f"Getting corresponding day plan id for date {date} for user {user_id}",
                "yellow",
            )
        )
        user, status = firebaseManager.get_user_by_id(user_id)
        if status != 200:
            return JsonResponse(
                {
                    "Error": f"There was some error in retrieving the user from Firebase: {user}"
                },
                status=status,
            )

        logger.info(colored("Retrieving day plans", "yellow"))
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

        logger.info(colored(f"Removing meal from dayplan: {date}", "yellow"))
        day_plan_ids = day_plans[date]


        msg, status = firebaseManager.remove_meal_from_dayplan(meal_id, day_plan_ids)
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
    """Favoriting a meal"""
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

        date, user_id, to_favorite_meal_id = [data[key] for key in keys]

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

        logger.info(colored("Getting day plan from FB", "green"))

        day_plan_id = day_plans[date]
        day_plan, status = firebaseManager.get_dayplan_by_id(day_plan_id=day_plan_id)
        if status != 200:
            return JsonResponse(
                {
                    "Error": f"There was an error in retrieving the meal plan: {day_plan}"
                },
                status=status,
            )

        logger.info(colored("Getting the meal items from meal", "green"))
        for meal_id, meal in day_plan["meals"].items():
            if meal_id == to_favorite_meal_id:
                logger.info(
                    colored(
                        f"Favorited meal {to_favorite_meal_id} in day plan {day_plan_id}",
                        "green",
                    )
                )
                meal["favorited"] = True
                msg, status = firebaseManager.store_meal_in_dayplan(day_plan_id, meal)
                meal_items = meal["meal_types"]

        logger.info(f"Updating Permanent Items with {meal_items}...")
        msg, status = user.add_permanent_favorite_items(meal_items)
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


@csrf_exempt
def unfavorite_meal(request: HttpRequest):
    """Unfavoriting a meal"""
    if request.method != "POST":
        return JsonResponse({"Error": "Invalid Request Method"}, status=400)
    try:
        logger.info("Unfavorite Meal API Endpoint Called ...")
        logger.info("Parsing Request Body ...")
        data = json.loads(request.body)

        keys = ["date", "user_id", "meal_id"]
        for key in keys:
            if key not in data:
                return JsonResponse(
                    {"Error": f"Request Body missing required attribute: {key}"},
                    status=403,
                )

        date, user_id, to_favorite_meal_id = [data[key] for key in keys]

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

        logger.info(colored("Getting day plan from FB", "green"))

        day_plan_id = day_plans[date]
        day_plan, status = firebaseManager.get_dayplan_by_id(day_plan_id=day_plan_id)
        if status != 200:
            return JsonResponse(
                {
                    "Error": f"There was an error in retrieving the meal plan: {day_plan}"
                },
                status=status,
            )

        logger.info(colored("Getting the meal items from meal", "green"))
        for meal_id, meal in day_plan["meals"].items():
            if meal_id == to_favorite_meal_id:
                logger.info(
                    colored(
                        f"Unavorited meal {to_favorite_meal_id} in day plan {day_plan_id}",
                        "red",
                    )
                )
                meal["favorited"] = False
                msg, status = firebaseManager.store_meal_in_dayplan(day_plan_id, meal)
                meal_items = meal["meal_types"]

        logger.info(f"Updating Permanent Items with {meal_items}...")
        msg, status = user.remove_permanent_favorite_items(meal_items)
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
