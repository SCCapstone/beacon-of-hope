import random
import json
import os
import re
from firebase import load_r3

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

    return dairy_opinions, meat_opinions, nut_opinions


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
    for feature_name, opinions in [('dairy', dairy_opinions), ('meat', meat_opinions), ('nuts', nut_opinions)]:
        positive = [i + 1 for i, op in enumerate(opinions) if op == 1]
        negative = [i + 1 for i, op in enumerate(opinions) if op == -1]
        for user in positive:
            user_facts.append(f"preference(user_{user}, positive_{feature_name}).")
        for user in negative:
            user_facts.append(f"preference(user_{user}, negative_{feature_name}).")

    # Generate food attribute facts
    beverages, mcdonalds, taco_bell, treat_data = load_r3()
    all_data = [beverages, mcdonalds, taco_bell, treat_data]

    for data, prefix in zip(all_data, ['bev', 'food', 'food', 'food']):
        for key, item_info in data.items():
            if item_info.get('hasNuts'):
                food_facts.append(f"item({prefix}_{key}, has_nuts).")
            if item_info.get('hasMeat'):
                food_facts.append(f"item({prefix}_{key}, has_meat).")
            if item_info.get('hasDairy'):
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

    beverages, mcdonalds, taco_bell, treat_data = load_r3()
    all_foods = mcdonalds | taco_bell | treat_data

    for user in users:
        for food_key, food_item in all_foods.items():
            if ((food_item.get('hasNuts') and nut_opinions[user - 1] == -1) or
                (food_item.get('hasMeat') and meat_opinions[user - 1] == -1) or
                (food_item.get('hasDairy') and dairy_opinions[user - 1] == -1)):
                neg_pairs.append(f"recommendation(user_{user}, food_{food_key}).")
            else:
                pos_pairs.append(f"recommendation(user_{user}, food_{food_key}).")

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
    trials = os.listdir('boosted_bandit')
    pattern = r'trial(\d+)'
    numbers = [int(re.search(pattern, trial).group(1)) for trial in trials]

    file_num = max(numbers) + 1 if numbers else 0

    src_dir = 'boosted_bandit/trial0'
    dest_dir = f'boosted_bandit/trial{file_num}'

    if os.path.exists(dest_dir):
        shutil.rmtree(dest_dir)

    # Recursively copy the source directory to the destination directory
    shutil.copytree(src_dir, dest_dir)

    for contents, file_name in [(train_facts, 'train_facts.txt'),
                                (train_neg, 'train_neg.txt'),
                                (train_pos, 'train_pos.txt')]:
        with open(f'{dest_dir}/train/{file_name}', 'w') as file:
            file.writelines(f"{line}\n" for line in contents)

    for contents, file_name in [(test_facts, 'test_facts.txt'),
                                (test_neg, 'test_neg.txt'),
                                (test_pos, 'test_pos.txt')]:
        with open(f'{dest_dir}/test/{file_name}', 'w') as file:
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

    src_dir = 'user_input_data/trial0'
    dest_dir = f'user_input_data/trial{trial_num}'

    if os.path.exists(dest_dir):
        shutil.rmtree(dest_dir)

    # Recursively copy the source directory to the destination directory
    shutil.copytree(src_dir, dest_dir)

    for user in users:
        with open(f'{src_dir}/user_0.json', 'r') as read_file:
            sample_user = json.load(read_file)

            if user in pos_dairy:
                sample_user["user_compatibilities"]['dairyPreference'] = 1
            elif user in neg_dairy:
                sample_user["user_compatibilities"]['dairyPreference'] = -1

            if user in pos_meat:
                sample_user["user_compatibilities"]['meatPreference'] = 1
            elif user in neg_meat:
                sample_user["user_compatibilities"]['meatPreference'] = -1

            if user in pos_nuts:
                sample_user["user_compatibilities"]['nutsPreference'] = 1
            elif user in neg_nuts:
                sample_user["user_compatibilities"]['nutsPreference'] = -1

            sample_user['time_period'] = num_days

        with open(f'{dest_dir}/user_{user}.json', 'w') as write_file:
            json.dump(sample_user, write_file, indent=2)
