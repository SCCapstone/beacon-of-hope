from django.urls import path
from . import views

urlpatterns = [
    path(
        "recommendation/random/<int:num_days>/",
        views.random_recommendation,
        name="random_recommendation",
    ),
    path(
        "recommendation/bandit/<int:num_days>/",
        views.bandit_recommendation,
        name="bandit_recommendation",
    ),
    path(
        "get-recipe-info/<int:item_id>", views.get_recipe_info, name="get_recipe_info"
    ),
]
