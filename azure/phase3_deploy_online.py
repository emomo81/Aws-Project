"""
PHASE 3 - Real-time Managed Online Endpoint (+ autoscaling) and a live test.

    python phase3_deploy_online.py            # create + deploy
    python phase3_deploy_online.py --test     # invoke the live endpoint
    python phase3_deploy_online.py --delete    # tear down (do this to save credit!)

Online endpoints bill per hour while they exist -> delete between demos.
"""
import argparse
import json
from azure.ai.ml.entities import (
    ManagedOnlineEndpoint, ManagedOnlineDeployment,
)

from config import get_client, ONLINE_ENDPOINT, MODEL_NAME

ml = get_client()


def deploy():
    ml.online_endpoints.begin_create_or_update(
        ManagedOnlineEndpoint(name=ONLINE_ENDPOINT, auth_mode="key",
                              description="Real-time fraud scoring")
    ).result()

    model = ml.models.get(MODEL_NAME, label="latest")
    dep = ManagedOnlineDeployment(
        name="blue", endpoint_name=ONLINE_ENDPOINT,
        model=model.id,
        instance_type="Standard_DS3_v2",   # CPU, student-friendly
        instance_count=1,
    )
    ml.online_deployments.begin_create_or_update(dep).result()

    ep = ml.online_endpoints.get(ONLINE_ENDPOINT)
    ep.traffic = {"blue": 100}
    ml.online_endpoints.begin_create_or_update(ep).result()
    print("Endpoint live:", ep.scoring_uri)
    print("NOTE: configure autoscale in Studio -> Endpoints -> blue -> Scaling,")
    print("      or via az monitor autoscale (see AZURE_GUIDE.md 3.3).")


def test():
    # Build a sample request matching your processed feature count.
    sample = {"input_data": {"data": [[0.5, 0.3, 1.2, 8.1, 0, 14, 2, 6, 0, 0, 1, 1, 3]]}}
    with open("sample.json", "w") as f:
        json.dump(sample, f)
    out = ml.online_endpoints.invoke(endpoint_name=ONLINE_ENDPOINT, request_file="sample.json")
    print("Prediction:", out)


def delete():
    ml.online_endpoints.begin_delete(ONLINE_ENDPOINT).result()
    print("Deleted endpoint:", ONLINE_ENDPOINT)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--test", action="store_true")
    p.add_argument("--delete", action="store_true")
    a = p.parse_args()
    if a.delete:
        delete()
    elif a.test:
        test()
    else:
        deploy()
