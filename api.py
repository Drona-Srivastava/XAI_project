from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import joblib
import dice_ml
from dice_ml import Dice

app = FastAPI()

# 🔓 Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= LOAD MODEL =================
model = joblib.load("xgb_model.pkl")
features = joblib.load("features.pkl")

# ================= LOAD DATA FOR DICE =================
df = pd.read_csv("fraud.csv")

df = df.drop(['nameOrig', 'nameDest', 'step', 'isFlaggedFraud'], axis=1, errors='ignore')
df = pd.get_dummies(df, columns=['type'], drop_first=True)

df = df.astype(float)
df = df.reindex(columns=features + ['isFraud'], fill_value=0)
df = df.fillna(0)

# ================= DICE SETUP =================
data_dice = dice_ml.Data(
    dataframe=df,
    continuous_features=features,
    outcome_name='isFraud'
)

# 🔥 FIX precision bug
def safe_get_decimal_precisions(self, output_type="list"):
    return [2] * len(self.data_df.columns)

data_dice.get_decimal_precisions = safe_get_decimal_precisions.__get__(data_dice)

model_dice = dice_ml.Model(model=model, backend="sklearn")
dice = Dice(data_dice, model_dice, method="genetic")


# ================= HELPER FUNCTION =================
def generate_human_explanation(query, cfs):
    explanations = []

    query = query.iloc[0]

    feature_map = {
        "amount": "Transaction Amount",
        "oldbalanceOrg": "Sender Balance",
        "newbalanceOrig": "Sender Balance After Transaction",
        "oldbalanceDest": "Receiver Balance Before",
        "newbalanceDest": "Receiver Balance After",
        "type_TRANSFER": "Transfer Transaction",
        "type_CASH_OUT": "Cash Out Transaction",
        "type_DEBIT": "Debit Transaction",
        "type_PAYMENT": "Payment Transaction"
    }

    for i in range(len(cfs)):
        cf = cfs.iloc[i]
        changes_text = []

        for col in query.index:
            if abs(query[col] - cf[col]) > 1e-3:
                name = feature_map.get(col, col)

                # 🔥 SPECIAL HANDLING FOR TYPES
                if "type_" in col:
                    if cf[col] == 1:
                        changes_text.append(f"Change transaction type to {name.replace(' Transaction','')}")
                else:
                    changes_text.append(
                        f"{name} changes from {int(query[col])} → {int(cf[col])}"
                    )

        explanations.append({
            "scenario": i + 1,
            "explanation": changes_text
        })

    return explanations

def generate_summary(prediction, explanations):
    risk_keywords = set()

    for scenario in explanations:
        for change in scenario["explanation"]:
            if "Amount" in change:
                risk_keywords.add("large or unusual transaction amounts")
            elif "Sender Balance" in change:
                risk_keywords.add("low or zero sender balance")
            elif "Receiver Balance" in change:
                risk_keywords.add("irregular receiver balance changes")
            elif "Cash Out" in change:
                risk_keywords.add("cash-out type transactions")
            elif "Transfer" in change:
                risk_keywords.add("transfer type transactions")

    risk_list = list(risk_keywords)

    if prediction == 0:
        summary = "This transaction appears SAFE. It follows normal patterns."

        if risk_list:
            summary += " Fraud usually happens when there are: " + ", ".join(risk_list) + "."

    else:
        summary = "⚠️ This transaction appears SUSPICIOUS."

        if risk_list:
            summary += " It shows risky patterns such as: " + ", ".join(risk_list) + "."

    return summary, risk_list


# ================= ROUTE 1: PREDICT =================
@app.post("/predict")
def predict(data: dict):
    df_input = pd.DataFrame([data])

    df_input = pd.get_dummies(df_input)

    df_input = df_input.reindex(columns=features, fill_value=0)
    df_input = df_input.astype(float)

    prediction = int(model.predict(df_input)[0])
    prob = model.predict_proba(df_input)[0][1]

    if prediction == 0:
        message = "This transaction appears safe. Fraud typically occurs when:"
    else:
        message = "This transaction appears suspicious. It could be safer if:"

    return {
        "prediction": prediction,
        "probability": float(prob),
        "message": message
    }


# ================= ROUTE 2: EXPLAIN =================
@app.post("/explain")
def explain(data: dict):
    # ===== Prepare input =====
    df_input = pd.DataFrame([data])

    df_input = pd.get_dummies(df_input)
    df_input = df_input.reindex(columns=features, fill_value=0)
    df_input = df_input.astype(float)

    # ===== Prediction =====
    prediction = int(model.predict(df_input)[0])
    probability = float(model.predict_proba(df_input)[0][1])

    # ===== Generate Counterfactuals =====
    cf = dice.generate_counterfactuals(
        df_input,
        total_CFs=3,
        desired_class="opposite"
    )

    cf_df = cf.cf_examples_list[0].final_cfs_df

    # ===== Human-readable explanations =====
    explanations = generate_human_explanation(df_input, cf_df)

    # ===== Generate summary =====
    summary, risks = generate_summary(prediction, explanations)

    # ===== Final response =====
    return {
        "prediction": prediction,
        "probability": probability,
        "summary": summary,
        "risk_factors": risks,
        "explanations": explanations
    }