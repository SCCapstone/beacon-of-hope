from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt

from ..modules.firebase import FirebaseManager

from termcolor import colored
import logging
import json

firebaseManager = FirebaseManager()  # DB manager

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)


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


@csrf_exempt
def save_meal(request: HttpRequest):
    """Saving a meal (Moving from temporary storage to permanent storage)"""
    if request.method != "POST":
        return JsonResponse({"Error": "Invalid Request Method"}, status=400)
    try:
        logger.info("Save Meal API Endpoint Called ...")
        logger.info("Parsing Request Body ...")
        data = json.loads(request.body)

        keys = ["date", "user_id", "meal_id", "nl_recommendations"]
        for key in keys:
            if key not in data:
                return JsonResponse(
                    {"Error": f"Request Body missing required attribute: {key}"},
                    status=403,
                )

        date, user_id, meal_id, nl_recommendations = [data[key] for key in keys]
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
        for meal in day_plan["meals"]:
            if meal["_id"] == meal_id:
                meal["favorited"] = True

                # TODO, change meals to be stored in dayplan object as a dictionary not as a list
                # as a result, change all areas where meals are iterated over
                # therefore, we don't append meals again, we can just alter based on id

                # msg, status = firebaseManager.store_meal_in_dayplan(day_plan_id, meal)
                meal_items = meal["meal_types"]

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
