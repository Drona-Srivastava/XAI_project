# Fraud XAI Monorepo

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

- Interactive docs: http://localhost:8000/docs
- API base: http://localhost:8000

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

## Deployment: Render (Backend) + Vercel (Frontend)

### Backend Deployment on Render

1. **Push code to GitHub:**

   ```bash
   git add .
   git commit -m "Fraud XAI backend with human explanations"
   git push
   ```

2. **Create Render Web Service:**
   - Go to https://render.com
   - Click **New → Web Service**
   - Connect your GitHub repo
   - Set **Root Directory** to `backend`
   - Set **Build Command:** `pip install -r requirements.txt`
   - Set **Start Command:** `uvicorn api:app --host 0.0.0.0 --port $PORT`

3. **Environment variables (if needed):**
   - None required for basic setup

4. **Deploy:**
   - Click **Create Web Service**
   - Wait for build to complete (~2 mins)
   - Your backend URL will be: `https://your-service-name.onrender.com`

5. **Test:**
   - Visit: `https://your-service-name.onrender.com/docs`
   - Try `/predict` and `/explain` endpoints

### Frontend Deployment on Vercel

1. **Prepare environment:**
   - In `frontend/.env.production` (create if missing):
     ```
     VITE_API_BASE_URL=https://your-backend-name.onrender.com
     ```

2. **Push code to GitHub** (if not already done):

   ```bash
   git add frontend/.env.production
   git commit -m "Add production API URL"
   git push
   ```

3. **Deploy to Vercel:**
   - Go to https://vercel.com
   - Click **Add New → Project**
   - Import your GitHub repo
   - Set **Root Directory** to `frontend`
   - Set **Build Command:** `npm run build`
   - Set **Output Directory:** `dist`

4. **Environment variables:**
   - In Vercel dashboard under **Settings → Environment Variables**, add:
     - `VITE_API_BASE_URL=https://your-backend-name.onrender.com`

5. **Deploy:**
   - Click **Deploy**
   - Wait for build (~1-2 mins)
   - Your frontend URL will be: `https://your-project-name.vercel.app`

6. **Test:**
   - Visit your Vercel URL
   - Try analyzing a transaction
   - Verify it connects to your Render backend

### Post-Deployment Checklist

- [ ] Backend running on Render
- [ ] Backend `/docs` page accessible
- [ ] Frontend running on Vercel
- [ ] Frontend can reach backend (check browser console for errors)
- [ ] Test transaction analysis end-to-end
- [ ] Update README with your live URLs

### Rollback or Redeploy

**Render:** Any `git push` to main redeploys automatically  
**Vercel:** Same—redeploys on each push or manual redeploy from dashboard
