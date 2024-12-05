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
    path("user/signup", views.create_user, name="create_user"),
    path("user/login", views.login_user, name="login_user"),
    path("user/delete/<str:user_id>", views.delete_account, name="delete_account"),
]
