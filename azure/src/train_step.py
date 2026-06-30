"""Pipeline step 2 - train XGBoost and save the model to the output folder."""
import argparse
import os
import mlflow
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import SMOTE


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--data", required=True)
    p.add_argument("--model_out", required=True)
    args = p.parse_args()

    df = pd.read_csv(args.data).fillna(0)
    y = df["is_fraud"]
    X = df.drop(columns=["is_fraud"])
    X_tr, _, y_tr, _ = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    X_tr, y_tr = SMOTE(random_state=42).fit_resample(X_tr, y_tr)

    model = xgb.XGBClassifier(max_depth=6, learning_rate=0.1, n_estimators=300,
                              eval_metric="aucpr", n_jobs=-1)
    model.fit(X_tr, y_tr)

    os.makedirs(args.model_out, exist_ok=True)
    mlflow.sklearn.save_model(model, os.path.join(args.model_out, "model"))
    print("Model saved to", args.model_out)


if __name__ == "__main__":
    main()
