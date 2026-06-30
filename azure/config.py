"""
Shared connection helper for every phase.

Fill in your three values once (or set them as environment variables) and every
script imports `get_client()` from here.

Find these in the Azure portal -> your ML workspace -> Overview.
"""
import os
from azure.ai.ml import MLClient
from azure.identity import DefaultAzureCredential

SUBSCRIPTION_ID = os.environ.get("AZ_SUBSCRIPTION_ID", "<YOUR_SUBSCRIPTION_ID>")
RESOURCE_GROUP = os.environ.get("AZ_RESOURCE_GROUP", "rg-fraud-mlops")
WORKSPACE = os.environ.get("AZ_WORKSPACE", "mlw-fraud")

# Names reused across phases — change here if you want different names.
CPU_CLUSTER = "cpu-cluster"
ONLINE_ENDPOINT = "fraud-endpoint"
BATCH_ENDPOINT = "fraud-batch"
MODEL_NAME = "fraud-model"
PROCESSED_TRAIN = "fraud_processed_train"
PROCESSED_TEST = "fraud_processed_test"


def get_client() -> MLClient:
    """Return an authenticated MLClient. On a Compute Instance, sign-in is automatic."""
    client = MLClient(
        DefaultAzureCredential(),
        subscription_id=SUBSCRIPTION_ID,
        resource_group_name=RESOURCE_GROUP,
        workspace_name=WORKSPACE,
    )
    return client


if __name__ == "__main__":
    ml = get_client()
    print("Connected to workspace:", ml.workspace_name)
