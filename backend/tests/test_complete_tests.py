import unittest
from unittest.mock import patch, MagicMock
import json
from django.http import JsonResponse, HttpResponse
from bson import ObjectId
from datetime import datetime

# Import the functions to test
from core.views import (
    create_user, login_user, update_user, delete_account, 
    exit_default, set_nutritional_goals, get_nutritional_goals,
    logout_user,
    retrieve_day_plans, save_meal, delete_meal, favorite_meal
)

class MockFirebaseManager:
    def add_user(self, user_id, user):
        return "Success", 200
    def get_user_by_email(self, user_email, password):
        if user_email == "test@example.com" and password == "correct_password":
            return {"_id": "123", "email": user_email}, 200
        else:
            return Exception("Invalid credentials"), 401
    def get_user_by_id(self, user_id):
        if user_id == "123":
            mock_user = MagicMock()
            mock_user.to_dict.return_value = {
                "_id": "123", 
                "email": "test@example.com",
                "nutritional_goals": {"calories": 2000}
            }
            mock_user.get_nutritional_goals.return_value = {"calories": 2000}
            mock_user.get_temp_day_plans.return_value = {"2023-01-01": "temp_day_plan_123"}
            mock_user.get_day_plans.return_value = {"2023-01-01": "day_plan_123"}
            mock_user.update_permanent_favorite_items.return_value = ("Favorites updated", 200)
            return mock_user, 200
        else:
            return "User not found", 404
    def update_user_attr(self, user_id, attr, value):
        if user_id == "123":
            return "Success", 200
        else:
            return f"Failed to update {attr}", 404
    def delete_user(self, user_id):
        if user_id != "123":
            raise Exception("User not found")
        return True
    def get_day_plans(self, user_id, dates):
        if user_id == "123" and isinstance(dates, list):
            day_plans = {date: {"date": date, "meals": []} for date in dates}
            return day_plans, 200
        return "Error retrieving day plans", 404
    def create_dayplan_object(self, user_id, date, day_plan_id):
        if user_id == "123" and date == "2023-01-01" and day_plan_id == "temp_day_plan_123":
            return "Day plan created", 200
        return "Error creating day plan", 404
    def get_temp_dayplan_by_id(self, day_plan_id):
        if day_plan_id == "temp_day_plan_123":
            return {
                "_id": day_plan_id,
                "meals": [
                    {
                        "_id": "meal_123",
                        "name": "Test Meal",
                        "meal_types": {
                            "Main Course": ["item1"],
                            "Side": ["item2"]
                        }
                    }
                ]
            }, 200
        return "Day plan not found", 404
    def get_dayplan_by_id(self, day_plan_id):
        if day_plan_id == "day_plan_123":
            return {
                "_id": day_plan_id,
                "meals": [
                    {
                        "_id": "meal_123",
                        "name": "Test Meal",
                        "meal_types": {
                            "Main Course": ["item1"],
                            "Side": ["item2"]
                        }
                    }
                ]
            }, 200
        return "Day plan not found", 404
    def store_meal_in_dayplan(self, day_plan_id, meal):
        if day_plan_id in ["temp_day_plan_123", "day_plan_123"] and meal["_id"] == "meal_123":
            return "Meal stored successfully", 200
        return "Error storing meal", 404
    def remove_meal_from_dayplan(self, meal_id, day_plan_id):
        if meal_id == "meal_123" and day_plan_id == "day_plan_123":
            return "Meal removed successfully", 200
        return "Error removing meal", 404

class TestUserAPI(unittest.TestCase):
    def setUp(self):
        self.patcher = patch('core.views.firebaseManager', MockFirebaseManager())
        self.mock_firebase_manager = self.patcher.start()
        self.object_id_patcher = patch('core.views.ObjectId', return_value="new_user_id")
        self.mock_object_id = self.object_id_patcher.start()
        self.datetime_patcher = patch('core.views.datetime')
        self.mock_datetime = self.datetime_patcher.start()
        self.mock_datetime.now.return_value = datetime(2023, 1, 1)
    def tearDown(self):
        self.patcher.stop()
        self.object_id_patcher.stop()
        self.datetime_patcher.stop()

    def test_create_user_invalid_method(self):
        """
        Ensure that create_user only accepts POST requests.
        Any other HTTP method (like GET) should return a 400 error.
        """
        request = MagicMock()
        request.method = "GET"
        response = create_user(request)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.content), {"Error": "Invalid Request Method"})

    def test_create_user_exception(self):
        """
        Test that if the request body is invalid JSON, the view returns a 400 error.
        This ensures robust error handling for malformed input.
        """
        request = MagicMock()
        request.method = "POST"
        request.body = "invalid json"
        response = create_user(request)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.content), {"Error": "There was an error in creating user profile"})

    def test_login_user_missing_fields(self):
        """
        Ensure that login_user returns a 400 error if required fields are missing.
        This checks that both 'email' and 'password' are required for login.
        """
        request = MagicMock()
        request.method = "POST"
        request.body = json.dumps({
            "email": "test@example.com"
        })
        response = login_user(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Error", json.loads(response.content))

    def test_update_user_invalid_method(self):
        """
        Ensure that update_user only accepts PATCH requests.
        Any other HTTP method should return a 400 error.
        """
        request = MagicMock()
        request.method = "POST"
        response = update_user(request, "123")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.content), {"Error": "Invalid Request Method"})

    def test_delete_account_invalid_method(self):
        """
        Ensure that delete_account only accepts DELETE requests.
        Any other HTTP method should return a 400 error.
        """
        request = MagicMock()
        request.method = "POST"
        response = delete_account(request, "123")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.content), {"Error": "Invalid Request Method"})

    def test_exit_default_invalid_method(self):
        """
        Ensure that exit_default only accepts POST requests.
        Any other HTTP method should return a 400 error.
        """
        request = MagicMock()
        request.method = "GET"
        response = exit_default(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", json.loads(response.content))

    def test_exit_default_missing_user_id(self):
        """
        Test that exit_default returns a 400 error if 'user_id' is not provided in the request body.
        """
        request = MagicMock()
        request.method = "POST"
        request.body = json.dumps({})
        response = exit_default(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", json.loads(response.content))

    def test_set_nutritional_goals_invalid_method(self):
        """
        Ensure that set_nutritional_goals only accepts POST requests.
        Any other HTTP method should return a 400 error.
        """
        request = MagicMock()
        request.method = "GET"
        response = set_nutritional_goals(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", json.loads(response.content))

    def test_set_nutritional_goals_missing_fields(self):
        """
        Test that set_nutritional_goals returns a 400 error if required fields are missing.
        Both 'user_id' and 'daily_goals' must be present.
        """
        request = MagicMock()
        request.method = "POST"
        request.body = json.dumps({
            "user_id": "123"
        })
        response = set_nutritional_goals(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", json.loads(response.content))

    def test_set_nutritional_goals_invalid_values(self):
        """
        Test that set_nutritional_goals returns a 400 error if any nutritional value is negative.
        This ensures input validation for user goals.
        """
        request = MagicMock()
        request.method = "POST"
        request.body = json.dumps({
            "user_id": "123",
            "daily_goals": {
                "calories": -100,
                "carbs": 250,
                "protein": 100,
                "fiber": 30
            }
        })
        response = set_nutritional_goals(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", json.loads(response.content))

    def test_get_nutritional_goals_invalid_method(self):
        """
        Ensure that get_nutritional_goals only accepts GET requests.
        Any other HTTP method should return a 400 error.
        """
        request = MagicMock()
        request.method = "POST"
        response = get_nutritional_goals(request, "123")
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", json.loads(response.content))

    def test_save_meal_invalid_method(self):
        """
        Ensure that save_meal only accepts POST requests.
        Any other HTTP method should return a 400 error.
        """
        request = MagicMock()
        request.method = "GET"
        response = save_meal(request)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.content), {"Error": "Invalid Request Method"})

    def test_save_meal_missing_fields(self):
        """
        Test that save_meal returns a 403 error if required fields are missing in the request.
        """
        request = MagicMock()
        request.method = "POST"
        request.body = json.dumps({
            "date": "2023-01-01",
            "user_id": "123"
        })
        response = save_meal(request)
        self.assertEqual(response.status_code, 403)
        response_data = json.loads(response.content)
        self.assertIn("Error", response_data)
        self.assertIn("Request Body missing required attribute", response_data["Error"])

    def test_delete_meal_invalid_method(self):
        """
        Ensure that delete_meal only accepts DELETE requests.
        Any other HTTP method should return a 400 error.
        """
        request = MagicMock()
        request.method = "POST"
        response = delete_meal(request)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.content), {"Error": "Invalid Request Method"})

    def test_delete_meal_missing_fields(self):
        """
        Test that delete_meal returns a 403 error if required fields are missing in the request.
        """
        request = MagicMock()
        request.method = "DELETE"
        request.body = json.dumps({
            "date": "2023-01-01",
            "user_id": "123"
        })
        response = delete_meal(request)
        self.assertEqual(response.status_code, 403)
        response_data = json.loads(response.content)
        self.assertIn("Error", response_data)
        self.assertIn("Request Body missing required attribute", response_data["Error"])

    def test_favorite_meal_invalid_method(self):
        """
        Ensure that favorite_meal only accepts POST requests.
        Any other HTTP method should return a 400 error.
        """
        request = MagicMock()
        request.method = "GET"
        response = favorite_meal(request)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.content), {"Error": "Invalid Request Method"})

    def test_favorite_meal_missing_fields(self):
        """
        Test that favorite_meal returns a 403 error if required fields are missing in the request.
        """
        request = MagicMock()
        request.method = "POST"
        request.body = json.dumps({
            "date": "2023-01-01"
        })
        response = favorite_meal(request)
        self.assertEqual(response.status_code, 403)
        response_data = json.loads(response.content)
        self.assertIn("Error", response_data)
        self.assertIn("Request Body missing required attribute", response_data["Error"])

    def test_retrieve_day_plans_invalid_method(self):
        """
        Ensure that retrieve_day_plans only accepts POST requests.
        Any other HTTP method should return a 400 error.
        """
        request = MagicMock()
        request.method = "GET"
        response = retrieve_day_plans(request, "123")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.content), {"Error": "Invalid Request Method"})


# class CustomTextTestResult(unittest.TextTestResult):
#     def stopTestRun(self):
#         super().stopTestRun()
#         if self.wasSuccessful():
#             print("\033[92m" + "\n🎉 All tests passed successfully! 🎉\n" + "\033[0m")
#         else:
#             print("\033[91m" + "\nSome tests failed. Please check the output above.\n" + "\033[0m")

# if __name__ == '__main__':
#     unittest.main(testRunner=unittest.TextTestRunner(resultclass=CustomTextTestResult))
