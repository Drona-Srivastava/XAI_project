from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import joblib
import dice_ml
from pathlib import Path
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
BASE_DIR = Path(__file__).resolve().parent

model = joblib.load(BASE_DIR / "xgb_model.pkl")
features = joblib.load(BASE_DIR / "features.pkl")

# ================= LOAD DATA FOR DICE =================
df = pd.read_csv(BASE_DIR / "fraud_sample.csv")

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
def _clean_type_name(col_name: str) -> str:
    return col_name.replace("type_", "").replace("_", " ").title()


def generate_human_explanation(query, cfs):
    explanations = []
    query = query.iloc[0]

    feature_map = {
        "amount": "Amount",
        "oldbalanceOrg": "Old original balance",
        "newbalanceOrig": "New original balance",
        "oldbalanceDest": "Old destination balance",
        "newbalanceDest": "New destination balance",
    }

    for i in range(len(cfs)):
        cf = cfs.iloc[i]
        changes_text = []

        for col in query.index:
            old_val = float(query[col])
            new_val = float(cf[col])

            if abs(old_val - new_val) <= 1e-3:
                continue

            if col.startswith("type_"):
                if new_val >= 0.5:
                    type_name = _clean_type_name(col)
                    changes_text.append(
                        f"If this was a {type_name} transaction, the model would likely change its decision."
                    )
                continue

            label = feature_map.get(col, col)
            direction = "increase" if new_val > old_val else "decrease"
            changes_text.append(
                f"A {direction} in {label.lower()} (from {old_val:.0f} to {new_val:.0f}) could change the result."
            )

        if not changes_text:
            changes_text = ["No strong single change was found in this scenario."]

        explanations.append({
            "scenario": i + 1,
            "explanation": changes_text,
        })

    return explanations


def generate_summary(prediction, probability, explanations):
    risk_keywords = set()

    for scenario in explanations:
        for change in scenario["explanation"]:
            lower_change = change.lower()
            if "amount" in lower_change:
                risk_keywords.add("unusual transaction amount")
            elif "original balance" in lower_change:
                risk_keywords.add("suspicious sender balance pattern")
            elif "destination balance" in lower_change:
                risk_keywords.add("suspicious receiver balance pattern")
            elif "cash out" in lower_change:
                risk_keywords.add("cash-out transaction behavior")
            elif "transfer" in lower_change:
                risk_keywords.add("transfer transaction behavior")

    risk_list = sorted(risk_keywords)

    if probability >= 0.8:
        confidence_note = "very high"
    elif probability >= 0.6:
        confidence_note = "high"
    elif probability >= 0.4:
        confidence_note = "medium"
    else:
        confidence_note = "low"

    if prediction == 1:
        summary = (
            f"Likely fraud. The model confidence is {confidence_note} "
            f"({probability:.2%})."
        )
        plain_english = (
            "In simple terms: this transaction has patterns that often appear in fraud cases."
        )
        next_steps = [
            "Verify the sender identity.",
            "Manually review transaction history.",
            "Hold or step-up authenticate before final approval.",
        ]
    else:
        summary = (
            f"Likely safe. The model confidence is {confidence_note} "
            f"({(1 - probability):.2%} for non-fraud)."
        )
        plain_english = (
            "In simple terms: this transaction looks similar to normal behavior."
        )
        next_steps = [
            "Proceed with normal checks.",
            "Keep standard monitoring enabled.",
        ]

    if risk_list:
        plain_english += " Main things the model noticed: " + ", ".join(risk_list) + "."

    return summary, plain_english, risk_list, next_steps


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
    summary, plain_english, risks, next_steps = generate_summary(
        prediction, probability, explanations
    )

    # ===== Final response =====
    return {
        "prediction": prediction,
        "probability": probability,
        "summary": summary,
        "plain_english": plain_english,
        "risk_factors": risks,
        "explanations": explanations,
        "next_steps": next_steps,
    }