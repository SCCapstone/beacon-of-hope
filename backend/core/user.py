from typing import Dict, List, Tuple


class User:
    def __init__(self, user: Dict):
        for key, value in user.items():
            setattr(self, key, value)
        from .firebase import FirebaseManager

        self.firebaseManager = FirebaseManager()

    def get_id(self) -> str:
        return self._id

    def get_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def get_first_name(self) -> str:
        return self.first_name

    def get_last_name(self) -> str:
        return self.last_name

    def get_email(self) -> str:
        return self.email

    def get_plan_ids(self) -> List[str]:
        return self.plan_ids

    def get_preferences(self) -> List[str]:
        """Returns [vegan, kosher, ...]"""
        return self.dietary_preferences["preferences"]

    def get_numerical_preferences(self) -> Dict[str, int]:
        """Returns {dairyPreference:0, ...}"""
        return self.dietary_preferences["numerical_preferences"]

    def set_numerical_preferences(self, numerical_preferences) -> Tuple[str, str]:
        return self.firebaseManager.update_user_attr(
            self.get_id(),
            "dietary_preferences.numerical_preferences",
            numerical_preferences,
        )

    def get_allergies(self) -> List[str]:
        return self.health_info["allergies"]

    def get_conditions(self) -> List[str]:
        return self.health_info["conditions"]

    def get_demographic_info(self) -> Dict:
        return self.demographicsInfo

    def get_meal_plan_config(self) -> Dict:
        return self.meal_plan_config

    def set_meal_plan_config(self, meal_plan_config: Dict) -> Dict:
        return self.firebaseManager.update_user_attr(
            self.get_id(), "meal_plan_config", meal_plan_config
        )

    def get_account_creation_date(self):
        return self.created_at

    def get_account_update_date(self):
        return self.updated_at

    def get_temp_day_plans(self) -> Dict[str, str]:
        return self.temp_day_plans

    def get_day_plans(self) -> Dict[str, str]:
        return self.day_plans

    def get_bandit_counter(self) -> int:
        return self.bandit_counter

    def increment_bandit_counter(self) -> Tuple[str, int]:
        return self.firebaseManager.update_user_attr(
            self.get_id(), "bandit_counter", self.get_bandit_counter() + 1
        )

    def has_favorite_items(self) -> bool:
        """Checks if the user has favorite items from bandit training"""
        return (
            self.get_favorite_main_courses()
            and self.get_favorite_sides()
            and self.get_favorite_desserts()
            and self.get_favorite_bevs()
        )

    def get_favorite_items(self) -> Dict[str, List[str]]:
        return self.favorite_items

    def get_permanent_favorite_items(self) -> Dict[str, List[str]]:
        if hasattr(self, "permanent_favorite_items"):
            return self.permanent_favorite_items
        return None

    def set_favorite_items(self, favorite_items: Dict[str, List[str]]):
        return self.firebaseManager.update_user_attr(
            self.get_id(), "favorite_items", favorite_items
        )

    def get_favorite_main_courses(self) -> List[str]:
        return self.favorite_items["Main Course"]

    def get_favorite_sides(self) -> List[str]:
        return self.favorite_items["Side"]

    def get_favorite_desserts(self) -> List[str]:
        return self.favorite_items["Dessert"]

    def get_favorite_bevs(self) -> List[str]:
        return self.favorite_items["Beverage"]

    def update_permanent_favorite_items(self, meal_items: Dict[str, int]):
        meal_items = {
            "Main Course": meal_items.get("main_course", None),
            "Side": meal_items.get("side", None),
            "Dessert": meal_items.get("dessert", None),
            "Beverage": meal_items.get("beverage", None),
        }

        meal_items = {key: val for key, val in meal_items.items() if val}
        return self.firebaseManager.add_favorite_items(self.get_id(), meal_items)

    def get_nutritional_goals(self) -> Dict[str, int]:
        if self.nutritional_goals:
            return self.nutritional_goals
        return {"calories": 0, "carbs": 0, "protein": 0, "fiber": 0}

    def __repr__(self):
        return f"User({self.__dict__})"

    def to_dict(self):
        return self.__dict__
