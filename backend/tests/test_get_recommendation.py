from django.test import TestCase, Client
from django.urls import reverse
import json
from unittest.mock import patch, MagicMock
from datetime import datetime
from bson import ObjectId


class MealPlanAPITests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user_id = "test_user_123"
        self.valid_meal_config = {
            "meal_plan_config": {
                "num_days": 7,
                "num_meals": 3,
                "meal_configs": [
                    {
                        "meal_time": "breakfast",
                        "meal_name": "Breakfast",
                        "meal_types": {
                            "beverage": True,
                            "main_course": True,
                            "side": True,
                            "dessert": False,
                        },
                    },
                    {
                        "meal_time": "lunch",
                        "meal_name": "Lunch",
                        "meal_types": {
                            "beverage": True,
                            "main_course": True,
                            "side": True,
                            "dessert": True,
                        },
                    },
                    {
                        "meal_time": "dinner",
                        "meal_name": "Dinner",
                        "meal_types": {
                            "beverage": True,
                            "main_course": True,
                            "side": True,
                            "dessert": True,
                        },
                    },
                ],
            },
            "user_id": "test_user_123",
        }

        self.mock_food_items = {
            "Chicken Rice": {"name": "Chicken Rice", "type": "main"},
            "Salad": {"name": "Salad", "type": "side"},
            "Ice Cream": {"name": "Ice Cream", "type": "dessert"},
        }

        self.mock_beverages = {
            "Water": {"name": "Water", "type": "beverage"},
            "Coffee": {"name": "Coffee", "type": "beverage"},
        }

    @patch("core.views.get_r3")
    @patch("core.views.get_beverages")
    @patch("core.views.add_mealplan")
    def test_random_recommendation_success(
        self, mock_add_mealplan, mock_get_beverages, mock_get_r3
    ):
        """Test successful generation of random meal plan"""
        # Setup mocks
        mock_get_r3.return_value = self.mock_food_items
        mock_get_beverages.return_value = self.mock_beverages
        mock_add_mealplan.return_value = None

        # Make request
        response = self.client.post(
            reverse("random_recommendation"),
            data=json.dumps(self.valid_meal_config),
            content_type="application/json",
        )

        # Assert response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        # Verify structure
        self.assertIn("_id", data)
        self.assertEqual(data["user_id"], self.user_id)
        self.assertEqual(len(data["days"]), 7)
        self.assertEqual(len(data["days"][0]["meals"]), 3)

        # Verify meal structure
        first_meal = data["days"][0]["meals"][0]
        self.assertIn("_id", first_meal)
        self.assertIn("meal_time", first_meal)
        self.assertIn("meal_types", first_meal)

    def test_random_recommendation_invalid_config(self):
        """Test meal plan generation with invalid configuration"""
        invalid_config = {
            "meal_plan_config": {
                "num_days": "invalid",  # Should be integer
                "num_meals": 3,
                "meal_configs": [None, None, None],
            },
            "user_id": "test_user_123",
        }

        response = self.client.post(
            reverse("random_recommendation"),
            data=json.dumps(invalid_config),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("error", json.loads(response.content))

    def test_random_recommendation_missing_config(self):
        """Test meal plan generation with missing configuration"""
        response = self.client.post(
            reverse("random_recommendation"),
            data=json.dumps({"user_id": "test_user_123"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("error", json.loads(response.content))

    @patch("core.views.get_r3")
    def test_random_recommendation_food_retrieval_error(self, mock_get_r3):
        """Test handling of food retrieval error"""
        mock_get_r3.return_value = Exception("Database error")

        response = self.client.post(
            reverse("random_recommendation"),
            data=json.dumps(self.valid_meal_config),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 500)
        self.assertIn("error", json.loads(response.content))

    def test_random_recommendation_invalid_method(self):
        """Test endpoint with invalid HTTP method"""
        response = self.client.get(reverse("random_recommendation"))
        self.assertEqual(response.status_code, 405)

    # Tests for retrieve_meal_plan endpoint
    @patch("core.views.get_user_mealplan")
    def test_retrieve_meal_plan_success(self, mock_get_user_mealplan):
        """Test successful meal plan retrieval"""
        mock_meal_plan = {
            "_id": str(ObjectId()),
            "user_id": self.user_id,
            "days": [],
            "status": "active",
        }
        mock_get_user_mealplan.return_value = mock_meal_plan

        response = self.client.get(
            reverse("retrieve_meal_plan", kwargs={"user_id": self.user_id})
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), mock_meal_plan)

    @patch("core.views.get_user_mealplan")
    def test_retrieve_meal_plan_error(self, mock_get_user_mealplan):
        """Test meal plan retrieval with error"""
        mock_get_user_mealplan.return_value = Exception("Database error")

        response = self.client.get(
            reverse("retrieve_meal_plan", kwargs={"user_id": self.user_id})
        )

        self.assertEqual(response.status_code, 500)
        self.assertIn("Error", json.loads(response.content))
