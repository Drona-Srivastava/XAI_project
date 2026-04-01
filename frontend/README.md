# Fraud XAI Frontend

Frontend for the Fraud Detection and Explainable AI system.

## API

Default backend base URL:

`http://localhost:8000`

Endpoints used:

- `POST /predict`
- `POST /explain`

The UI sends these features in JSON:

- `amount`
- `oldbalanceOrg`
- `newbalanceOrig`
- `oldbalanceDest`
- `newbalanceDest`
- `type_TRANSFER`
- `type_CASH_OUT`
- `type_DEBIT`
- `type_PAYMENT`

## Environment Variable

You can override the API base URL with:

- `VITE_API_BASE_URL`

Example `.env` file:

`VITE_API_BASE_URL=http://localhost:8000`

When you deploy, set it back to your hosted backend URL, for example:

`VITE_API_BASE_URL=https://fraud-xai-api.onrender.com`

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
