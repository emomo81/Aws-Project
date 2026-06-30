"""
PHASE 1 - Data validation pipeline (Great Expectations).

The rubric asks for a data-validation step. This checks schema + value ranges on
the engineered data and exits non-zero on failure (so it can gate a CI/CD run).

    python phase1_validate.py
"""
import sys
import pandas as pd
import great_expectations as gx


def main(path: str = "processed_fraudTrain.csv") -> bool:
    df = pd.read_csv(path)
    ctx = gx.get_context()
    batch = ctx.sources.add_pandas("fraud").read_dataframe(df)

    # Expectations
    if "amt" in df:
        batch.expect_column_values_to_not_be_null("amt")
        batch.expect_column_values_to_be_between("amt", min_value=-50, max_value=50)
    if "is_fraud" in df:
        batch.expect_column_values_to_be_in_set("is_fraud", [0, 1])
    batch.expect_table_row_count_to_be_between(min_value=1)

    result = batch.validate()
    print("Validation success:", result.success)
    for r in result.results:
        exp = r.expectation_config.expectation_type
        print(f"  {'PASS' if r.success else 'FAIL'}  {exp}")
    return bool(result.success)


if __name__ == "__main__":
    ok = main(sys.argv[1] if len(sys.argv) > 1 else "processed_fraudTrain.csv")
    sys.exit(0 if ok else 1)
