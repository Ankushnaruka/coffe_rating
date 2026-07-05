# ☕ Coffee Rating Application

A full-stack asynchronous web application that allows users to submit coffee roasts and upvote their favorites. Built with high concurrency in mind, this project demonstrates modern **FastAPI** backend patterns, atomic **MongoDB** updates, and a responsive **React** frontend.

---

## ✨ Features

* **View Top Coffees:** Automatically sorts the coffee list by the highest number of votes.
* **Add New Coffees:** Submit custom coffee names, roast levels (Light, Medium, Dark), and origins.
* **Real-time Upvoting:** Vote for any coffee item with instantaneous, optimistic UI state updates.
* **Race-Condition Safe:** Uses MongoDB's atomic `$inc` operator to ensure accurate vote counts even under heavy concurrent traffic.
* **Non-Blocking I/O:** Fully asynchronous database operations powered by `motor`.

---

## 🛠 Tech Stack

### **Backend**

* **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.9+)
* **Database Driver:** [Motor](https://motor.readthedocs.io/) (Asynchronous Python driver for MongoDB)
* **Validation & Serialization:** [Pydantic v2](https://www.google.com/search?q=https://docs.pydantic.dev/)
* **Server:** Uvicorn (ASGI)

### **Frontend**

* **Library:** [React](https://react.dev/) (Functional Components + Hooks)
* **HTTP Client:** Native Fetch API

### **Database**

* **Engine:** MongoDB (Local or Atlas)

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed on your machine:

* **Python** 3.9 or higher
* **Node.js** v16 or higher
* **MongoDB** running locally on port `27017` (or a connection string to MongoDB Atlas)

---

### 1. Backend Setup

1. **Navigate to your project directory and create a virtual environment:**
```bash
mkdir coffee-app && cd coffee-app
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

```


2. **Install dependencies:**
```bash
pip install fastapi uvicorn motor pydantic

```


3. **Save your backend code:**
Save the FastAPI application script as `main.py` (ensure you have included the CORS middleware so the React frontend can communicate with it).
4. **Start the API server:**
```bash
uvicorn main:app --reload --port 8000

```


*The backend will run at `http://localhost:8000`.*
*Interactive API Docs (Swagger UI) are available at `http://localhost:8000/docs`.*

---

### 2. Frontend Setup

1. **Create a new React project** (using Vite is recommended):
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install

```


2. **Add the component code:**
Replace the contents of `src/App.jsx` with the Coffee Rating React component. Ensure the `API_BASE_URL` matches your running backend (`http://localhost:8000/api/coffees`).
3. **Start the React development server:**
```bash
npm run dev

```


*Open the URL shown in your terminal (typically `http://localhost:5173` or `http://localhost:3000`) to view the app.*

---

## 📡 API Endpoints

| Method | Endpoint | Description | Request Body |
| --- | --- | --- | --- |
| `GET` | `/api/coffees` | Retrieve all coffees, sorted by votes descending. | None |
| `POST` | `/api/coffees` | Create a new coffee item initialized with 0 votes. | `{"name": "...", "roast": "...", "origin": "..."}` |
| `POST` | `/api/coffees/{id}/vote` | Atomically increment the vote count for a coffee by 1. | None |

---

## 🧠 Key Architecture Highlights

* **Atomic `$inc` Operations:** Standard read-modify-write patterns (`count = count + 1`) introduce race conditions when two users click vote simultaneously. This app uses `db.coffees.find_one_and_update({"_id": id}, {"$inc": {"votes": 1}})` so the database engine handles concurrent increments safely at the storage layer.
* **Lifespan Context Manager:** Replaces deprecated startup/shutdown events in FastAPI to establish the MongoDB connection pool once when the server boots and clean it up gracefully on termination.
* **ID Mapping:** MongoDB uses `_id` while frontend APIs typically prefer `id`. The backend handles this cleanly via Pydantic field aliases (`Field(alias="_id")`) and `response_model_by_alias=False`.
