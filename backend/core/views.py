from django.shortcuts import render
from django.http import JsonResponse
from .models import UserPreference, MenuItem
from .utils.recommendation import RecommendationEngine
import random
from srlearn import BoostedRDNClassifier 
import json  


def random_recommendation(request, num_days, rec_constraints):
    if num_days <= 0:
        return JsonResponse({"error": "Number of days must be greater than zero"}, status=400)
    if not rec_constraints:
        return JsonResponse({"error": "Recommendation constraints are required"}, status=400)

    menu_items = list(MenuItem.objects.all())
    beverages = [item for item in menu_items if item.item_type == 'beverage']
    foods = [item for item in menu_items if item.item_type != 'beverage']

    if not beverages or not foods:
        return JsonResponse({"error": "No menu items available for recommendation"}, status=400)

    meal_list = generate_meal_list(rec_constraints)
    rec = [{f"day {day_num}": meal_list} for day_num in range(1, num_days + 1)]

    for day in rec:
        day_rec = day[f"day {day_num}"]
        for meal in day_rec:
            if "Beverage" in meal:
                meal["Beverage"] = random.choice(beverages).name
            if "Main Course" in meal:
                meal["Main Course"] = random.choice(foods).name
            if "Side" in meal:
                meal["Side"] = random.choice(foods).name
            if "Dessert" in meal:
                meal["Dessert"] = random.choice(foods).name

    return JsonResponse(rec)


def sequential_recommendation(request, num_days, rec_constraints):
    """
    Generate sequential meal recommendations for the specified number of days based on constraints.
    """
    # Fetch the list of available beverages and foods
    beverages = list(MenuItem.objects.filter(item_type='beverage'))
    foods = list(MenuItem.objects.exclude(item_type='beverage'))

    # Initialize indices for sequential selection
    beverage_index = 0
    food_index = 0

    meal_list = []
    for constraint in rec_constraints:
        meal = {}
        constraint_type = constraint['meal_type']
        for item in constraint['meal_config']:
            meal[item] = ""
        meal['meal_name'] = constraint['meal_name']
        meal_list.append(meal)

    # Generate recommendations for each day
    rec = [{f"day {day_num}": meal_list} for day_num in range(1, num_days + 1)]

    # Populate recommendations sequentially
    for j, day in enumerate(rec, 1):
        day_rec = day[f'day {j}']
        for meal in day_rec:
            if "Beverage" in meal:
                meal["Beverage"] = beverages[beverage_index].name
                beverage_index = (beverage_index + 1) % len(beverages)

            if "Main Course" in meal:
                meal["Main Course"] = foods[food_index].name
                food_index = (food_index + 1) % len(foods)

            if "Side" in meal:
                meal["Side"] = foods[food_index].name
                food_index = (food_index + 1) % len(foods)

            if "Dessert" in meal:
                meal["Dessert"] = foods[food_index].name
                food_index = (food_index + 1) % len(foods)

    return JsonResponse(rec)

def bandit_recommendation(request, num_days, opinions, rec_constraints):
    """
    Generate bandit-based meal recommendations for the specified number of days based on user opinions and constraints.
    """
    # Load user opinions and facts
    users = list(range(1, 28))  # Assuming 27 users
    dairy_opinions, meat_opinions, nut_opinions = exhaustive_partition()
    user_facts, food_facts = gen_facts(dairy_opinions, meat_opinions, nut_opinions)
    pos_pairs, neg_pairs = gen_pairs(users, dairy_opinions, meat_opinions, nut_opinions)

    # Split into training and testing data
    user_train, user_test = split_train_test(user_facts)
    food_train, food_test = split_train_test(food_facts)
    train_pos, test_pos = split_train_test(pos_pairs)
    train_neg, test_neg = split_train_test(neg_pairs)

    train_facts = user_train + food_train
    test_facts = user_test + food_test

    # Train the bandit model using srlearn
    clf = BoostedRDNClassifier(target="recommendation", trees=20)
    clf.fit(train_facts + train_pos + train_neg)

    # Test the model
    predictions = clf.predict(test_facts + test_pos + test_neg)

    # Process predictions to extract recommended items
    rec_user_bevs = get_highest_prob_bevs([rec for rec in predictions if 'bev' in rec], len(users))
    rec_user_foods = get_highest_prob_foods([rec for rec in predictions if 'food' in rec], len(users))

    # Map user opinions to their index
    all_users_opinions = [[0, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, 1, 1], [0, 1, -1], [0, -1, 0], [0, -1, 1], [0, -1, -1],
                          [1, 0, 0], [1, 0, 1], [1, 0, -1], [1, 1, 0], [1, 1, 1], [1, 1, -1], [1, -1, 0], [1, -1, 1], [1, -1, -1],
                          [-1, 0, 0], [-1, 0, 1], [-1, 0, -1], [-1, 1, 0], [-1, 1, 1], [-1, 1, -1], [-1, -1, 0], [-1, -1, 1], [-1, -1, -1]]
    user_index = all_users_opinions.index(list(opinions.values()))

    # Get recommendations for the user
    bevs = rec_user_bevs[user_index + 1]
    foods = rec_user_foods[user_index + 1]

    # Generate recommendations
    meal_list = []
    for constraint in rec_constraints:
        meal = {}
        constraint_type = constraint['meal_type']
        for item in constraint['meal_config']:
            meal[item] = ""
        meal['meal_name'] = constraint['meal_name']
        meal_list.append(meal)

    rec = [{f"day {day_num}": meal_list} for day_num in range(1, num_days + 1)]

    # Populate the recommendations
    beverages = MenuItem.objects.filter(item_type='beverage')
    foods_db = MenuItem.objects.exclude(item_type='beverage')

    for j, day in enumerate(rec, 1):
        day_rec = day[f'day {j}']
        for meal in day_rec:
            if "Beverage" in meal:
                meal["Beverage"] = random.choice([bev.name for bev in beverages if bev.id in bevs])

            if "Main Course" in meal:
                meal["Main Course"] = random.choice([food.name for food in foods_db if food.id in foods])

            if "Side" in meal:
                meal["Side"] = random.choice([food.name for food in foods_db if food.id in foods])

            if "Dessert" in meal:
                meal["Dessert"] = random.choice([food.name for food in foods_db if food.id in foods])

    return JsonResponse(rec)