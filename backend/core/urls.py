from django.urls import path
from . import views

urlpatterns = [
    path("add-user/", views.add_user_view, name="add_user"),
    path("get-user/<str:user_id>/", views.get_user_view, name="get_user"),
]
