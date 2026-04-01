# Fraud XAI 

This repository is now structured so frontend and backend can be deployed from the same GitHub repo.

## Structure

- `frontend/` - Vite + React UI
- `backend/` - FastAPI fraud prediction + explainability API
- `dice.ipynb`, `main.ipynb` - notebooks for experimentation
- `fraud.csv`, `fraud_ai_system_doc.docx` - reference assets

## Local Development

### 1) Run backend

```bash
cd backend
pip install -r requirements.txt
uvicorn api:app --reload --host localhost --port 8000
```

**Access the API:**

- Interactive docs: https://xai-project-bla9.onrender.com/docs
- API base: https://xai-project-bla9.onrender.com

### 2) Run frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend automatically connects to `http://localhost:8000` by default for testing.

## Deployment from Same Repo

### Frontend deployment target

- Root directory: `frontend`
- Build command: `npm run build`
- Publish directory (if needed): `dist`

### Backend deployment target

- Root directory: `backend`
- Start command: `uvicorn api:app --host 0.0.0.0 --port $PORT`
- Install command: `pip install -r requirements.txt`

## Backend Changes & Impact on Results

### What Changed in `/explain` Endpoint

The `/explain` endpoint now returns human-readable explanations instead of raw technical field diffs. This **does not change prediction accuracy**, but **significantly improves user comprehension**:

#### Before (Technical):

```
"amount changes from 1000 → 0"
"type_TRANSFER changes from 0 → 1"
```

#### After (Human-Friendly):

```
"A decrease in amount (from 1000 to 0) could change the result."
"If this was a Transfer transaction, the model would likely change its decision."
```

### New Fields in `/explain` Response

| Field             | Impact                                                                           |
| ----------------- | -------------------------------------------------------------------------------- |
| `plain_english`   | Simple one-sentence interpretation for non-technical users                       |
| `next_steps`      | Actionable recommendations (verify sender, step-up auth, proceed normally, etc.) |
| `confidence_note` | Easy wording (low/medium/high/very high) instead of raw probability              |
| `risk_factors`    | Summarized, non-technical risk indicators                                        |

### Why This Matters

- **Prediction logic unchanged:** XGBoost model & DiCE counterfactuals work identically
- **User action changes:** Analysts can now act confidently on results without ML expertise
- **False positive reduction:** Better understanding of _why_ a transaction flagged fraud