from django.urls import path
from . import views

urlpatterns = [
    path(
        "recommendation/random/",
        views.random_recommendation,
        name="random_recommendation",
    ),
    path(
        "recommendation/bandit/<int:num_days>/",
        views.bandit_recommendation,
        name="bandit_recommendation",
    ),
    path(
        "get-recipe-info/<str:recipe_id>", views.get_recipe_info, name="get_recipe_info"
    ),
    path(
        "get-beverage-info/<str:beverage_id>",
        views.get_beverage_info,
        name="get_beverage_info",
    ),
]
