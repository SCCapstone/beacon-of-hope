from django.test import TestCase, Client
from django.urls import reverse
import json
from unittest.mock import patch

from django.contrib.auth import get_user_model

User = get_user_model()


class LoginUserTests(TestCase):
    def setUp(self):
        """Ensure user is created before tests."""
        self.client = Client()
        self.user = User.objects.create_user(
            email="test@example.com", password="testpassword123", username="testuser"
        )
        self.user.save()  # Ensure the user is committed to the test database

    # Debugging: Check if the user exists in the test DB
    user_exists = User.objects.filter(email="test@example.com").exists()
    print("User exists in test DB:", user_exists)  # Should print True

    @patch("core.views.get_user_by_email")
    def test_successful_login(self, mock_get_user_by_email):
        """Test login with correct credentials."""
        mock_get_user_by_email.return_value = {
            "email": "test@example.com",
            "username": "testuser",
        }

        data = {"email": "test@example.com", "password": "testpassword123"}
        response = self.client.post(
            reverse("login_user"),
            data=json.dumps(data),
            content_type="application/json",
        )

        print(response.json())  # Debugging

        self.assertEqual(response.status_code, 200)
        self.assertIn("email", response.json())
        self.assertEqual(response.json()["email"], "test@example.com")

    def test_invalid_credentials(self):
        """Test login with incorrect password."""
        data = {"email": "test@example.com", "password": "wrongpassword"}
        response = self.client.post(
            reverse("login_user"),
            data=json.dumps(data),
            content_type="application/json",
        )

        print(response.json())  # Debugging

        self.assertEqual(response.status_code, 500)  # Expecting 500
        self.assertIn("Error", response.json())

        expected_error_message = "Error retrieving documents: No document found for {email: test@example.com}"
        self.assertEqual(response.json()["Error"], expected_error_message)

    def test_missing_data(self):
        """Test login when password is missing."""
        data = {"email": "test@example.com"}
        response = self.client.post(
            reverse("login_user"),
            data=json.dumps(data),
            content_type="application/json",
        )

        print(response.json())  # Debugging

        self.assertEqual(response.status_code, 400)
        self.assertIn("Error", response.json())

        self.assertEqual(response.json()["Error"], "Missing key: 'password'")
