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

- #### `<backend_ip>/beacon/get-food-info/<int:food_id>`
  - HTTP Method: `GET`
  - Parameters (no request body)
    - food_id (integer string representative of food item)
  - Returns a JSON string which is the [R3 representation](https://github.com/vnagpal25/BEACON/blob/main/example_r3.json) of food item consisting of ingredients, instructions, macronutrients, meal roles, etc.
- #### `<backend_ip>/beacon/get-bev-info/<int:bev_id>`
  - HTTP Method: `GET`
  - Parameters (no request body)
    - bev_id (integer string representative of food item)
  - Returns:
    - a JSON string consisting of the requested beverage (for now just the name)
