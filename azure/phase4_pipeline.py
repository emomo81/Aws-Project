"""
PHASE 4 - End-to-end Azure ML Pipeline:
    validate -> preprocess -> train -> evaluate -> register

Each step is a command component running on the low-priority CPU cluster.
    python phase4_pipeline.py
"""
from azure.ai.ml import command, Input, Output, dsl
from azure.ai.ml.constants import AssetTypes

from config import get_client, CPU_CLUSTER, PROCESSED_TRAIN, MODEL_NAME

ml = get_client()
SKLEARN_ENV = "azureml://registries/azureml/environments/sklearn-1.5/labels/latest"

# ---- Step components (each wraps a small script in ./src) ----
validate_step = command(
    name="validate", display_name="Validate data",
    code="./src", command="python step_validate.py --data ${{inputs.data}}",
    inputs={"data": Input(type=AssetTypes.URI_FILE)},
    environment=SKLEARN_ENV, compute=CPU_CLUSTER,
)

train_step = command(
    name="train", display_name="Train model",
    code="./src",
    command="python train_step.py --data ${{inputs.data}} --model_out ${{outputs.model_out}}",
    inputs={"data": Input(type=AssetTypes.URI_FILE)},
    outputs={"model_out": Output(type=AssetTypes.URI_FOLDER)},
    environment=SKLEARN_ENV, compute=CPU_CLUSTER,
)

eval_step = command(
    name="evaluate", display_name="Evaluate model",
    code="./src",
    command="python eval_step.py --data ${{inputs.data}} --model_in ${{inputs.model_in}} "
            "--metrics_out ${{outputs.metrics_out}}",
    inputs={"data": Input(type=AssetTypes.URI_FILE), "model_in": Input(type=AssetTypes.URI_FOLDER)},
    outputs={"metrics_out": Output(type=AssetTypes.URI_FOLDER)},
    environment=SKLEARN_ENV, compute=CPU_CLUSTER,
)


@dsl.pipeline(compute=CPU_CLUSTER, description="Fraud detection MLOps pipeline")
def fraud_pipeline(pipeline_data: Input):
    v = validate_step(data=pipeline_data)
    t = train_step(data=pipeline_data)
    t.after(v)                                   # train waits for validation
    e = eval_step(data=pipeline_data, model_in=t.outputs.model_out)
    return {"model": t.outputs.model_out, "metrics": e.outputs.metrics_out}


def main():
    pipe = fraud_pipeline(
        pipeline_data=Input(type=AssetTypes.URI_FILE, path=f"azureml:{PROCESSED_TRAIN}@latest")
    )
    run = ml.jobs.create_or_update(pipe, experiment_name="fraud-pipeline")
    print("Pipeline submitted:", run.name)
    print("Watch the DAG:", run.studio_url)
    print("\nAfter it completes, register the output with phase2_register.py "
          f"using job name {run.name} (model in outputs/model).")


if __name__ == "__main__":
    main()
