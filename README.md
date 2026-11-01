# Inventory Management System

A full-stack starter project built with React, TypeScript, FastAPI, SQLite and Docker.

## Features
- Create, read, update and delete records through a REST API
- Search records
- Responsive dark-mode UI
- FastAPI interactive API docs
- Pytest CRUD tests
- SQLite persistence; no paid services required

## Run the backend
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```
API docs: http://127.0.0.1:8000/docs

## Run the frontend
Open a second terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open the Vite URL shown in the terminal.

## Run tests
```powershell
cd backend
pytest
```

## Tech stack
Python, FastAPI, REST APIs, SQLite/SQL, React, TypeScript, Vite, Pytest.

## Notes
This is an original portfolio starter, not a production-hardened system. Add authentication, PostgreSQL, stronger domain validation and deployment before using it as a production app. Update this README with screenshots and explain your own contributions.
