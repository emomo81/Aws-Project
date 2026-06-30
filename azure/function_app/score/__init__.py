"""
PHASE 3 - REST API (Azure Functions). This is the API Gateway + Lambda equivalent:
a public HTTP endpoint that forwards transactions to the Online Endpoint and keeps
the endpoint key server-side.

Deploy:
  1. Portal -> Create Function App (Python, Consumption plan).
  2. Add app settings ENDPOINT_URL and ENDPOINT_KEY (Endpoints -> Consume tab).
  3. Push this function (VS Code Azure Functions extension or `func azure functionapp publish`).

Call:
  POST https://<app>.azurewebsites.net/api/score
  body: {"features": [0.5, 0.3, 1.2, ...]}
"""
import os
import json
import urllib.request
import azure.functions as func


def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        body = req.get_json()
    except ValueError:
        return func.HttpResponse('{"error":"invalid JSON"}', status_code=400,
                                 mimetype="application/json")

    features = body.get("features")
    if not isinstance(features, list):
        return func.HttpResponse('{"error":"body must be {\\"features\\": [...]}"}',
                                 status_code=400, mimetype="application/json")

    payload = json.dumps({"input_data": {"data": [features]}}).encode()
    request = urllib.request.Request(
        os.environ["ENDPOINT_URL"],
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": "Bearer " + os.environ["ENDPOINT_KEY"],
        },
    )
    try:
        raw = urllib.request.urlopen(request).read().decode()
    except Exception as e:  # noqa: BLE001
        return func.HttpResponse(json.dumps({"error": str(e)}), status_code=502,
                                 mimetype="application/json")

    # Normalise the score into a friendly shape.
    try:
        score = json.loads(raw)
        prob = score[0] if isinstance(score, list) else score
    except Exception:  # noqa: BLE001
        prob = raw
    return func.HttpResponse(json.dumps({"fraud_probability": prob}),
                             mimetype="application/json")
