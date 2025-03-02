from django.urls import path
from . import views

urlpatterns = [
    path(
        "recommendation/random",
        views.random_recommendation,
        name="random_recommendation",
    ),
    path(
        "recommendation/bandit",
        views.bandit_recommendation,
        name="bandit_recommendation",
    ),
    path(
        "recommendation/retrieve-latest/<str:user_id>",
        views.retrieve_meal_plan,
        name="retrieve_meal_plan",
    ),
    path(
        "recommendation/retrieve-all/<str:user_id>",
        views.retrieve_all_meal_plans,
        name="retrieve_all_meal_plans",
    ),
    path(
        "recommendation/retrieve-days/<str:user_id>",
        views.retrieve_day_plans,
        name="retrieve_day_plans",
    ),
    path(
        "get-recipe-info/<str:recipe_id>", views.get_recipe_info, name="get_recipe_info"
    ),
    path(
        "get-beverage-info/<str:beverage_id>",
        views.get_beverage_info,
        name="get_beverage_info",
    ),
    path("user/signup", views.create_user, name="create_user"),
    path("user/login", views.login_user, name="login_user"),
    path("user/delete/<str:user_id>", views.delete_account, name="delete_account"),
]
