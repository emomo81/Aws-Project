"""
PHASE 3 - Batch Endpoint (the "Batch Transform" equivalent) for monthly scoring.

    python phase3_batch.py            # create batch endpoint + deployment
    python phase3_batch.py --run      # score a registered data asset in bulk

Batch endpoints spin compute up only while a job runs, then back to 0 -> cheap.
"""
import argparse
from azure.ai.ml import Input
from azure.ai.ml.constants import AssetTypes
from azure.ai.ml.entities import BatchEndpoint, BatchDeployment

from config import get_client, BATCH_ENDPOINT, MODEL_NAME, CPU_CLUSTER, PROCESSED_TEST

ml = get_client()


def create():
    ml.batch_endpoints.begin_create_or_update(
        BatchEndpoint(name=BATCH_ENDPOINT, description="Monthly bulk fraud scoring")
    ).result()

    model = ml.models.get(MODEL_NAME, label="latest")
    dep = BatchDeployment(
        name="batch-blue", endpoint_name=BATCH_ENDPOINT,
        model=model.id, compute=CPU_CLUSTER,
        instance_count=1, max_concurrency_per_instance=2,
    )
    ml.batch_deployments.begin_create_or_update(dep).result()

    ep = ml.batch_endpoints.get(BATCH_ENDPOINT)
    ep.defaults = {"deployment_name": "batch-blue"}
    ml.batch_endpoints.begin_create_or_update(ep).result()
    print("Batch endpoint ready:", BATCH_ENDPOINT)


def run():
    job = ml.batch_endpoints.invoke(
        endpoint_name=BATCH_ENDPOINT,
        input=Input(type=AssetTypes.URI_FILE, path=f"azureml:{PROCESSED_TEST}@latest"),
    )
    print("Batch job submitted:", job.name)
    print("Predictions will be written to the endpoint's default datastore output.")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--run", action="store_true")
    a = p.parse_args()
    run() if a.run else create()
