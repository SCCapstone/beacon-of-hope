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
poetry run python manage.py test tests
```

Run tests with coverage (within the virtual environemnt):
```bash
poetry run coverage run manage.py test tests
poetry run coverage report
```

## 🔧 Available Commands

- `python manage.py runserver` - Start development server
- `python manage.py test tests` - Run tests

## 📚 Learn More

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework Documentation](https://www.django-rest-framework.org/)
- [Poetry Documentation](https://python-poetry.org/docs/)


## API Endpoints

- #### `<backend_ip/beacon/recommendation/bandit>`
   - HTTP Method: `POST`
   - Description: Generates a tailored meal plan based on the provided meal configuration for a specified number of days using the boosted bandit reinforcement learning algorithm.
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
    "user_preferences":{
        "dairyPreference": 1,
        "meatPreference": 0,
        "nutsPreference": -1
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
                    "beverage": "10", // this is a meal id, use <backend_ip>/beacon/get-beverage-info/<str:bev_id>
                    "main_course": "25", // use <backend_ip>/beacon/get-recipe-info/<str:food_id>
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



- #### `<backend_ip/beacon/recommendation/random>`
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
        "starting_date":"2025-02-08",
        "meal_plan_name": "Diabetes + Weight Loss Management",
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
      - Note that the numbers that are the values of keys `beverage`, `main_course`, etc are item ids. For more information about beverages, use the `get-beverage-info` endpoint and for all other items' information use the `get-recipe-info` endpoint
   ```json
   {
    "_id": "67c231ba88fa8471eed74c30",
    "user_id": "67c149e417717376a4ab1dff",
    "name": "User Meal Plan",
    "days":
      {
        "2025-02-28": [
          {"_id": "67c231ba88fa8471eed74c2e",
            "meal_time": "8:00am",
            "meal_name": "breakfast",
            "meal_types": {
              "beverage": "18",
              "main_course": "27",
              "side_dish": "1",
              "dessert": "21"
            }
          }
        ],
        "2025-03-01": [
          {
            "_id": "67c231ba88fa8471eed74c2f",
            "meal_time": "8:00am",
            "meal_name": "breakfast",
            "meal_types": {
              "beverage": "5",
              "main_course": "50",
              "side_dish": "33",
              "dessert": "34"
            }
          }
        ]
      }
  }
    ```
      - (400) Missing or invalid input
      - (500) Internal Server error


- #### `<backend_ip>/beacon/recommendation/retrieve-latest/<str:user_id>`
   - **Deprecated**
   - HTTP Method: `GET`
   - Description: Retrieve latest meal plan recommendation for a particular user
   - Parameters:
    - `user_id`: str
   - Returns:
    ```json
   {
    "_id": PyMongo ObjectId,
    "name": "Generated Meal Plan",
    "start_date": DateTime,
    "end_date": DateTime,
    "days": [
        {
            "day": int,
            "meals": [
                {
                    "_id": PyMongo ObjectId,
                    "meal_time": str,
                    "beverage": str,
                    "main_course": str,
                    "side_dish": str,
                    "dessert": str
                }
            ]
        }
    ],
    "status": str,
    "tags": [str],
    "created_at": DateTime,
    "updated_at": DateTime
    }
    ```

- #### `<backend_ip>/beacon/recommendation/retrieve-all/<str:user_id>`
   - **Deprecated**
   - HTTP Method: `GET`
   - Description: Retrieve all meal plans for a particular user
   - Parameters:
    - `user_id`: str
   - Returns:
    ```json
   {"meal_plans":[
    {
    "_id": PyMongo ObjectId,
    "name": "Generated Meal Plan",
    "start_date": DateTime,
    "end_date": DateTime,
    "days": [
        {
            "day": int,
            "meals": [
                {
                    "_id": PyMongo ObjectId,
                    "meal_time": str,
                    "beverage": str,
                    "main_course": str,
                    "side_dish": str,
                    "dessert": str
                }
            ]
        }
    ],
    "status": str,
    "tags": [str],
    "created_at": DateTime,
    "updated_at": DateTime
    }
    ]
    }
    ```

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
          "_id": pyMongo ObjectId type,
          "username": str,
          "email": str,
          "plan_ids": [pyMongo ObjectId type],
          "dietary_preferences": {
              "preferences": [str],
              "numerical_preferences": {
                  "dairy": -1,
                  "nuts": 0,
                  "meat": 1,
              },
          },
          "health_info": {
              "allergies": [str],
              "conditions": [str],
          },
          "demographicsInfo": {
              "ethnicity": str,
              "height": str,
              "weight": str,
              "age": int,
              "gender": str,
          },
          "meal_plan_config": {
              "num_days": int,
              "num_meals": int,
              "meal_configs": [
                  {
                      "meal_name": str,
                      "meal_time": str,
                      "beverage": bool,
                      "main_course": bool,
                      "side": bool,
                      "dessert": bool,
                  }
              ],
          },
          "created_at": python DateTime,
          "updated_at": python DateTime,
        }

      ```


- #### `<backend_ip>/beacon/user/login`
  - HTTP Method: `POST`
  - Login user profile
  - Parameters
    - Content-type: application/json
    - ```json
      {
        'email': str,
        'password': str
      }
    ```
  - Returns
    - ```json
      {
          "_id": pyMongo ObjectId type,
          "username": str,
          "email": str,
          "plan_ids": [str],
          "dietary_preferences": {
              "preferences": [str],
              "numerical_preferences": {
                  "dairy": -1,
                  "nuts": 0,
                  "meat": 1,
              },
          },
          "health_info": {
              "allergies": [str],
              "conditions": [str],
          },
          "demographicsInfo": {
              "ethnicity": str,
              "height": str,
              "weight": str,
              "age": int,
              "gender": str,
          },
          "meal_plan_config": {
              "num_days": int,
              "num_meals": int,
              "meal_configs": [
                  {
                      "meal_name": str,
                      "meal_time": str,
                      "beverage": bool,
                      "main_course": bool,
                      "side": bool,
                      "dessert": bool,
                  }
              ],
          },
          "created_at": python DateTime,
          "updated_at": python DateTime,
        }

      ```

- #### `<backend_ip>/beacon/user/<str:user_id>`
  - HTTP Method: `DELETE`
  - Delete user profile from database
  - Parameters
    - user_id: PyMongo ObjectId type
  - Returns
    - Status code 204 if successful
