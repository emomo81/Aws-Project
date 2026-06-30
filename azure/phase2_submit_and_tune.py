"""
PHASE 2 - Training Jobs, Hyperparameter Tuning (Sweep), Experiments.

Creates a low-priority CPU cluster (autoscales to 0 = free when idle), submits
the XGBoost + NN training jobs, and launches an HPO sweep.

    python phase2_submit_and_tune.py
"""
from azure.ai.ml import command, Input
from azure.ai.ml.constants import AssetTypes
from azure.ai.ml.entities import AmlCompute
from azure.ai.ml.sweep import Choice, Uniform

from config import get_client, CPU_CLUSTER, PROCESSED_TRAIN

ml = get_client()

SKLEARN_ENV = "azureml://registries/azureml/environments/sklearn-1.5/labels/latest"


def ensure_cluster():
    try:
        ml.compute.get(CPU_CLUSTER)
        print("Cluster exists:", CPU_CLUSTER)
    except Exception:
        print("Creating low-priority cluster...")
        ml.compute.begin_create_or_update(AmlCompute(
            name=CPU_CLUSTER, size="Standard_DS3_v2",
            min_instances=0, max_instances=2,      # 0 = no cost when idle
            tier="LowPriority",                     # ~80% cheaper (spot)
            idle_time_before_scale_down=120,
        )).result()


def base_job(script: str, extra_cmd: str, inputs: dict, name: str):
    return command(
        code="./src",
        command=f"python {script} --data ${{{{inputs.data}}}} {extra_cmd}",
        inputs=inputs,
        environment=SKLEARN_ENV,
        compute=CPU_CLUSTER,
        experiment_name="fraud-training",
        display_name=name,
    )


def main():
    ensure_cluster()
    data = Input(type=AssetTypes.URI_FILE, path=f"azureml:{PROCESSED_TRAIN}@latest")

    # ---- Model 1: XGBoost ----
    xgb_job = base_job(
        "train.py",
        "--max_depth ${{inputs.max_depth}} --learning_rate ${{inputs.lr}}",
        {"data": data, "max_depth": 6, "lr": 0.1},
        "xgb-baseline",
    )
    r1 = ml.jobs.create_or_update(xgb_job)
    print("XGBoost job:", r1.name, "->", r1.studio_url)

    # ---- Model 2: Neural network ----
    nn_job = base_job(
        "train_nn.py",
        "--hidden ${{inputs.hidden}} --alpha ${{inputs.alpha}}",
        {"data": data, "hidden": 64, "alpha": 1e-4},
        "nn-baseline",
    )
    r2 = ml.jobs.create_or_update(nn_job)
    print("NN job:", r2.name, "->", r2.studio_url)

    # ---- HPO: Sweep over XGBoost hyperparameters ----
    sweep = xgb_job.sweep(
        sampling_algorithm="random",
        primary_metric="auc_pr",
        goal="Maximize",
    )
    sweep.search_space = {
        "max_depth": Choice([4, 6, 8, 10]),
        "lr": Uniform(0.01, 0.3),
    }
    sweep.set_limits(max_total_trials=12, max_concurrent_trials=2)
    sweep.experiment_name = "fraud-hpo"
    rs = ml.jobs.create_or_update(sweep)
    print("Sweep job:", rs.name, "->", rs.studio_url)
    print("\nWatch all three under Jobs in ml.azure.com.")


if __name__ == "__main__":
    main()
