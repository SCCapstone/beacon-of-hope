Changes to make to recommendation algorithm


For Gluten-Free, Vegetarian, Vegan, and Diabetes
Tag each recipe in R3 with boolean tags for each: gluten-free, vegan, and low-sugar
Something is vegetarian if hasMeat is false


If Gluten-Free --> check for bread/wheat/flour in ingredients --> get a list of all ingredients in R3
replace all recommended meals with highest recommended gluten-free else random gluten-free object

If Vegan (no animal products) --> check list of all ingredients and remove all animal products

For daily nutritional goals:
Try to stay within 20% of goal for each macronutrient in each day

