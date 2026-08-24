# AI-Based Task Manager (Backend)

This directory contains the robust backend API and AI orchestration layer for the AI-Based Task Manager application. It handles user authentication, database persistence, and integrates with large language models to interpret user intent.

## 🛠️ Tech Stack

- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database ORM:** [SQLModel](https://sqlmodel.tiangolo.com/)
- **Database Engine:** [PostgreSQL](https://www.postgresql.org/) (Neon)
- **Authentication:** [Better Auth](https://www.better-auth.com/)
- **AI Models:** Integrates with Mistral (via OpenRouter/Groq endpoints).

## ✨ Key Features

- **Agentic AI Service:** Contains a sophisticated `agent_service.py` that translates natural language from the user into structured JSON tool calls (e.g., `add_task`, `list_tasks`) to manipulate the database on behalf of the user.
- **BYOK Configuration Engine:** Allows individual users to inject their own API keys via the database, securely encrypted at rest using AES-256 Fernet symmetric encryption.
- **RESTful API:** Clean, strongly-typed endpoints for standard CRUD operations on tasks.
- **Strict Anti-Hallucination Measures:** The AI logic is carefully prompted to ensure it verifies database records before confirming actions to the user.

## 🚀 Getting Started

### Prerequisites
Make sure you have Python 3.10+ installed. A PostgreSQL database is also required (local or cloud-hosted).

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   # On macOS/Linux:
   python -m venv venv
   source venv/bin/activate
   
   # On Windows:
   python -m venv venv
   venv\Scripts\activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables:
   Copy `.env.example` to `.env` and fill in your `DATABASE_URL`, `LLM_API_KEY`, and authentication secrets.
   ```bash
   cp .env.example .env
   ```
   **Important Note on Encryption:** The backend requires an `ENCRYPTION_KEY` to securely store user-provided API keys (BYOK feature). Generate one using the following command and add it to your `.env` file:
   ```bash
   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
   ```

### Development Server
Run the local FastAPI development server:
```bash
uvicorn src.main:app --reload
```
The API will be available at `http://localhost:8000`. 
You can view the interactive API documentation (Swagger UI) at [http://localhost:8000/docs](http://localhost:8000/docs).

## 📁 Directory Structure
- `/src/api`: API route definitions and controller logic.
- `/src/models`: Database schema models defined with SQLModel.
- `/src/services`: Core business logic, including the AI agent processing pipeline.
- `/src/core`: Configuration and dependency injection setup.
