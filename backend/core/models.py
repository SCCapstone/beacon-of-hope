from django.db import models


class UserPreference(models.Model):
    dairy_preference = models.IntegerField(default=0)  # -1, 0, 1
    meat_preference = models.IntegerField(default=0)  # -1, 0, 1
    nuts_preference = models.IntegerField(default=0)  # -1, 0, 1


class MenuItem(models.Model):
    name = models.CharField(max_length=200)
    has_dairy = models.BooleanField(default=False)
    has_meat = models.BooleanField(default=False)
    has_nuts = models.BooleanField(default=False)
    food_role = models.CharField(max_length=50)  # Main Course, Side, Dessert, Beverage
    item_type = models.CharField(max_length=50)  # beverage, mcdonalds, taco_bell, treat
