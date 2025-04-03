from typing import Dict, List


class User:
    def __init__(self, user: Dict):
        for key, value in user.items():
            setattr(self, key, value)

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

    def get_allergies(self) -> List[str]:
        return self.health_info["allergies"]

    def get_conditions(self) -> List[str]:
        return self.health_info["conditions"]

    def get_demographic_info(self) -> Dict:
        return self.demographicsInfo

    def get_meal_plan_config(self) -> Dict:
        return self.meal_plan_config

    def get_account_creation_date(self):
        return self.created_at

    def get_account_update_date(self):
        return self.updated_at

    def get_day_plans(self) -> Dict[str, str]:
        return self.day_plans

    def get_bandit_counter(self) -> int:
        return self.bandit_counter

    def get_favorite_main_courses(self) -> List[str]:
        return self.favorite_items["Main Course"]

    def get_favorite_sides(self) -> List[str]:
        return self.favorite_items["Side"]

    def get_favorite_desserts(self) -> List[str]:
        return self.favorite_items["Dessert"]

    def get_favorite_bevs(self) -> List[str]:
        return self.favorite_items["Beverage"]

    def __repr__(self):
        return f"User({self.__dict__})"
