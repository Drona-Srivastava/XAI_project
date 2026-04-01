import argparse
import json
import sys
from pathlib import Path

import requests


def load_cases(path: Path):
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("test_cases", [])


def post_json(base_url: str, endpoint: str, payload: dict, timeout: int):
    url = f"{base_url.rstrip('/')}/{endpoint.lstrip('/')}"
    response = requests.post(url, json=payload, timeout=timeout)
    return response.status_code, response.json() if response.content else {}


def validate_predict_response(body: dict):
    required = ["prediction", "probability"]
    missing = [key for key in required if key not in body]
    return missing


def validate_explain_response(body: dict):
    required = [
        "prediction",
        "probability",
        "summary",
        "plain_english",
        "risk_factors",
        "explanations",
        "next_steps",
    ]
    missing = [key for key in required if key not in body]
    return missing


def run_case(base_url: str, case: dict, timeout: int):
    name = case.get("name", "Unnamed Case")
    payload = case.get("input", {})

    result = {
        "name": name,
        "predict_ok": False,
        "explain_ok": False,
        "errors": [],
    }

    try:
        status, body = post_json(base_url, "/predict", payload, timeout)
        if status != 200:
            result["errors"].append(f"/predict returned HTTP {status}")
        else:
            missing = validate_predict_response(body)
            if missing:
                result["errors"].append(
                    f"/predict missing keys: {', '.join(missing)}"
                )
            else:
                result["predict_ok"] = True
    except Exception as ex:
        result["errors"].append(f"/predict request failed: {ex}")

    try:
        status, body = post_json(base_url, "/explain", payload, timeout)
        if status != 200:
            result["errors"].append(f"/explain returned HTTP {status}")
        else:
            missing = validate_explain_response(body)
            if missing:
                result["errors"].append(
                    f"/explain missing keys: {', '.join(missing)}"
                )
            else:
                result["explain_ok"] = True
    except Exception as ex:
        result["errors"].append(f"/explain request failed: {ex}")

    return result


def main():
    parser = argparse.ArgumentParser(
        description="Run Fraud XAI test cases against /predict and /explain endpoints."
    )
    parser.add_argument(
        "--base-url",
        default="https://xai-project-bla9.onrender.com",
        help="Backend API base URL",
    )
    parser.add_argument(
        "--cases-file",
        default="fraud_test_cases.json",
        help="Path to test cases JSON file",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=30,
        help="Request timeout in seconds",
    )
    args = parser.parse_args()

    cases_path = Path(args.cases_file)
    if not cases_path.exists():
        print(f"ERROR: cases file not found: {cases_path}")
        return 2

    cases = load_cases(cases_path)
    if not cases:
        print("ERROR: no test cases found in file")
        return 2

    print(f"Running {len(cases)} test case(s) against {args.base_url}")

    passed = 0
    for i, case in enumerate(cases, start=1):
        result = run_case(args.base_url, case, args.timeout)
        ok = result["predict_ok"] and result["explain_ok"]
        status = "PASS" if ok else "FAIL"
        print(f"[{i:02d}] {status} - {result['name']}")

        if not ok:
            for err in result["errors"]:
                print(f"      - {err}")
        else:
            passed += 1

    print("\nSummary")
    print(f"Passed: {passed}/{len(cases)}")
    print(f"Failed: {len(cases) - passed}/{len(cases)}")

    return 0 if passed == len(cases) else 1


if __name__ == "__main__":
    sys.exit(main())
