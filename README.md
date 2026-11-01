# my-binder

A Pokémon card binder: import your own photos or look up cards online. React (Vite) frontend + FastAPI backend.

## Run

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000 · API docs: http://localhost:8000/docs
The dev server proxies `/api/*` to the backend.
