"""
PHASE 1 - Data & Feature Engineering (Azure ML)

Run on the Compute Instance after placing fraudTrain.csv / fraudTest.csv next to
this file. Produces engineered CSVs and registers them as versioned Data Assets
(the Azure equivalent of S3 raw/ and processed/).

    python phase1_data_and_features.py
"""
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
from azure.ai.ml.entities import Data
from azure.ai.ml.constants import AssetTypes

from config import get_client, PROCESSED_TRAIN, PROCESSED_TEST

ml = get_client()


def register(path: str, name: str, desc: str):
    asset = Data(path=path, type=AssetTypes.URI_FILE, name=name, description=desc)
    out = ml.data.create_or_update(asset)
    print(f"Registered data asset {out.name}:{out.version}")
    return out


def engineer(df: pd.DataFrame) -> pd.DataFrame:
    """Feature engineering — mirrors the AWS Phase 1 notebook."""
    df = df.copy()
    if "trans_date_trans_time" in df:
        ts = pd.to_datetime(df["trans_date_trans_time"], errors="coerce")
        df["hour"] = ts.dt.hour
        df["day_num"] = ts.dt.dayofweek
        df["month_num"] = ts.dt.month
        df["is_weekend"] = (df["day_num"] >= 5).astype(int)
        df["is_night"] = ((df["hour"] >= 0) & (df["hour"] <= 4)).astype(int)
        df["is_peak_hours"] = ((df["hour"] >= 18) & (df["hour"] <= 22)).astype(int)
    if "amt" in df:
        df["log_amt"] = np.log1p(df["amt"])
        df["amt_zscore"] = (df["amt"] - df["amt"].mean()) / (df["amt"].std() + 1e-9)
    if "city_pop" in df:
        df["log_city_pop"] = np.log1p(df["city_pop"])
        df["is_small_city"] = (df["city_pop"] < 10000).astype(int)
    return df


def main():
    train = pd.read_csv("fraudTrain.csv")
    test = pd.read_csv("fraudTest.csv")

    # Register RAW (the "raw/" folder)
    register("fraudTrain.csv", "fraud_raw_train", "Raw fraud training data")
    register("fraudTest.csv", "fraud_raw_test", "Raw fraud test data")

    # Combine for consistent encoding, then engineer
    train["_split"], test["_split"] = "train", "test"
    df = pd.concat([train, test], ignore_index=True)
    df = engineer(df)

    # Encode categoricals
    for col in ["gender", "category"]:
        if col in df:
            df[col + "_enc"] = LabelEncoder().fit_transform(df[col].astype(str))

    feature_cols = [c for c in [
        "amt", "log_amt", "amt_zscore", "log_city_pop", "is_small_city",
        "hour", "day_num", "month_num", "is_weekend", "is_night", "is_peak_hours",
        "gender_enc", "category_enc",
    ] if c in df]

    keep = feature_cols + (["is_fraud"] if "is_fraud" in df else [])
    df_train = df[df["_split"] == "train"][keep].copy()
    df_test = df[df["_split"] == "test"][keep].copy()

    # Scale numeric features
    num = [c for c in ["amt", "log_amt", "amt_zscore", "log_city_pop"] if c in df_train]
    scaler = StandardScaler()
    df_train[num] = scaler.fit_transform(df_train[num])
    df_test[num] = scaler.transform(df_test[num])

    df_train = df_train.fillna(0)
    df_test = df_test.fillna(0)
    df_train.to_csv("processed_fraudTrain.csv", index=False)
    df_test.to_csv("processed_fraudTest.csv", index=False)

    # Register PROCESSED (the "processed/" folder)
    register("processed_fraudTrain.csv", PROCESSED_TRAIN, "Engineered training features")
    register("processed_fraudTest.csv", PROCESSED_TEST, "Engineered test features")

    print("\nPhase 1 complete.")
    print("  Train shape:", df_train.shape, "| Features:", len(feature_cols))


if __name__ == "__main__":
    main()
