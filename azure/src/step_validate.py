"""Pipeline step 1 - data validation. Exits non-zero on failure to gate the run."""
import argparse
import sys
import pandas as pd


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--data", required=True)
    args = p.parse_args()

    df = pd.read_csv(args.data)
    checks = {
        "has_rows": len(df) > 0,
        "has_label": "is_fraud" in df.columns,
        "label_binary": set(df.get("is_fraud", pd.Series([0, 1])).unique()).issubset({0, 1}),
        "no_all_null": not df.isna().all().any(),
    }
    for name, ok in checks.items():
        print(f"  {'PASS' if ok else 'FAIL'}  {name}")
    if not all(checks.values()):
        print("Validation FAILED")
        sys.exit(1)
    print("Validation PASSED")


if __name__ == "__main__":
    main()
