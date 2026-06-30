"""
PHASE 2 - Register the best model with versioning + an approval workflow.

Pass the best job name (from the sweep's best trial, shown in the studio):
    python phase2_register.py <BEST_JOB_NAME>

Approval workflow: the model is registered with tags stage=staging, approval=pending.
After review, run with --approve to flip it to approved (your "model approval workflow").
    python phase2_register.py <JOB_NAME> --approve
"""
import argparse
from azure.ai.ml.entities import Model
from azure.ai.ml.constants import AssetTypes

from config import get_client, MODEL_NAME

ml = get_client()


def main():
    p = argparse.ArgumentParser()
    p.add_argument("job_name")
    p.add_argument("--approve", action="store_true")
    args = p.parse_args()

    approval = "approved" if args.approve else "pending"
    stage = "production" if args.approve else "staging"

    model = Model(
        path=f"azureml://jobs/{args.job_name}/outputs/artifacts/model",
        name=MODEL_NAME,
        type=AssetTypes.MLFLOW_MODEL,
        description="Best fraud model from HPO sweep",
        tags={"stage": stage, "approval": approval, "source_job": args.job_name},
    )
    out = ml.models.create_or_update(model)
    print(f"Registered {out.name}:{out.version}  (stage={stage}, approval={approval})")


if __name__ == "__main__":
    main()
