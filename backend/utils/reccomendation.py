class RecommendationEngine:
    def __init__(self):
        self.beverages, self.mcdonalds, self.taco_bell, self.treat_data = load_r3()
        
    def get_highest_prob_foods(self, items_probs, num_users):
        food_r3 = self.mcdonalds | self.taco_bell | self.treat_data
        user_items = {i: {'Main Course': [], 'Side': [], 'Dessert': []}
                     for i in range(1, num_users + 1)}
        
        # Rest of the get_highest_prob_foods logic...
        
    def get_highest_prob_bevs(self, items_probs, num_users):
        user_items = {i: [] for i in range(1, num_users + 1)}
        # Rest of the get_highest_prob_bevs logic...