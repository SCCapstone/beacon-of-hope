class Coverage:
    # Define the meal configuration
    meal_config = []

    # Define the ideal weight for each role in a meal
    weights = [1, 1, 1, 1]  # Default ideal weights for each role

    # Data augmentation: Define roles each food can take
    food_items = {}

    # Coverage score
    coverage = 0

    def __init__(self):
        ...
        # print("Class initiated")

    def set_meal_config(self, meal_config: list):
        """Define the meal configuration.

        Args:
            meal_config (list): List of items in a typical meal.
        """
        self.meal_config = meal_config

    def get_meal_config(self):
        """Return meal configuration."""
        return self.meal_config

    def set_new_weights(self, weights: list):
        """Set new weights to food roles.

        Args:
            weights (list): A list of weights for the food roles.
        """
        self.weights = weights
        self.normalize_weights()

    def normalize_weights(self):
        """Normalize the weights."""

        # if one of the weights is negative
        if min(self.weights) < 0:
            range_of_weights = max(self.weights) - min(self.weights)
            for i in range(len(self.weights)):
                self.weights[i] += range_of_weights

        # if min(weights) is still negative => all weights are equal
        if min(self.weights) < 0:
            self.weights = [1, 1, 1, 1]  # Default ideal weights for each role

        # normalize weights
        self.weights = [weight / sum(self.weights) for weight in self.weights]

    def get_weights(self):
        """Return existing weights for the food roles."""
        return self.weights

    def add_food_items(self, roles: dict):
        """Add food roles.

        Args:
            food_items (dict): {'food_item': [weight1, weight2, ..., weightN], ...}
            Each weight can only be 0 or 1.
        """
        for i in roles:
            if not all(
                element in [0, 1] for element in roles[i]
            ):  # if provided weights for food roles are not in [0,1]
                raise Exception("Each weight can only be 0 or 1.")

            if (
                len(roles[i]) != len(self.meal_config) and self.meal_config != []
            ):  # if provided weights don't match the meal config size
                raise Exception(
                    "The food roles list must match the size of the meal configuration."
                )

            self.food_items[i] = roles[i]

    def get_food_items(self):
        """Return food roles."""
        return self.food_items

    def calc_coverage(self, meal_recommendation):
        """
        Given a meal (meal_recommendation[]), check how many food roles the meal satisfies.
        Penalize roles that are incorrectly recommended (assigned a food item to the wrong role; e.g., cake as beverage).
        """
        # make sure the size of weights should match the size of meal configuration
        if len(self.weights) != len(self.meal_config):
            raise Exception(
                "Size of weights[] must match the size of meal configuration!"
            )

        # coverage score
        coverage_score = 0

        # Iterate over the roles in the meal configuration
        for role in self.meal_config:
            if (
                role in meal_recommendation
            ):  # if the role is satisfied in the recommendation
                meal_index = self.meal_config.index(role)
                if (
                    meal_recommendation[role] in self.food_items
                ):  # if the recced item is within the annotated food items
                    # if the recommended food item fulfills the role (i.e., the weight is 1)
                    if self.food_items[meal_recommendation[role]][meal_index] == 1:
                        coverage_score += self.weights[meal_index]

                    else:  # if the recommended food item doesn't fulfill the correct role, penalize
                        coverage_score -= self.weights[meal_index]
                else:
                    # if the recommended food item is not in the food items, penalize for the food role that is incorrectly recommended for
                    coverage_score -= self.weights[
                        meal_index
                    ]  # if {'Beverage': 'cake'} is recommended, penalize coverage_score for the weight that is assigned to 'Beverage'
            else:
                # coverage is not affected if a role is not included in the recommendation
                coverage_score += 0

            self.coverage = coverage_score

    def get_coverage(self):
        """Return the coverage score."""
        return self.coverage
