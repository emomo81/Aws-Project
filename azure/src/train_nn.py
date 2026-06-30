"""
Model 2 - Neural network (sklearn MLP, CPU-friendly so it works on the student
GPU-less quota). Satisfies the "at least two different model types" requirement.
Runs INSIDE an Azure ML Command Job.
"""
import argparse
import mlflow
import pandas as pd
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import average_precision_score, roc_auc_score, f1_score
from imblearn.over_sampling import SMOTE


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--data", type=str, required=True)
    p.add_argument("--hidden", type=int, default=64)
    p.add_argument("--alpha", type=float, default=1e-4)
    args = p.parse_args()

    mlflow.autolog()
    df = pd.read_csv(args.data).fillna(0)
    y = df["is_fraud"]
    X = df.drop(columns=["is_fraud"])
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    X_tr, y_tr = SMOTE(random_state=42).fit_resample(X_tr, y_tr)

    model = MLPClassifier(
        hidden_layer_sizes=(args.hidden, args.hidden // 2),
        alpha=args.alpha, max_iter=60, early_stopping=True, random_state=42,
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
