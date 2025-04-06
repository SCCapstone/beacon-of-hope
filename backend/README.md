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
      "starting_date": "2025-03-08",
      "meal_plan_config": {
        "num_days": 3,
        "num_meals": 3,
        "meal_configs": [
            {
                "meal_name": "breakfast",
                "beverage": true,
                "main_course": true,
                "side": false,
                "dessert": false
            },
            {
                "meal_name": "lunch",
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
    "_id": "67d242226d9fb9f7510444fc",
    "user_id": "67c149e417717376a4ab1dff",
    "name": "User Meal Plan",
    "days": {
      "2025-03-12": {
        "_id": "67d242226d9fb9f7510444fa",
        "meals": [
          {
            "_id": "67d242226d9fb9f7510444f8",
            "meal_name": "breakfast",
            "meal_types": {
              "main_course": "26",
              "side": "28",
              "dessert": "22",
              "beverage": "15"
            },
            "variety_score": 1.0,
            "item_coverage_score": 0.5,
            "nutritional_constraint_score": 0.6666666666666667
          },
          {
            "_id": "67d242226d9fb9f7510444f9",
            "meal_name": "lunch",
            "meal_types": {
              "main_course": "26",
              "dessert": "22"
            },
            "variety_score": 1.0,
            "item_coverage_score": 0.5,
            "nutritional_constraint_score": 0.6666666666666667
          }
        ],
        "user_id": "67c149e417717376a4ab1dff",
        "meal_plan_id": "67d242226d9fb9f7510444fc"
      },
      "2025-03-13": {
        "_id": "67d242226d9fb9f7510444fb",
        "meals": [
          {
            "_id": "67d242226d9fb9f7510444f8",
            "meal_name": "breakfast",
            "meal_types": {
              "main_course": "26",
              "side": "28",
              "dessert": "22",
              "beverage": "15"
            },
            "variety_score": 1.0,
            "item_coverage_score": 0.5,
            "nutritional_constraint_score": 0.6666666666666667
          },
          {
            "_id": "67d242226d9fb9f7510444f9",
            "meal_name": "lunch",
            "meal_types": {
              "main_course": "26",
              "dessert": "22"
            },
            "variety_score": 1.0,
            "item_coverage_score": 0.5,
            "nutritional_constraint_score": 0.6666666666666667
          }
        ],
        "user_id": "67c149e417717376a4ab1dff",
        "meal_plan_id": "67d242226d9fb9f7510444fc"
      }
    },
    "scores": {
      "variety_scores": [
        1.0,
        1.0,
        1.0,
        1.0
      ],
      "coverage_scores": [
        0.5,
        0.5,
        0.5,
        0.5
      ],
      "constraint_scores": [
        0.6666666666666667,
        0.6666666666666667,
        0.6666666666666667,
        0.6666666666666667
      ]
    }
  }
    ```
      - (400) Missing or invalid input
      - (500) Internal Server error

- #### `<backend_ip/beacon/recommendation/edit-meal>`
   - HTTP Method: `POST`
   - Description: Edit a specific meal within an existing meal plan. Allows adding, updating, or removing individual meal components (beverage, main course, side, dessert).
   - Request body:
      - Content-type: application/json

   - JSON Schema:
   ```json
   {
      "user_id": "674f7d4c5b4425639bef8cd6",
      "date": "2025-03-08",
      "meal_name": "breakfast",
      "updates": {
          "beverage": "15",
          "main_course": "26",
          "side": null,
          "dessert": "22"
      },
      "meal_plan": {
          "_id": "67d242226d9fb9f7510444fc",
          "user_id": "67c149e417717376a4ab1dff",
          "name": "User Meal Plan",
          "days": {
              "2025-03-08": {
                  "_id": "67d242226d9fb9f7510444fa",
                  "meals": [
                      {
                          "_id": "67d242226d9fb9f7510444f8",
                          "meal_name": "breakfast",
                          "meal_types": {
                              "main_course": "26",
                              "side": "28",
                              "dessert": "22",
                              "beverage": "15"
                          }
                      }
                  ],
                  "user_id": "67c149e417717376a4ab1dff",
                  "meal_plan_id": "67d242226d9fb9f7510444fc"
              }
          }
      }
   }
   ```
   - Response:
      - (200) Successfully updated meal
   ```json
   {
      "success": true,
      "updated_day_plan": {
          "_id": "67d242226d9fb9f7510444fa",
          "meals": [
              {
                  "_id": "67d242226d9fb9f7510444f8",
                  "meal_name": "breakfast",
                  "meal_types": {
                      "main_course": "26",
                      "dessert": "22",
                      "beverage": "15"
                  }
              }
          ],
          "user_id": "67c149e417717376a4ab1dff",
          "meal_plan_id": "67d242226d9fb9f7510444fc"
      },
      "message": "Successfully updated breakfast for 2025-03-08"
   }
   ```
      - (400) Missing or invalid input
      - (404) Meal or date not found
      - (500) Internal Server error

- #### `<backend_ip/beacon/recommendation/regenerate-partial>`
   - HTTP Method: `POST`
   - Description: Regenerate specific meals in an existing meal plan using the bandit recommendation system. This endpoint is useful when a user wants to replace specific meals while keeping the rest of their meal plan intact.
   - Request body:
      - Content-type: application/json

   - JSON Schema:
   ```python
    {
      "user_id":"67eeda155888fbf4e77f55dc",
      "dates_to_regenerate":["2025-04-02", "2025-04-03"]
    }
   ```
   - Response:
      - (200) Successfully regenerated meals
   ```python
    {
      "days": {
          "2025-04-02": {
            "_id": "67ef2b008198d59ab19e4e4d",
            "meals": [
                {
                    "_id": "67ef2b008198d59ab19e4e4c",
                    "meal_name": "Breakfast",
                    "meal_types": {
                        "beverage": "8",
                        "main_course": "38",
                        "dessert": "11",
                        "side": "14"
                    },
                    "variety_score": 1.0,
                    "item_coverage_score": 0.5,
                    "nutritional_constraint_score": 1.0
                }
            ],
            "user_id": "67eeda155888fbf4e77f55dc"
        },
          "2025-04-03": {
            "_id": "67ef2b008198d59ab19e4e4d",
            "meals": [
                {
                    "_id": "67ef2b008198d59ab19e4e4c",
                    "meal_name": "Breakfast",
                    "meal_types": {
                        "beverage": "8",
                        "main_course": "38",
                        "dessert": "11",
                        "side": "14"
                    },
                    "variety_score": 1.0,
                    "item_coverage_score": 0.5,
                    "nutritional_constraint_score": 1.0
                }
            ],
            "user_id": "67eeda155888fbf4e77f55dc"
        }
      }
    }
   ```
      - (400) Missing or invalid input
      - (403) Missing required fields
      - (500) Internal Server error


- #### `<backend_ip>/beacon/recommendation/retrieve-days/<str:user_id>`
   - HTTP Method: `POST`
   - Description: Retrieve specific meal plans for a particular user based on a list of dates
   - Parameters:
    - `user_id`: str
    - Request body:
      - Content-type: application/json

      - JSON Schema:
        ```json
        {
            "dates": ["2025-03-08", "2025-04-01"]
        }
        ```

   - Returns:
    ```json
      {
        "day_plans": {
        "2025-03-02": {
          "user_id": "67c149e417717376a4ab1dff",
          "meal_plan_id": "67c39f266c4433c982d7c3c2",
          "meals": [
            {
              "meal_types": {
                "beverage": "25",
                "dessert": "4",
                "main_course": "41",
                "side": "41"
              },
              "meal_name": "breakfast",
              "_id": "67c39f266c4433c982d7c3be"
            }
          ],
          "_id": "67c39f266c4433c982d7c3c1"
        },
        "2025-03-03": {}
      }
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
    ```python
      {
      "first_name": str,
      "last_name": str,
      "email": str,
      "password": str,
      "demographicsInfo": {
          "ethnicity": str,
          "height": str,
          "weight": str,
          "gender": str,
        }
      }
    ```
  - Returns
    - ```python
      {
          "_id": str,
          "username": str,
          "email": str,
          "plan_ids": [str],
          "dietary_preferences": {
              "preferences": [str],
              "numerical_preferences": {
                  "dairy": int, # {-1, 0, 1}
                  "nuts": int, # {-1, 0, 1}
                  "meat": int, # {-1, 0, 1}
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
                      "beverage": bool,
                      "main_course": bool,
                      "side": bool,
                      "dessert": bool,
                  }
              ],
          },
          "created_at": DateTime,
          "updated_at": DateTime,
        }

      ```


- #### `<backend_ip>/beacon/user/login`
  - HTTP Method: `POST`
  - Login user profile
  - Parameters
    - Content-type: application/json
    - ```python
      {
        "email": str,
        "password": str
      }
    ```
  - Returns
    - ```python
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


- #### `<backend_ip>/beacon/user/update/<str:user_id>`
  - HTTP Method: `PATCH`
  - Update user profile in database
  - Parameters
    - user_id: PyMongo ObjectId type


- #### `<backend_ip>/beacon/user/delete/<str:user_id>`
  - HTTP Method: `DELETE`
  - Delete user profile from database
  - Parameters
    - user_id: PyMongo ObjectId type
    - Content-type: application/json
    - ```python
      {
        "email": str, # optional
        "name": str, # optional
        "ethnicity": str, # optional
        "race":str, # optional
        "dietaryRestrictions": List[str] # optional
      }
    ```
  - Returns
    - Status code 204 if successful

- #### `<backend_ip>/beacon/user/nutritional-goals`
  - HTTP Method: `POST`
  - Description: Set nutritional goals for a user
  - Request body:
    - Content-type: application/json
    - JSON Schema:
    ```json
    {
      "user_id": "674f7d4c5b4425639bef8cd6",
      "daily_goals": {
        "calories": 2000,
        "carbs": 250,
        "protein": 150,
        "fiber": 30
      }
    }
    ```
  - Response:
    - (200) Successfully updated goals
    ```json
    {
      "success": true,
      "message": "Successfully updated nutritional goals",
      "daily_goals": {
        "calories": 2000,
        "carbs": 250,
        "protein": 150,
        "fiber": 30
      }
    }
    ```
    - (400) Missing or invalid input
    - (500) Internal Server error

- #### `<backend_ip>/beacon/user/nutritional-goals/<str:user_id>`
  - HTTP Method: `GET`
  - Description: Get nutritional goals for a user
  - Parameters:
    - `user_id`: str
  - Response:
    - (200) Successfully retrieved goals
    ```json
    {
      "success": true,
      "daily_goals": {
        "calories": 2000,
        "carbs": 250,
        "protein": 150,
        "fiber": 30
      }
    }
    ```
    - (400) Invalid request method
    - (500) Internal Server error
    - Status code 200 if successful

- #### `<backend_ip>/beacon/user/save-meal`
  - HTTP Method: `POST`
  - Description: Move a meal from temporary storage to permanent storage
  - Parameters:
    - ```json
      {
        "user_id":"67cbasdflsdafj293",
        "date:":"2025-04-08",
        "meal_id":"67cbasdfls324433"
      }
  - Response:
    - (200) Successfully saved meal
    ```json
    {
      "Message": "Meal was successfully moved to permanent storage"
    }
    ```
    - (400) Invalid request method
    - (403) Missing Parameters
    - (500) Internal Server error
    - Status code 200 if successful

- #### `<backend_ip>/beacon/user/delete-meal`
  - HTTP Method: `DELETE`
  - Description: Delete meal from permanent history
  - Parameters:
    - ```json
      {
        "user_id":"67cbasdflsdafj293",
        "date:":"2025-04-08",
        "meal_id":"67cbasdfls324433"
      }
  - Response:
    - (200) Successfully deleted meal
    ```json
    {
      "Message": "Meal was successfully deleted"
    }
    ```
    - (400) Invalid request method
    - (403) Missing Parameters
    - (500) Internal Server error
    - Status code 200 if successful
