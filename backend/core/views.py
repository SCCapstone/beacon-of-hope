from django.shortcuts import render
from .firebase import add_document, get_document
from django.http import JsonResponse, HttpResponse


def get_user_view(request, user_id):
    user_data = get_document("users", user_id)
    return JsonResponse(user_data, safe=False)


def add_user_view(request):
    user_data = {"name": "John Doe", "email": "johndoe@example.com", "age": 30}
    result = add_document("users", "user_johndoe", user_data)
    return HttpResponse(result)
