import json

def load_r3():
    beverages = json.load(open('items_data/beverages.json'))
    beverages = beverages['beverage_ids']

    mcdonalds = json.load(open('items_data/mcdonalds.json'))
    mcdonalds = mcdonalds['recipe-ids']

    taco_bell = json.load(open('items_data/taco_bell.json'))
    taco_bell = taco_bell['recipe-ids']

    treat_data = json.load(open('items_data/recipe_repn.json'))
    treat_data = treat_data['recipe-ids']

    return beverages, mcdonalds, taco_bell, treat_data
