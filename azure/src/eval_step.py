"""Pipeline step 3 - evaluate the trained model and write metrics."""
import argparse
import json
import os
import mlflow
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import average_precision_score, roc_auc_score, f1_score


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--data", required=True)
    p.add_argument("--model_in", required=True)
    p.add_argument("--metrics_out", required=True)
    args = p.parse_args()

    model = mlflow.sklearn.load_model(os.path.join(args.model_in, "model"))
    df = pd.read_csv(args.data).fillna(0)
    y = df["is_fraud"]
    X = df.drop(columns=["is_fraud"])
    _, X_te, _, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

    proba = model.predict_proba(X_te)[:, 1]
    pred = (proba >= 0.5).astype(int)
    metrics = {
        "auc_pr": float(average_precision_score(y_te, proba)),
        "auc_roc": float(roc_auc_score(y_te, proba)),
        "f1": float(f1_score(y_te, pred)),
    }
    for k, v in metrics.items():
        mlflow.log_metric(k, v)

    os.makedirs(args.metrics_out, exist_ok=True)
    with open(os.path.join(args.metrics_out, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)
    print("Metrics:", metrics)


if __name__ == "__main__":
    main()
