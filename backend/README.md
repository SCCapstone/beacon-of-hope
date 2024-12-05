# BEACON of Hope Backend

This directory contains the backend implementation of the BEACON of Hope meal recommendation system, built with Django and Poetry.

## 🛠️ Technology Stack

- [Django](https://www.djangoproject.com/)
- [Poetry](https://python-poetry.org/) (Python dependency management)
- [Django REST Framework](https://www.django-rest-framework.org/)

## 📋 Prerequisites

- Python 3.11 or higher
- [Pipx](https://pipx.pypa.io/)
- [Poetry](https://python-poetry.org/)

### Installing Prerequisites

1. **Install Pipx**
   ```bash
   # Mac Install
   brew install pipx
   pipx ensurepath

   # Windows Install
   py -m pip install --user pipx
   .\pipx.exe ensurepath
   ```

2. **Install Poetry**
   ```bash
   pipx install poetry
   ```

## 🚀 Getting Started

1. **Install dependencies**
   ```bash
   poetry install
   ```

2. **Activate virtual environment**
   ```bash
   poetry shell
   ```

3. **Run database migrations**
   ```bash
   python manage.py migrate
   ```

4. **Start development server**
   ```bash
   python manage.py runserver
   ```

## 📁 Project Structure

```
back-end/
├── beacon/            # Main Django project directory
├── api/              # Django REST Framework API
├── core/             # Core application logic
├── recommender/      # Recommendation system logic
├── tests/            # Test files
└── manage.py         # Django management script
```

## 🧪 Testing

Run the test suite (within the virtual environemnt):
```bash
poetry run python manage.py test
```

Run tests with coverage (within the virtual environemnt):
```bash
poetry run coverage run manage.py test
poetry run coverage report
```

## 🔧 Available Commands

- `python manage.py runserver` - Start development server
- `python manage.py test` - Run tests

## 📚 Learn More

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework Documentation](https://www.django-rest-framework.org/)
- [Poetry Documentation](https://python-poetry.org/docs/)


## API Documentation
TODO (Zach and Vansh put API endpoints for generating recommendations)

- #### `<backend_ip/beacon/recommendation/random/>`
   - HTTP Method: `POST`
   - Description: Generates a random meal plan based on the provided meal configuration for a specified number of days.
   - Request body:
      - Content-type: application/json

   - JSON Schema:
   ```json
   {
      "meal_plan_config": {
        "num_days": 3,
        "num_meals": 3,
        "meal_configs": [
            {
                "meal_name": "breakfast",
                "meal_time": "8:00am",
                "beverage": true,
                "main_course": true,
                "side": false,
                "dessert": false
            },
            {
                "meal_name": "lunch",
                "meal_time": "12:00pm",
                "beverage": true,
                "main_course": true,
                "side": true,
                "dessert": false
            }
        ]
    },
    "user_id": "674f7d4c5b4425639bef8cd6"
  }
  ```
   - Response:
      - (200) returns a generated meal plan in JSON
   ```json
   {
    "_id": "507f191e810c19729de860ea",
    "user_id": "674f7d4c5b4425639bef8cd6",
    "name": "Generated Meal Plan",
    "start_date": "2024-12-04T08:00:00Z",
    "end_date": "2024-12-07T08:00:00Z",
    "days": [
        {
            "day": 0,
            "meals": [
                {
                    "_id": "5a934e000102030405000000",
                    "meal_time": "8:00am",
                    "beverage": "bev123",
                    "main_course": "food456",
                    "side_dish": null,
                    "dessert": null
                }
            ]
        }
    ],
    "status": "active",
    "tags": ["random", "generated"],
    "created_at": "2024-12-04T12:00:00Z",
    "updated_at": "2024-12-04T12:00:00Z"
    }
    ```
      - (400) Missing or invalid input
      - (500) Internal Server error

- #### `<backend_ip>/beacon/get-recipe-info/<str:food_id>`
  - HTTP Method: `GET`
  - Parameters (no request body)
    - food_id (integer string representative of food item)
  - Returns a JSON string which is the [R3 representation](https://github.com/vnagpal25/BEACON/blob/main/example_r3.json) of food item consisting of ingredients, instructions, macronutrients, meal roles, etc.

- #### `<backend_ip>/beacon/get-beverage-info/<str:bev_id>`

  - HTTP Method: `GET`
  - Parameters (no request body)
    - bev_id (integer string representative of food item)
  - Returns:
    - a JSON string consisting of the requested beverage (for now just the name)

- #### `<backend_ip>/beacon/user/signup`
  - HTTP Method: `POST`
  - Create a user profile (create and save new user information)
  - Parameters
    - Content-type: application/json
    - JSON schema:
    ```json
      {
        'first_name': str,
        'last_name': str,
        'email': str,
        'password': str
      }
    ```
  - Returns
    - ```json
        {
          'uuid': str
        }
      ```

- #### `<backend_ip>/beacon/user/login`
  - HTTP Method: `POST`
  - Login user profile
  - Parameters
    - Content-type: application/json
    - JSON schema:
    ```json
      {
        'email': str,
        'password': str
      }
    ```
  - Returns
    - ```json
        {
          'uuid': str
        }
      ```
