# BEACON of Hope 🌟

A context-aware meal recommendation system designed to help users make informed and healthy decisions about their meals, with a special focus on individuals with diabetes and those of African-American descent. The system provides personalized meal plans by analyzing user preferences, dietary restrictions, and health goals through the use of ontologies.

## 🎯 Key Features

- Personalized meal recommendations based on health conditions and demographics
- Interactive meal exploration and categorization
- Visual comparison of nutritional information
- Health condition-aware filtering system

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (for frontend)
- [Python](https://www.python.org/) (for backend)
- [Pipx](https://pipx.pypa.io/) (for managing Python packages)
- [Poetry](https://python-poetry.org/) (for Python dependency management)

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/SCCapstone/beacon-of-hope.git
   cd beacon-of-hope
   ```

2. **Set up the Frontend**
   ```bash
   cd frontend
   npm install
   ```

3. **Set up the Backend**
   ```bash
   cd back-end
   poetry install
   poetry shell
   ```

## 🏃‍♂️ Running the Application

1. **Start the Backend Server**

   _Note_: The backend commands assume that the shell is activated. Otherwise, please prefix `poetry run` to the python commands.

   ```bash
   cd back-end
   python manage.py runserver
   ```

2. **Start the Frontend Development Server**
   ```bash
   cd front-end
   npm run dev
   ```

## 🧪 Testing

- Frontend tests can be found in `frontend/tests` and run using:
  ```bash
  cd frontend

  npm run test
  ```

- Backend tests can be found in `backend/tests` and run using:
  ```bash
  cd backend
  poetry run python manage.py test tests
  ```

## 📁 Project Structure
```
.
├── front-end/          # React + TypeScript frontend
├── back-end/           # Django backend
└── misc/               # Documentation and design assets
```

## 👥 Meet the Development Team

- [Vansh Nagpal](https://vnagpal25.github.io) - 2002vansh@gmail.com
- [Nitin Gupta](https://g-nitin.github.io/portfolio/) - niting1209@gmail.com
- [Zach Abdulrahman](https://zachabdulrahman.me) - zja@email.sc.edu
- [Andy Davison](https://andrewdavison.dev) - ajd8@email.sc.edu

## 👥 Meet our Mentors

- [Biplav Srivastava (Client)](https://sites.google.com/site/biplavsrivastava/) - biplav.s@sc.edu
- [Jose M. Vidal (Capstone Instructor)](https://jmvidal.cse.sc.edu/) - vidal@sc.edu


## 📝 Documentation

For more detailed information about the project:
- [Frontend Documentation](./front-end/README.md)
- [Backend Documentation](./back-end/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request (merge your feature branch into our main branch)

### Note

This project was completed as a part of the meal/group recommendation research effort carried out by the [AI 4 Society Research Group (AI4S)](https://ai4society.github.io/)
