from django.http import JsonResponse, HttpRequest


from ..modules.firebase import FirebaseManager


import logging


firebaseManager = FirebaseManager()  # DB manager

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)


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
