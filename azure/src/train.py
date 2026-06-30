"""
Model 1 - XGBoost. This script runs INSIDE an Azure ML Command/Sweep Job.
MLflow autolog sends params, metrics, and the model to the workspace.
"""
import argparse
import mlflow
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import average_precision_score, roc_auc_score, f1_score
from imblearn.over_sampling import SMOTE


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--data", type=str, required=True)
    p.add_argument("--max_depth", type=int, default=6)
    p.add_argument("--learning_rate", type=float, default=0.1)
    p.add_argument("--n_estimators", type=int, default=300)
    args = p.parse_args()

    mlflow.autolog()
    df = pd.read_csv(args.data).fillna(0)
    y = df["is_fraud"]
    X = df.drop(columns=["is_fraud"])
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

    # Handle class imbalance on the training split only
    X_tr, y_tr = SMOTE(random_state=42).fit_resample(X_tr, y_tr)

    model = xgb.XGBClassifier(
        max_depth=args.max_depth,
        learning_rate=args.learning_rate,
        n_estimators=args.n_estimators,
        eval_metric="aucpr",
        n_jobs=-1,
    )
    model.fit(X_tr, y_tr)

    proba = model.predict_proba(X_te)[:, 1]
    pred = (proba >= 0.5).astype(int)
    mlflow.log_metric("auc_pr", average_precision_score(y_te, proba))
    mlflow.log_metric("auc_roc", roc_auc_score(y_te, proba))
    mlflow.log_metric("f1", f1_score(y_te, pred))
    print("Done. AUC-PR =", average_precision_score(y_te, proba))


if __name__ == "__main__":
    main()
