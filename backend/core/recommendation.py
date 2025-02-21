import random
from .firebase import get_r3, get_beverages

# TODO, consolidate this with bandit_helpers.py

food_r3 = get_r3()[0]
beverages = get_beverages()[0]


def get_highest_prob_foods(items_probs, num_users):
    user_items = {
        i: {"Main Course": [], "Side": [], "Dessert": []}
        for i in range(1, num_users + 1)
    }

    for user, item, prob in items_probs:
        # get item roles
        item_roles = food_r3[item]["food_role"]
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
