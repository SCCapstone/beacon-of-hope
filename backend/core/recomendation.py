import random
from firebase import load_r3, load_beverages

class RecommendationEngine:
    def __init__(self):
        self.beverages, self.mcdonalds, self.taco_bell, self.treat_data = load_r3()

    def get_highest_prob_foods(self, items_probs, num_users):
        """
        Extract the highest probability foods (Main Course, Side, Dessert) for each user.

        Args:
            items_probs (list): A list of tuples containing (user, item, probability).
            num_users (int): The total number of users.

        Returns:
            dict: A dictionary mapping each user to their highest-probability food items by category.
        """
        # Combine all food data
        food_r3 = self.mcdonalds | self.taco_bell | self.treat_data

        # Initialize user items dictionary with empty lists for each category
        user_items = {i: {'Main Course': [], 'Side': [], 'Dessert': []}
                      for i in range(1, num_users + 1)}

        # Assign food items to users based on roles and probabilities
        for user, item, prob in items_probs:
            user = int(user)
            prob = float(prob)
            # Get item roles from food_r3
            item_roles = food_r3[item]['food_role']
            for role in item_roles:
                # Skip if the role is Beverage
                if role == 'Beverage':
                    continue
                # Append the item and its probability to the corresponding category
                user_items[user][role].append((item, prob))

        # Initialize recommendation dictionary
        rec_user_items = {i: {'Main Course': [], 'Side': [], 'Dessert': []}
                          for i in range(1, num_users + 1)}

        # Process each user's items to extract highest probability foods
        for user, role_dict in user_items.items():
            for role, role_items in role_dict.items():
                # Find the highest probability
                highest_prob = max((prob for item, prob in role_items), default=0)
                # Get all items with the highest probability
                highest_items = [item for item, prob in role_items if prob == highest_prob]
                rec_user_items[user][role] = highest_items

        # Handle cases where some categories are empty
        for user, role_dict in rec_user_items.items():
            empty = []
            non_empty = []
            # Identify empty and non-empty roles
            for key, val in role_dict.items():
                if len(val) == 0:
                    empty.append(key)
                else:
                    non_empty.append(key)

            # Assign a random item from non-empty roles to empty roles
            for empty_role in empty:
                role_dict[empty_role] = random.choice(
                    [rec_user_items[user][non_empty_role] for non_empty_role in non_empty]
                )

        return rec_user_items

    def get_highest_prob_bevs(self, items_probs, num_users):
        """
        Extract the highest probability beverages for each user.

        Args:
            items_probs (list): A list of tuples containing (user, item, probability).
            num_users (int): The total number of users.

        Returns:
            dict: A dictionary mapping each user to their highest-probability beverage items.
        """
        # Initialize user items dictionary
        user_items = {i: [] for i in range(1, num_users + 1)}

        # Assign beverage items to users
        for user, item, prob in items_probs:
            user = int(user)
            prob = float(prob)
            user_items[user].append((item, prob))

        # Initialize recommendation dictionary
        rec_user_items = {i: [] for i in range(1, num_users + 1)}

        # Process each user's items to extract highest probability beverages
        for user, items in user_items.items():
            # Find the highest probability
            highest_prob = max((prob for item, prob in items), default=0)
            # Get all items with the highest probability
            highest_items = [item for item, prob in items if prob == highest_prob]
            rec_user_items[user] = highest_items

        return rec_user_items
