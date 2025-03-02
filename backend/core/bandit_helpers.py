import random
import json
import os
import re
from .firebase import get_r3, get_beverages
import shutil
import subprocess
from bson import ObjectId
from django.conf import settings
from datetime import datetime, timedelta

from typing import Dict, List

# TODO, play around with number of trees in bandit and assess quality of recommendation

food_items, _ = get_r3()
beverages, _ = get_beverages()


def get_highest_prob_foods(items_probs, num_users):
    """Group together the highest probability food items in each role (dessert, main course, etc.).

    Positional arguments:
    items_probs --
    num_users   -- The number of users that for which we are grouping together food items
    """

    user_items = {
        i: {"Main Course": [], "Side": [], "Dessert": []}
        for i in range(1, num_users + 1)
    }

    for user, item, prob in items_probs:
        # get item roles
        item_roles = food_items[item]["food_role"]
        for role in item_roles:
            if role == "Beverage":
                continue
            user_items[int(user)][role].append((item, float(prob)))

    rec_user_items = {
        i: {"Main Course": [], "Side": [], "Dessert": []}
        for i in range(1, num_users + 1)
    }

    for user, role_dict in user_items.items():
        for role, role_items in role_dict.items():
            highest_prob = 0
            for item, prob in role_items:
                if prob > highest_prob:
                    highest_prob = prob
            highest_items = [item for item, prob in role_items if prob == highest_prob]
            rec_user_items[user][role] = highest_items

    for user, role_dict in rec_user_items.items():
        empty = []
        non_empty = []
        for key, val in role_dict.items():
            if len(val) == 0:
                empty.append(key)
            else:
                non_empty.append(key)

        for empty_role in empty:
            role_dict[empty_role] = random.choice(
                [rec_user_items[user][non_empty_role] for non_empty_role in non_empty]
            )

    return rec_user_items


def get_highest_prob_bevs(items_probs, num_users):
    user_items = {i: [] for i in range(1, num_users + 1)}

    for user, item, prob in items_probs:
        user_items[int(user)].append((item, float(prob)))

    rec_user_items = {i: [] for i in range(1, num_users + 1)}

    for user, items in user_items.items():
        highest_prob = 0
        for item, prob in items:
            if prob > highest_prob:
                highest_prob = prob
        highest_items = [item for item, prob in items if prob == highest_prob]
        rec_user_items[user] = highest_items

    return rec_user_items


def exhaustive_partition():
    """
    Generate all combinations of user preferences for dairy, meat, and nuts.
    Returns:
        Tuple of lists: (dairy_opinions, meat_opinions, nut_opinions)
    """
    # Opinion configurations (1 = positive, -1 = negative, 0 = neutral)
    dairy_opinions = [0] * 9 + [1] * 9 + [-1] * 9
    meat_opinions = [0, 0, 0, 1, 1, 1, -1, -1, -1] * 3
    nut_opinions = [0, 1, -1] * 9

    user_dairy_opinions = (
        [i + 1 for i, el in enumerate(dairy_opinions) if el == 1],
        [i + 1 for i, el in enumerate(dairy_opinions) if el == -1],
        [i + 1 for i, el in enumerate(dairy_opinions) if el == 0],
    )

    user_meat_opinions = (
        [i + 1 for i, el in enumerate(meat_opinions) if el == 1],
        [i + 1 for i, el in enumerate(meat_opinions) if el == -1],
        [i + 1 for i, el in enumerate(meat_opinions) if el == 0],
    )

    user_nut_opinions = (
        [i + 1 for i, el in enumerate(nut_opinions) if el == 1],
        [i + 1 for i, el in enumerate(nut_opinions) if el == -1],
        [i + 1 for i, el in enumerate(nut_opinions) if el == 0],
    )

    return user_dairy_opinions, user_meat_opinions, user_nut_opinions


def gen_facts(dairy_opinions, meat_opinions, nut_opinions):
    """
    Generate user preference facts and food attribute facts.
    Args:
        dairy_opinions (list): List of user dairy opinions.
        meat_opinions (list): List of user meat opinions.
        nut_opinions (list): List of user nut opinions.
    Returns:
        Tuple of lists: (user_facts, food_facts)
    """
    user_facts = []
    food_facts = []

    # Generate user preference facts
    for feature_name, opinions in [
        ("dairy", dairy_opinions),
        ("meat", meat_opinions),
        ("nuts", nut_opinions),
    ]:
        positive = [i for i, op in enumerate(opinions, 1) if op == 1]
        negative = [i for i, op in enumerate(opinions, 1) if op == -1]
        for user in positive:
            user_facts.append(f"preference(user_{user}, positive_{feature_name}).")
        for user in negative:
            user_facts.append(f"preference(user_{user}, negative_{feature_name}).")

    # Generate food attribute facts
    all_data = [beverages, food_items]

    for data, prefix in zip(all_data, ["bev", "food"]):
        for key, item_info in data.items():
            if item_info.get("hasNuts"):
                food_facts.append(f"item({prefix}_{key}, has_nuts).")
            if item_info.get("hasMeat"):
                food_facts.append(f"item({prefix}_{key}, has_meat).")
            if item_info.get("hasDairy"):
                food_facts.append(f"item({prefix}_{key}, has_dairy).")

    return user_facts, food_facts


def gen_pairs(users, dairy_opinions, meat_opinions, nut_opinions):
    """
    Generate positive and negative recommendation pairs.
    Args:
        users (list): List of user IDs.
        dairy_opinions (list): Dairy opinions.
        meat_opinions (list): Meat opinions.
        nut_opinions (list): Nut opinions.
    Returns:
        Tuple of lists: (pos_pairs, neg_pairs)
    """
    pos_pairs = []
    neg_pairs = []

    _, neg_dairy, _ = dairy_opinions
    _, neg_meat, _ = meat_opinions
    _, neg_nuts, _ = nut_opinions

    for user in users:
        for data, is_bev in ((beverages, True), (food_items, False)):
            for key, item_info in data.items():
                if (
                    (
                        "hasNuts" in item_info
                        and item_info["hasNuts"]
                        and user in neg_nuts
                    )
                    or (
                        "hasDairy" in item_info
                        and item_info["hasDairy"]
                        and user in neg_dairy
                    )
                    or (
                        "hasDairy" in item_info
                        and item_info["hasMeat"]
                        and user in neg_meat
                    )
                ):
                    if is_bev:
                        neg_pairs.append(f"recommendation(user_{user},bev_{key}).")
                    else:
                        neg_pairs.append(f"recommendation(user_{user},food_{key}).")
                else:
                    if is_bev:
                        pos_pairs.append(f"recommendation(user_{user},bev_{key}).")
                    else:
                        pos_pairs.append(f"recommendation(user_{user},food_{key}).")

    return pos_pairs, neg_pairs


def split_train_test(array, per_train=0.8):
    """
    Split a list into training and testing datasets.
    Args:
        array (list): List of data to split.
        per_train (float): Proportion of data to use for training.
    Returns:
        Tuple of lists: (train_data, test_data)
    """
    random.shuffle(array)
    split_index = int(len(array) * per_train)
    return array[:split_index], array[split_index:]


def save_facts_pairs(train_facts, train_neg, train_pos, test_facts, test_neg, test_pos):
    """
    Save training and testing facts and pairs into a directory structure for bandit training.
    Args:
        train_facts (list): Training facts.
        train_neg (list): Negative training pairs.
        train_pos (list): Positive training pairs.
        test_facts (list): Testing facts.
        test_neg (list): Negative testing pairs.
        test_pos (list): Positive testing pairs.
    Returns:
        Tuple: (bandit_trial_path, trial_number)
    """
    trials = os.listdir("boosted_bandit")
    pattern = r"trial(\d+)"
    numbers = [int(re.search(pattern, trial).group(1)) for trial in trials]

    file_num = max(numbers) + 1 if numbers else 0

    src_dir = "boosted_bandit/trial0"
    dest_dir = f"boosted_bandit/trial{file_num}"

    if os.path.exists(dest_dir):
        shutil.rmtree(dest_dir)

    # Recursively copy the source directory to the destination directory
    shutil.copytree(src_dir, dest_dir)

    for contents, file_name in [
        (train_facts, "train_facts.txt"),
        (train_neg, "train_neg.txt"),
        (train_pos, "train_pos.txt"),
    ]:
        with open(f"{dest_dir}/train/{file_name}", "w") as file:
            file.writelines(f"{line}\n" for line in contents)

    for contents, file_name in [
        (test_facts, "test_facts.txt"),
        (test_neg, "test_neg.txt"),
        (test_pos, "test_pos.txt"),
    ]:
        with open(f"{dest_dir}/test/{file_name}", "w") as file:
            file.writelines(f"{line}\n" for line in contents)

    return dest_dir, file_num


def save_users(users, dairy_opinions, meat_opinions, nut_opinions, trial_num, num_days):
    """
    Save user data into a JSON format for bandit recommendation.
    Args:
        users (list): List of user IDs.
        dairy_opinions (list): Dairy opinions.
        meat_opinions (list): Meat opinions.
        nut_opinions (list): Nut opinions.
        trial_num (int): Trial number.
        num_days (int): Number of days.
    """
    pos_dairy, neg_dairy, _ = dairy_opinions
    pos_meat, neg_meat, _ = meat_opinions
    pos_nuts, neg_nuts, _ = nut_opinions

    src_dir = "user_input_data"
    dest_dir = f"user_input_data/trial{trial_num}"

    if os.path.exists(dest_dir):
        shutil.rmtree(dest_dir)

    # Recursively copy the source directory to the destination directory
    shutil.copytree(src_dir, dest_dir)

    for user in users:
        template_user_path = os.path.join(settings.BASE_DIR, src_dir, "user_0.json")
        with open(template_user_path, "r") as read_file:
            sample_user = json.load(read_file)

            if user in pos_dairy:
                sample_user["user_compatibilities"]["dairyPreference"] = 1
            elif user in neg_dairy:
                sample_user["user_compatibilities"]["dairyPreference"] = -1

            if user in pos_meat:
                sample_user["user_compatibilities"]["meatPreference"] = 1
            elif user in neg_meat:
                sample_user["user_compatibilities"]["meatPreference"] = -1

            if user in pos_nuts:
                sample_user["user_compatibilities"]["nutsPreference"] = 1
            elif user in neg_nuts:
                sample_user["user_compatibilities"]["nutsPreference"] = -1

            sample_user["time_period"] = num_days

        with open(f"{dest_dir}/user_{user}.json", "w") as write_file:
            json.dump(sample_user, write_file, indent=2)


def clean_dir():
    bandit_dir = os.path.join(settings.BASE_DIR, "boosted_bandit")
    users_dir = os.path.join(settings.BASE_DIR, "user_input_data")
    boosted_bandit_dirs = [
        path
        for path in [os.path.join(bandit_dir, dir) for dir in os.listdir(bandit_dir)]
        if (os.path.isdir(path) and "trial0" not in path)
    ]
    user_input_dirs = [
        path
        for path in [os.path.join(users_dir, dir) for dir in os.listdir(users_dir)]
        if (os.path.isdir(path) and "trial0" not in path)
    ]
    to_remove = boosted_bandit_dirs + user_input_dirs

    for dir in to_remove:
        if os.path.exists(dir):
            shutil.rmtree(dir)


def configure_bandit(num_days: int):
    # clean previous directories of bandit training sessions
    clean_dir()

    # Load users
    potential_users = list(range(1, 28))  # Assuming 27 users

    # Load all possible user opinions on dairy meat and nuts
    dairy_opinions, meat_opinions, nut_opinions = exhaustive_partition()

    # generate facts about users (whether they prefer ingredients or not)
    # and facts about food items (whether they contain specified ingredients)
    user_facts, food_facts = gen_facts(dairy_opinions, meat_opinions, nut_opinions)

    # generate positive and negative recommendation pairs of items to users
    pos_pairs, neg_pairs = gen_pairs(
        potential_users, dairy_opinions, meat_opinions, nut_opinions
    )

    # Split into training and testing data
    user_train, user_test = split_train_test(user_facts)
    food_train, food_test = split_train_test(food_facts)
    train_pos, test_pos = split_train_test(pos_pairs)
    train_neg, test_neg = split_train_test(neg_pairs)

    # combine training and testing sets
    train_facts = user_train + food_train
    test_facts = user_test + food_test

    # saving facts
    bandit_trial_path, trial_num = save_facts_pairs(
        train_facts, train_neg, train_pos, test_facts, test_neg, test_pos
    )

    # save each user's preferences in a JSON file for future bandit recommendation
    save_users(
        potential_users,
        dairy_opinions,
        meat_opinions,
        nut_opinions,
        trial_num,
        num_days,
    )

    # Logging info
    with open(f"{bandit_trial_path}/config.json", "w") as file:
        config_dict = {"num_users": 27, "num_pos": 9, "num_neg": 9}
        json.dump(config_dict, file, indent=2)

    return bandit_trial_path, trial_num


def train_bandit(bandit_trial_path):
    """Train boosted bandit on given facts about food items and user preferences and positive and negative recommendations (80% of original dataset)"""

    # command line arguments
    train_command = [
        "java",
        "-jar",
        "boostsrl.jar",
        "-l",
        "-combine",
        "-train",
        "train/",
        "-target",
        "recommendation",
        "-trees",
        "20",
    ]

    # train the bandit as a java subprocess
    train_result = subprocess.run(
        train_command, cwd=bandit_trial_path, capture_output=True, text=True
    )

    # Check the result
    if not train_result.returncode:
        print(
            f"Bandit in {bandit_trial_path} trained successfully. Ouput written in {bandit_trial_path}/out_train.txt"
        )
        with open(f"{bandit_trial_path}/out_train.txt", "w") as log_file:
            log_file.write(train_result.stdout)
        return True
    else:
        print("Error in training bandit:", train_result.stderr)
        return False


def test_bandit(bandit_trial_path):
    """Test trained bandit on test set (20% of original dataset)"""

    # command line arguments for training bandit
    test_command = [
        "java",
        "-jar",
        "boostsrl.jar",
        "-i",
        "-model",
        "train/models/",
        "-test",
        "test/",
        "-target",
        "recommendation",
        "-aucJarPath",
        ".",
        "-trees",
        "20",
    ]

    # test the bandit as a java subprocess
    test_result = subprocess.run(
        test_command, cwd=bandit_trial_path, capture_output=True, text=True
    )
    # Check the result
    if not test_result.returncode:
        print(
            f"Bandit in {bandit_trial_path} tested successfully. Ouput written in {bandit_trial_path}/out_test.txt"
        )
        with open(f"{bandit_trial_path}/out_test.txt", "w") as log_file:
            log_file.write(test_result.stdout)
        return True
    else:
        print("Error in testing bandit:", test_result.stderr)
        return False


def gen_bandit_rec(
    trial_num: int,
    user_preferences: Dict[str, int],
    num_days: int,
    meal_configs: List[Dict],
    starting_date: datetime,
) -> Dict:
    """Take Bandit Output and generate a meal plan

    Positional arguments:
    trial_num        -- Number of the bandit training session
    user_preferences -- Dictionary of the form {'dairyPreference': 1, 'meatPreference': 0, 'nutsPreference': -1}.
                        Contains ternary preference (-1(dislike); 0(neutral); 1(like)) for dairy meat and nuts
    num_days         -- Length of the meal plan in days
    meal_configs     -- List of configuration objects that contain the structure of each user requested meal
    starting_date    -- Starting date of the meal plan

    Returns:
    days             -- A dictionary of meal plans, consisting of a sequence of meals for each day
    """
    # Read bandit's evaluation on test set, and consider those items for recommendation
    with open(
        f"boosted_bandit/trial{trial_num}/test/results_recommendation.db", "r"
    ) as rec_file:
        recs = rec_file.readlines()

    # pool positive and negative recommendations to introduce variety in recommended meals
    pos_recs = [rec for rec in recs if not rec.startswith("!")]
    neg_recs = [rec[1:] for rec in recs if rec.startswith("!")]
    all_recs = pos_recs + neg_recs
    bev_recs = [rec for rec in all_recs if "bev" in rec]
    food_recs = [rec for rec in all_recs if "food" in rec]

    # find the probability of each recommendation being successful
    pattern = r"\d+\.?\d*"
    food_items_and_probs = [tuple(re.findall(pattern, rec)) for rec in food_recs]
    bev_items_and_probs = [tuple(re.findall(pattern, rec)) for rec in bev_recs]

    rec_user_bevs = get_highest_prob_bevs(bev_items_and_probs, 27)

    rec_user_foods = get_highest_prob_foods(food_items_and_probs, 27)

    all_users_opinions = [
        [0, 0, 0],
        [0, 0, 1],
        [0, 0, -1],
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, -1],
        [0, -1, 0],
        [0, -1, 1],
        [0, -1, -1],
        [1, 0, 0],
        [1, 0, 1],
        [1, 0, -1],
        [1, 1, 0],
        [1, 1, 1],
        [1, 1, -1],
        [1, -1, 0],
        [1, -1, 1],
        [1, -1, -1],
        [-1, 0, 0],
        [-1, 0, 1],
        [-1, 0, -1],
        [-1, 1, 0],
        [-1, 1, 1],
        [-1, 1, -1],
        [-1, -1, 0],
        [-1, -1, 1],
        [-1, -1, -1],
    ]

    # get dairy, meat, and nut opinions for the particular user
    print(user_preferences)
    user_opinions = list(user_preferences.values())
    user = all_users_opinions.index(user_opinions)

    # get corresponding bandit recommended foods and bevs for the user
    bevs = rec_user_bevs[user + 1]
    foods = rec_user_foods[user + 1]

    # create a skeleton structure of meals that will be recommended throughout a single day
    meal_list = []

    # iterate over each meal config and populate day meal list
    # for item roles (main course, side dish, etc.) create a key-val pair
    # if the user expects that role to be in the meal
    for meal_config in meal_configs:
        meal_components = {}
        for item_role, is_present in meal_config["meal_types"].items():
            if not is_present:
                continue
            meal_components[item_role] = ""

        meal = {
            "_id": str(ObjectId()),  # Unique ID for the meal
            "meal_name": meal_config["meal_name"],
            "meal_time": meal_config.get("meal_time", ""),
            "meal_types": meal_components,
        }
        meal_list.append(meal)

    # create a skeleton structure for the number of days that the user wants the meal plan
    days = {
        (starting_date + timedelta(days=day_index)).strftime("%Y-%m-%d"): {
            "_id": str(ObjectId()),
            "meals": meal_list.copy(),
        }
        for day_index in range(num_days)
    }

    # popoulate each day recommendation for the user
    for day_rec in days.values():
        # iterate over meals
        for meal in day_rec["meals"]:
            # populate each meal component
            meal = meal["meal_types"]
            if "beverage" in meal:
                try:
                    meal["beverage"] = beverages[random.choice(bevs)]["bev-id"]
                except:
                    bev_num = random.choice(list(beverages.keys()))
                    meal["beverage"] = beverages[bev_num]

            if "main_course" in meal:
                meal["main_course"] = food_items[random.choice(foods["Main Course"])][
                    "recipe-id"
                ]

            if "side" in meal:
                meal["side"] = food_items[random.choice(foods["Side"])]["recipe-id"]

            if "dessert" in meal:
                meal["dessert"] = food_items[random.choice(foods["Dessert"])][
                    "recipe-id"
                ]

    return days
