"""Goodness Metrics for Evaluating Meal Recommendations"""

from typing import List, Dict
from .item_coverage_metric import Coverage
from .nutritional_constraint_metric import User_Constraints
from .firebase import get_r3, get_beverages

r3_items, _ = get_r3()
bev_items, _ = get_beverages()


def food_variety_score(meal: Dict):
    """Measures the variety of items in the recommendation"""
    meal = meal.copy()

    count_duplicates = lambda items: len(items) - len(set(items))

    return 1 - (count_duplicates(meal.values()) / len(meal))


def food_item_coverage_score(meal: Dict, meal_config: Dict):
    """Measures how well the recommendation captures the user's desired meal roles"""
    # import pdb
    # pdb.set_trace()
    coverage_calculator = Coverage()
    meal = meal.copy()
    meal = meal["meal_types"]

    print(meal)

    # meal_name = meal.pop("meal_name")
    # del meal["meal_time"]

    # setting desired user request for meal config in coverage
    # calculator
    desired_config = list(meal_config["meal_types"])
    coverage_calculator.set_meal_config(desired_config)

    # setting default weights
    coverage_calculator.set_new_weights([1] * len(desired_config))

    # adding food roles for each item in the meal
    food_roles = {}

    # TODO, can refactor this sector to be faster by moving food role population to the initalization
    # of coverage calculator instance
    for label_role, item_id in meal.items():
        if label_role == "beverage":
            bev_index = desired_config.index("beverage")
            roles_arr = [0] * len(desired_config)
            roles_arr[bev_index] = 1
            food_roles[f"bev_{item_id}"] = roles_arr
        else:
            roles = r3_items[item_id]["food_role"]
            roles = ["_".join(role.lower().split()) for role in roles]

            roles_arr = [0] * len(desired_config)
            for item_role in roles:
                if item_role in desired_config:
                    roles_arr[desired_config.index(item_role)] = 1
            food_roles[item_id] = roles_arr
    coverage_calculator.add_food_items(food_roles)
    # calculate coverage for recommended meal
    coverage_calculator.calc_coverage(meal)
    coverage_score = coverage_calculator.get_coverage()
    print(coverage_score)
    return coverage_score if coverage_score >= 0 else 0


def nutritional_constraint_score(meal: Dict, user_preferences: Dict[str, int]):
    """Measures how well the recommendation adheres to the user's nutritional preferences"""
    # import pdb
    # pdb.set_trace()
    constraint_calculator = User_Constraints()

    # User calibration
    curr_constraints = constraint_calculator.get_constraints().copy()
    for constraint in curr_constraints:
        constraint_calculator.remove_constraint(constraint)

    for feature, compt in user_preferences.items():
        if feature == "dairyPreference":
            constraint_calculator.add_new_constraint("hasDairy", compt)
        elif feature == "meatPreference":
            constraint_calculator.add_new_constraint("hasMeat", compt)
        elif feature == "nutsPreference":
            constraint_calculator.add_new_constraint("hasNuts", compt)
        else:
            print(
                f"This line of code should not have been reached. Given feature {feature} does not match dairyPreference, meatPreference, or nutsPreference"
            )

    meal = meal.copy()

    score, _ = constraint_calculator.calc_config(meal["meal_types"])
    print(f"Nutritional score: {score}")

    return score
