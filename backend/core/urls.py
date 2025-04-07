from django.urls import path
from . import views

urlpatterns = [
    path(
        "recommendation/bandit",
        views.bandit_recommendation,
        name="bandit_recommendation",
    ),
    path(
        "recommendation/regenerate-partial",
        views.regenerate_partial_meal_plan,
        name="regenerate_partial_meal_plan",
    ),
    path(
        "recommendation/edit-meal",
        views.edit_meal_plan,
        name="edit_meal_plan",
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
    path("user/update/<str:user_id>", views.update_user, name="update_user"),
    path("user/exit-default", views.exit_default, name="exit_default"),
    path(
        "user/nutritional-goals",
        views.set_nutritional_goals,
        name="set_nutritional_goals",
    ),
    path(
        "user/nutritional-goals/<str:user_id>",
        views.get_nutritional_goals,
        name="get_nutritional_goals",
    ),
    path("user/save-meal", views.save_meal, name="save_meal"),
    path("user/delete-meal", views.delete_meal, name="delete_meal"),
]
