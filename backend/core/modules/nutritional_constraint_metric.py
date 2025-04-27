import warnings
from .firebase import FirebaseManager
import traceback


class User_Constraints:
    # Define the user configuration (e.g., HasDairy, HasMeat, HasNuts)
    constraints = {
        "HasDairy": 0,
        "HasMeat": 0,
        "HasNuts": 0,
    }  # -1: No, 0: Neutral, 1: Yes

    # Default number of user-defined constraints
    num_constraints = 3  # HasDairy, HasMeat, HasNuts

    # Annotated food items
    food_items = {}

    # Calculate the configuration score
    config_score = 0

    def __init__(self):
        # Recipe calibration
        firebaseManager = FirebaseManager()
        self.r3_items, _ = firebaseManager.get_r3()
        self.bev_items, _ = firebaseManager.get_beverages()

        for id_, recipe in self.r3_items.items():
            features_dict = {
                "hasDairy": recipe.get("hasDairy", False),
                "hasMeat": recipe.get("hasMeat", False),
                "hasNuts": recipe.get("hasNuts", False),
            }
            compt_features = []
            for feature, compt in features_dict.items():
                if compt:
                    compt_features.append(feature)
            self.add_annotated_food_item(id_, compt_features)

        for id_, bev in self.bev_items.items():
            features_dict = {
                "hasDairy": bev.get("hasDairy", False),
                "hasMeat": bev.get("hasMeat", False),
                "hasNuts": bev.get("hasNuts", False),
            }
            compt_features = []

            for feature, compt in features_dict.items():
                if compt:
                    compt_features.append(feature)
            self.add_annotated_food_item(id_, compt_features)

        print("Nutritional Constraint Calculator Locked and Loaded")

    def set_num_constraints(self, num_constraints: int):
        """Define the number of user-defined constraints.

        Args:
            num_constraints (int): Number of user-defined constraints.
        """
        self.num_constraints = num_constraints

    def get_num_constraints(self):
        """Return the number of user-defined constraints."""
        return self.num_constraints

    def add_new_constraint(self, constraint: str, value: int):
        """Add a new constraint to the user configuration.

        Args:
            constraint (str): New constraint to be added.
            value (int): Value of the new constraint. -1: No, 0: Neutral, 1: Yes.
        """
        if constraint not in self.constraints:
            self.constraints[constraint] = value
            self.num_constraints += 1
        else:
            warnings.warn(
                "Constraint already exists in the current configuration. Please use 'define_constraints' to update the existing constraint."
            )

        # Update the number of user-defined constraints
        self.num_constraints = len(self.constraints)

    def remove_constraint(self, constraint: str):
        """Remove a constraint from the user configuration.

        Args:
            constraint (str): Constraint to be removed.
        """
        if constraint in self.constraints:
            del self.constraints[constraint]
            self.num_constraints -= 1
        else:
            raise Exception(
                "Constraint does not exist in the current configuration. Please use 'define_constraints' to update the existing constraint."
            )

    def define_constraints(self, constraints: dict):
        """Define user constraints.

        Args:
            constraints (dict): Dictionary mapping constraints to their corresponding values. -1: No, 0: Neutral, 1: Yes.
        """
        for i in constraints:
            if i in self.constraints:
                self.constraints[i] = constraints[i]
            else:
                warnings.warn(
                    "Constraint does not exist in the current configuration. Please use 'add_new_constraint' to add a new constraint."
                )

    def get_constraints(self):
        """Return user configuration."""
        if len(self.constraints) != self.num_constraints:
            warnings.warn(
                "Number of constraints does not match the number of user-defined constraints."
            )
        return self.constraints

    def add_annotated_food_item(self, food_item: str, annotations: list):
        """Add annotated food items.

        Args:
            food_item (str): Food item to be annotated.
            annotations (list): List of annotations for the food item.
        """
        self.food_items[food_item] = annotations

    def add_multiple_annotated_food_items(self, food_items: dict):
        """Add multiple annotated food items.

        Args:
            food_items (dict): Dictionary of food items and their corresponding annotations.
        """
        for i in food_items:
            self.food_items[i] = food_items[i]

    def get_annotated_food_items(self):
        """Return annotated food items."""
        return self.food_items

    def calc_config(self, meal_recommendation, hard_constraints=False):
        """
        Calculate the configuration score based on user constraints.

        This function computes a score indicating how well the recommended meal configuration adheres to user preferences. When calculating the score, two types of constraints are considered: hard constraints and soft constraints.

        - Hard Constraints: These are strict requirements set by the user. For instance, if the user specifies they do not want dairy in their meal, any inclusion of dairy will penalize the score. Conversely, if they explicitly request dairy, the absence of it will result in a penalty.

        - Soft Constraints: These are preferences that are considered but are not strictly enforced. For instance, if the user is neutral or positive towards a preference, any inclusion/absence of that preference will NOT penalize the score. It is only when the user has a strictly negative preference that the score is affected.

        (By default, a hard constraint pertains to items like dairy, meat, and/or nuts that the user does not want in their meal.)

        The 'hard_constraints' flag determines whether to consider hard constraints (True) or soft constraints (False) when calculating the score.

        Example scenarios:
        1. If 'HasDairy' is set to 0 or 1 and 'hard_constraints' is False, the presence or absence of dairy will not affect the score.
        2. If 'HasDairy' is set to 1 and 'hard_constraints' is True, the score will be penalized if the recommended meal does not contain dairy.

        """

        # Make note of total number of constraints that the user has specified and how many are violated
        total_constraints = self.num_constraints
        violated_constraints = []

        # Make a note of recommended meal items and their annotations
        meal_rec_annotations = {}
        for role in meal_recommendation:
            item = meal_recommendation[role]
            if item not in self.food_items:
                meal_rec_annotations[item] = []
                continue
            meal_rec_annotations[item] = self.food_items[item]

        # Combine all the annotations for the recommended meal items
        all_annotations = []
        for item in meal_rec_annotations:
            all_annotations += meal_rec_annotations[item]

        # Verify if user-specified constraints are present in the provided meal recommendation
        for i in self.constraints:
            # If the user specified that they do not want a certain item in their meal but it is present in the recommendation (regardless of whether hard_constraints==True/False)
            if self.constraints[i] == -1 and i in all_annotations:
                violated_constraints.append(i)

            # If the user specified that they want a certain item in their meal but it is not present in the recommendation (hard_constraints=True)
            if hard_constraints == True:
                if self.constraints[i] == 1 and i not in all_annotations:
                    violated_constraints.append(i)

        # Calculate the configuration score
        self.config_score = 1 - (len(violated_constraints) / total_constraints)

        # Return the configuration score
        return self.config_score, all_annotations

    def get_config(self):
        """Return the configuration score."""
        return self.config_score
