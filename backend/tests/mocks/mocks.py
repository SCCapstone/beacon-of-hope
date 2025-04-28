class MockUser:
    def get_temp_day_plans(self):
        return {"2025-04-26": "fake_temp_dayplan_id"}

    def get_day_plans(self):
        return {"2025-04-26": "fake_dayplan_id"}

    def get_dietary_conditions(self):
        return {}

    def get_favorite_items(self):
        return {
            "Main Course": ["33"],
            "Side": ["19"],
            "Dessert": ["36"],
            "Beverage": ["13"]
        }

    def has_favorite_items(self):
        return True

    def increment_bandit_counter(self):
        return ("Incremented", 200)

    def set_favorite_items(self, favorite_items):
        return ("Favorites updated", 200)

    def set_meal_plan_config(self, config):
        return ("Meal plan config updated", 200)

    def set_numerical_preferences(self, prefs):
        return ("Numerical preferences updated", 200)

    def set_dietary_conditions(self, conditions):
        return ("Dietary conditions updated", 200)

    def update_permanent_favorite_items(self, meal_items):
        return ("Updated permanent favorite items", 200)

    def get_permanent_favorite_items(self):
        return {
            "Main Course": [],
            "Side": [],
            "Dessert": [],
            "Beverage": []
        }
