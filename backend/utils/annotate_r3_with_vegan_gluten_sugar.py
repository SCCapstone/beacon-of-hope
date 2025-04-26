from firebase import FirebaseManager
import pprint
from tqdm import tqdm

fb_man = FirebaseManager()

r3_dict, _ = fb_man.get_r3()

not_vegan = {
    "mayo",
    "shrimp",
    "Cheddar & Monterey Jack Cheese",
    "egg",
    "pork sausage",
    "Mayo",
    "egg whites",
    "whipped cream",
    "ground beef",
    "Canadian Bacon",
    "chicken broth",
    "shredded Mexican cheese",
    "egg white",
    "heavy whipping cream",
    "American cheese",
    "Shredded Mexican Cheese Blend",
    "bacon",
    "ranch seasoning",
    "sausage",
    "mayyonnaise",
    "cheddar cheese",
    "nacho cheese sauce",
    "beef bouillon powder",
    "ground beef chuck",
    "buttermilk",
    "softened butter",
    "Nacho Cheese",
    "salmon",
    "applewood smoked bacon",
    "eggs",
    "Sour Cream",
    "Chicken Breast",
    "beef round roast",
    "Unsalted butter",
    "shredded cheddar cheese",
    "plain non-fat Greek yogurt",
    "melted butter",
    "Hidden Valley Original Ranch Seasoning and Salad Dressing Mix",
    "egg yolks",
    "butter",
    "large eggs",
    "American Cheese",
    "half and half",
    "ham",
    "finely shredded cheese",
    "cheese",
    "chicken",
    "unsalted butter",
    "ground chuck",
    "sausage patties",
    "egg mixture",
    "milk",
    "Ground Beef",
    "sour cream",
    "mayonnaise",
    "boneless skinless chicken breasts",
}
glutenous = {
    "quick-cooking oatmeal",
    "graham crackers",
    "all-purpose flour",
    "breadcrumbs",
    "bread",
    "phyllo dough",
    "English Muffins",
    "hamburger buns",
    "puff pastry",
    "puff pastry sheet",
    "sesame seed hamburger buns",
    "flour",
    "all purpose flour",
    "crescent rolls",
    "potato hamburger buns",
    "Gordita Flour Tortillas",
    "pancake mix",
    "Kawan parathas",
    "burrito sized flour tortillas",
}
high_sugar = {
    "Jell-O",
    "chocolate",
    "white sugar",
    "granulated sugar",
    "applewood smoked bacon",
    "White Chocolate Chips",
    "sugar",
    "Whipped cream",
    "sprinkle for eyes",
    "Yellow and Green M&M",
    "sprinkle for nose",
    "brown sugar",
    "graham crackers",
    "sprinkle for mouth",
    "whipped cream",
    "chocolate chips",
    "Melted chocolate chips & chopped walnuts",
    "Craisins",
    "vanilla",
    "caramel ice cream topping",
    "Sugar",
    "pancake syrup",
    "honey",
    "peanut butter candy",
    "powdered sugar",
    "maple syrup",
}


for i, r3 in r3_dict.items():
    for el in r3["ingredients"]:
        if "name" not in el:
            if "ingredient_name" in el:
                el["name"] = el.pop("ingredient_name")

    ingredients = set([el["name"] for el in r3["ingredients"]])

    r3["isVegan"] = not ingredients.intersection(not_vegan)
    r3["isGlutenFree"] = not ingredients.intersection(glutenous)
    r3["isLowSugar"] = not ingredients.intersection(high_sugar)


for i, r3 in tqdm(r3_dict.items(), total=len(r3_dict)):
    fb_man._add_document("food-recipes", i, r3)
