# Fraud Detection MLOps — Azure Edition (Step-by-Step)

The **same end-to-end project as the AWS version**, rebuilt on **Azure Machine
Learning**, tuned for **Azure for Students** ($100 credit, no credit card, GPU
quota usually 0). Every phase below has: *where to click* → *what to do* → *code*.

> **Golden rule for students:** compute is what burns credit. **Stop your Compute
> Instance and delete Online Endpoints the moment you're done.** Train on small
> CPU or **low-priority** clusters. See the cost section at the end.

---

## AWS → Azure service map

| Assignment needs | AWS (SageMaker) | **Azure equivalent** |
|---|---|---|
| Object storage (raw/processed) | S3 | **Azure Blob Storage** (in the ML datastore) |
| Notebooks / processing | SageMaker Studio / Processing | **Azure ML Studio · Compute Instance · Jobs** |
| Feature Store | SageMaker Feature Store | **Azure ML Managed Feature Store** |
| Data validation | Model Monitor / Great Expectations | **Great Expectations** or **AzureML data monitor** |
| Training / HPO / Experiments | Training Jobs · HPO · Experiments | **AzureML Command Jobs · Sweep Jobs · MLflow** |
| Bias / explainability | Clarify | **Responsible AI dashboard** |
| Model registry + approval | Model Registry | **AzureML Model Registry** (+ stages/tags) |
| Real-time endpoint + autoscale | Real-time Endpoint | **Managed Online Endpoint** (+ autoscale) |
| Batch predictions | Batch Transform | **Batch Endpoint** |
| REST API | API Gateway + Lambda | **Azure Functions** → endpoint (or endpoint REST directly) |
| Pipeline orchestration | SageMaker Pipelines / Step Functions | **Azure ML Pipelines** |
| CI/CD | CodePipeline / CodeBuild | **GitHub Actions** or **Azure DevOps Pipelines** |
| Drift + quality monitoring | Model Monitor | **AzureML Model Monitoring** |
| Alerts | SNS | **Azure Monitor Action Group** (email/SMS) |
| Identity / least privilege | IAM | **Azure RBAC + Managed Identity** |
| Secrets / encryption | KMS | **Azure Key Vault** (auto-created) |
| Network isolation | VPC | **Azure VNet + Private Endpoints** |
| Dashboards | CloudWatch | **Azure Monitor / Application Insights** |
| Cost optimization | Savings Plans / Graviton | **Spot/Low-priority VMs · autoscale-to-zero · Reservations** |

---

## PART 0 — Setup (one-time)

### 0.1 Activate Azure for Students
1. Go to **https://azure.microsoft.com/free/students**.
2. **Start free** → sign in with your **school email** (no credit card needed).
3. You now have **$100 credit** + free services for 12 months.

### 0.2 Create a Resource Group
1. **portal.azure.com** → search **Resource groups** → **+ Create**.
2. Name: `rg-fraud-mlops` · Region: **(pick one close to you, e.g. South Africa North or West Europe)** → **Review + create**.

> Keep everything in **one region** — cross-region traffic costs money and adds latency.

### 0.3 Create the Azure Machine Learning Workspace
1. Portal → search **Azure Machine Learning** → **+ Create**.
2. Resource group `rg-fraud-mlops` · Workspace name `mlw-fraud` · same region.
3. Leave Storage / Key Vault / App Insights / Container Registry as **auto-create** (Azure makes them for you).
4. **Review + create** → **Create** (~3 min).
5. When done → **Launch studio** (or go to **https://ml.azure.com**).

### 0.4 Create a Compute Instance (your "notebook server")
1. In **ml.azure.com** → left menu **Compute** → **Compute instances** tab → **+ New**.
2. Name `ci-fraud` · Virtual machine type **CPU** · size **Standard_DS3_v2** (cheap, 4 cores).
3. **Create**. Wait until **Running**.
4. ⚠️ **Schedule auto-shutdown:** on the compute instance → enable **Idle shutdown** (e.g. 30 min) so it doesn't drain credit overnight.

### 0.5 Open a terminal / notebook and install the SDK
On the compute instance → **Notebooks** → open a **Terminal**:
```bash
pip install azure-ai-ml azure-identity mlflow azureml-mlflow \
            xgboost scikit-learn imbalanced-learn pandas great_expectations -q
```

### 0.6 Connect the SDK (used by every phase)
Create `connect.py` (or run at the top of each notebook):
```python
from azure.ai.ml import MLClient
from azure.identity import DefaultAzureCredential

# On a Compute Instance, DefaultAzureCredential signs in automatically.
ml_client = MLClient(
    DefaultAzureCredential(),
    subscription_id="<YOUR_SUBSCRIPTION_ID>",
    resource_group_name="rg-fraud-mlops",
    workspace_name="mlw-fraud",
)
print("Connected to:", ml_client.workspace_name)
```
> Find `subscription_id` in the Portal → your ML workspace → **Overview**.

---

## PART 1 — Phase 1: Data & Feature Engineering

**Goal:** raw + processed data in Blob Storage, EDA, engineered features, a Feature
Store, and a validation step.

### 1.1 Upload the dataset as a Data Asset (this is your "S3 raw/processed")
1. In **ml.azure.com** → **Data** → **+ Create** → **From local files**.
2. Upload `fraudTrain.csv` → name it `fraud_raw_train` → Finish. Repeat for test.

Or by code:
```python
from azure.ai.ml.entities import Data
from azure.ai.ml.constants import AssetTypes

raw = Data(
    path="fraudTrain.csv",
    type=AssetTypes.URI_FILE,
    name="fraud_raw_train",
    description="Raw fraud training data (Phase 1)",
)
ml_client.data.create_or_update(raw)
print("Registered raw data asset.")
```
This stores the file in the workspace's Blob datastore → the Azure equivalent of `s3://.../raw/`.

### 1.2 EDA + feature engineering
Run your existing Phase 1 pandas code in an Azure notebook **unchanged** — pandas,
matplotlib, sklearn all work the same. Save outputs:
```python
df_train.to_csv("processed_fraudTrain.csv", index=False)
df_test.to_csv("processed_fraudTest.csv", index=False)

# Register the processed data (the "processed/" folder)
proc = Data(path="processed_fraudTrain.csv", type=AssetTypes.URI_FILE,
            name="fraud_processed_train", description="Engineered features")
ml_client.data.create_or_update(proc)
```

### 1.3 Data validation with Great Expectations (the rubric's validation step)
```python
import great_expectations as gx, pandas as pd

df = pd.read_csv("processed_fraudTrain.csv")
ctx = gx.get_context()
batch = ctx.sources.add_pandas("p1").read_dataframe(df)

batch.expect_column_values_to_not_be_null("amt")
batch.expect_column_values_to_be_between("amt", min_value=0, max_value=50000)
batch.expect_column_values_to_be_in_set("is_fraud", [0, 1])

results = batch.validate()
print("Validation passed:", results.success)
```
Screenshot `results.success == True` — that's your Phase 1 validation evidence.

### 1.4 Managed Feature Store (online + offline)
1. **ml.azure.com** → **Feature stores** (under Manage) → **+ Create** → name `fs-fraud` → same region → Create.
2. Define a feature set in code:
```python
# featureset_spec.yaml describes the transformation + source.
# Simplest path for the assignment: register the processed table as an offline
# feature set, then enable materialization to the online store.
```
For the deadline, the **offline store is auto-backed by Blob**; enabling the
**online store** (Redis) is a toggle in the feature store's **Materialization**
settings. Screenshot the feature store + one feature set = requirement met.

> If the managed Feature Store feels heavy under time pressure, registering the
> engineered table as a versioned **Data Asset** (1.1) + documenting it as your
> offline feature store is an acceptable simplification — note it in the report.

---

## PART 2 — Phase 2: Model Development & Training

**Goal:** two models, HPO, experiment tracking (MLflow), explainability, registry.

### 2.1 Create a training script `train.py`
```python
# train.py
import argparse, mlflow, pandas as pd, xgboost as xgb
from sklearn.metrics import average_precision_score, roc_auc_score
from imblearn.over_sampling import SMOTE

p = argparse.ArgumentParser()
p.add_argument("--data", type=str)
p.add_argument("--max_depth", type=int, default=6)
p.add_argument("--learning_rate", type=float, default=0.1)
args = p.parse_args()

mlflow.autolog()                      # logs params/metrics/model to the workspace
df = pd.read_csv(args.data)
y = df["is_fraud"]; X = df.drop(columns=["is_fraud"])
X, y = SMOTE().fit_resample(X, y)     # handle imbalance

model = xgb.XGBClassifier(max_depth=args.max_depth,
                          learning_rate=args.learning_rate, eval_metric="aucpr")
model.fit(X, y)
proba = model.predict_proba(X)[:, 1]
mlflow.log_metric("auc_pr", average_precision_score(y, proba))
mlflow.log_metric("auc_roc", roc_auc_score(y, proba))
```

### 2.2 Submit it as a Command Job (the "Training Job")
```python
from azure.ai.ml import command, Input
from azure.ai.ml.constants import AssetTypes

job = command(
    code="./",                                  # folder with train.py
    command="python train.py --data ${{inputs.data}} "
            "--max_depth ${{inputs.max_depth}} --learning_rate ${{inputs.lr}}",
    inputs={
        "data": Input(type=AssetTypes.URI_FILE,
                      path="azureml:fraud_processed_train:1"),
        "max_depth": 6, "lr": 0.1,
    },
    environment="azureml://registries/azureml/environments/sklearn-1.5/labels/latest",
    compute="cpu-cluster",                      # created in 2.4
    experiment_name="fraud-xgboost",
    display_name="xgb-baseline",
)
returned = ml_client.jobs.create_or_update(job)
print("Track it here:", returned.studio_url)
```
Train **model 2 (a neural net / sklearn MLP)** the same way with a second
`train_nn.py` — that satisfies "at least two model types."

### 2.3 Hyperparameter tuning = Sweep Job (Azure's "HPO")
```python
from azure.ai.ml.sweep import Choice, Uniform

sweep = job.sweep(
    sampling_algorithm="random",
    primary_metric="auc_pr",
    goal="Maximize",
)
sweep.search_space = {
    "max_depth": Choice([4, 6, 8, 10]),
    "lr": Uniform(0.01, 0.3),
}
sweep.set_limits(max_total_trials=12, max_concurrent_trials=2)  # keep small = cheap
ml_client.jobs.create_or_update(sweep)
```
**Experiments** are automatic — every job shows under **Jobs** in the studio with metrics/charts.

### 2.4 Create the CPU training cluster (autoscale to zero = free when idle)
```python
from azure.ai.ml.entities import AmlCompute
ml_client.compute.begin_create_or_update(AmlCompute(
    name="cpu-cluster", size="Standard_DS3_v2",
    min_instances=0, max_instances=2,           # 0 = no cost when idle
    tier="LowPriority",                          # ~80% cheaper (spot)
    idle_time_before_scale_down=120,
)).result()
```

### 2.5 Explainability (Clarify equivalent = Responsible AI dashboard)
In **ml.azure.com** → **Models** → your model → **Responsible AI** → **+ Create** →
add **Explanations** + **Error analysis** components → run. Screenshot the SHAP-style
importance plot. (Or log SHAP yourself with `mlflow.log_figure`.)

### 2.6 Register the best model (with versioning + approval tags)
```python
from azure.ai.ml.entities import Model
m = ml_client.models.create_or_update(Model(
    path="azureml://jobs/<BEST_JOB_NAME>/outputs/artifacts/model",
    name="fraud-model", type=AssetTypes.MLFLOW_MODEL,
    tags={"stage": "staging", "approval": "pending"},   # approval workflow
))
print("Registered:", m.name, "v", m.version)
```
**Approval workflow:** change the tag `approval: approved` (or move the stage) once
reviewed — screenshot before/after for the rubric.

---

## PART 3 — Phase 3: Deployment

### 3.1 Real-time Managed Online Endpoint
```python
from azure.ai.ml.entities import (ManagedOnlineEndpoint, ManagedOnlineDeployment)

ep_name = "fraud-endpoint"
ml_client.online_endpoints.begin_create_or_update(
    ManagedOnlineEndpoint(name=ep_name, auth_mode="key")).result()

dep = ManagedOnlineDeployment(
    name="blue", endpoint_name=ep_name,
    model="azureml:fraud-model:1",
    instance_type="Standard_DS3_v2",   # CPU, student-friendly
    instance_count=1,
)
ml_client.online_deployments.begin_create_or_update(dep).result()
ml_client.online_endpoints.begin_create_or_update(
    ManagedOnlineEndpoint(name=ep_name, traffic={"blue": 100})).result()
print("Endpoint live.")
```
Verify: **ml.azure.com** → **Endpoints** → status **Succeeded**. Screenshot.

### 3.2 Test the live endpoint
```python
import json
result = ml_client.online_endpoints.invoke(
    endpoint_name=ep_name,
    request_file="sample.json",   # {"input_data": {"data": [[...feature row...]]}}
)
print(result)
```

### 3.3 Autoscaling
**Endpoints** → `fraud-endpoint` → **blue** deployment → **Scaling** → add a rule
(metric: CPU > 70% → add instance; min 1, max 3). Screenshot the rule.

### 3.4 Batch Endpoint (the "Batch Transform")
```python
from azure.ai.ml.entities import BatchEndpoint, BatchDeployment
ml_client.batch_endpoints.begin_create_or_update(
    BatchEndpoint(name="fraud-batch")).result()
ml_client.batch_deployments.begin_create_or_update(BatchDeployment(
    name="batch-blue", endpoint_name="fraud-batch",
    model="azureml:fraud-model:1", compute="cpu-cluster",
    instance_count=1, max_concurrency_per_instance=2,
)).result()
```
Run it against a folder of CSVs → predictions land in Blob. Screenshot the job.

### 3.5 REST API (Azure Functions → endpoint)
This is the API Gateway + Lambda equivalent. Quickest path:
1. Portal → **Create a resource** → **Function App** → Runtime **Python** · **Consumption (Serverless)** plan (cheap) · same RG.
2. Add an **HTTP trigger** function. Paste:
```python
import azure.functions as func
import os, json, urllib.request

def main(req: func.HttpRequest) -> func.HttpResponse:
    body = req.get_json()
    data = json.dumps({"input_data": {"data": [body["features"]]}}).encode()
    r = urllib.request.Request(
        os.environ["ENDPOINT_URL"], data=data,
        headers={"Content-Type": "application/json",
                 "Authorization": "Bearer " + os.environ["ENDPOINT_KEY"]})
    score = urllib.request.urlopen(r).read().decode()
    return func.HttpResponse(score, mimetype="application/json")
```
3. **Configuration** → add `ENDPOINT_URL` + `ENDPOINT_KEY` (from Endpoints → Consume tab).
4. Copy the Function URL → that's your public REST API. Test it. Screenshot.

> Your **SentinelAI Inbox** Next.js app's `/api/score` route already does this same
> proxy job — point it at the Azure endpoint instead of SageMaker and you're done.

---

## PART 4 — Phase 4: MLOps & Automation

### 4.1 Azure ML Pipeline (validation → preprocess → train → eval → register)
```python
from azure.ai.ml import dsl, Input

@dsl.pipeline(compute="cpu-cluster", description="Fraud MLOps pipeline")
def fraud_pipeline(data_input):
    validate = validate_component(data=data_input)
    prep     = prep_component(data=data_input)
    train    = train_component(data=prep.outputs.processed)
    evaluate = eval_component(model=train.outputs.model)
    register = register_component(model=train.outputs.model,
                                  metrics=evaluate.outputs.metrics)
    return {"model": register.outputs.registered}

pipe = fraud_pipeline(Input(path="azureml:fraud_processed_train:1"))
ml_client.jobs.create_or_update(pipe, experiment_name="fraud-pipeline")
```
Watch the DAG run green in **Jobs → Pipeline**. Screenshot — prime Phase 4 evidence.

### 4.2 CI/CD with GitHub Actions (CodePipeline equivalent)
Add `.github/workflows/azure-ml.yml`:
```yaml
name: Azure ML CI/CD
on:
  push: { branches: [main] }
  workflow_dispatch:          # manual approval trigger
jobs:
  train-and-register:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: azure/login@v2
        with: { creds: ${{ secrets.AZURE_CREDENTIALS }} }
      - name: Run AzureML pipeline
        run: |
          pip install azure-ai-ml azure-identity
          python run_pipeline.py    # submits the pipeline above
```
Create `AZURE_CREDENTIALS` with `az ad sp create-for-rbac --sdk-auth` and add it to
GitHub **Secrets**. Screenshot a green workflow run.

### 4.3 Model Monitoring (data drift + quality)
**ml.azure.com** → **Monitoring** → **+ Create** → target your `fraud-endpoint` →
enable **Data drift** + **Prediction drift** → set baseline = training data →
schedule **Daily**. Screenshot the monitor config.

### 4.4 Alerts (SNS equivalent = Azure Monitor Action Group)
1. Portal → **Monitor** → **Alerts** → **Action groups** → **+ Create**.
2. Name `ag-fraud-alerts` → **Notifications** → **Email** → your address.
3. Create an **Alert rule** on the drift metric → when drift > threshold → use `ag-fraud-alerts`.
4. **Confirm the email subscription** Azure sends you. Screenshot.

---

## PART 5 — Phase 5: Production Considerations

### 5.1 Identity & least privilege (IAM equivalent = RBAC + Managed Identity)
- Your ML workspace already has a **system-assigned Managed Identity** — endpoints
  use it instead of stored keys.
- Portal → workspace → **Access control (IAM)** → assign **AzureML Data Scientist**
  (not Owner) to teammates. Screenshot the role assignment = least privilege.

### 5.2 Encryption & secrets
- The auto-created **Key Vault** stores secrets/keys. Storage is **encrypted at rest by default**.
- Put `ENDPOINT_KEY` etc. in Key Vault, reference from the Function App. Screenshot the Key Vault.

### 5.3 Network isolation (VPC equivalent)
- For the report: note that the workspace can run **VNet-isolated** with **Private
  Endpoints** + **managed network isolation** (a workspace toggle). You don't have
  to fully lock it down under deadline — just document the option.

### 5.4 Monitoring dashboard (CloudWatch equivalent)
- Portal → **Monitor** → **Dashboards** → **+ New** → add tiles:
  endpoint **Request latency**, **Requests per minute**, **CPU**, plus the drift
  metric and an **Azure Cost** tile. Save. Screenshot = required dashboard.

### 5.5 Cost analysis + optimization (≥2 techniques) — **critical for students**
| Technique | How |
|---|---|
| 🟢 **Autoscale to zero** | Training cluster `min_instances=0` (2.4) → $0 when idle |
| 🟢 **Low-priority / Spot VMs** | `tier="LowPriority"` → up to ~80% cheaper for training |
| 🟢 **Delete online endpoint between demos** | Online endpoints bill hourly — `ml_client.online_endpoints.begin_delete("fraud-endpoint")` |
| 🟢 **Stop the Compute Instance** | Idle-shutdown (0.4); stop manually when done |
| 🟢 **Right-size** | CPU `Standard_DS3_v2`, not GPU (you have no GPU quota anyway) |
| 🟢 **Cost Management budget** | Portal → **Cost Management** → **Budgets** → set a $20 alert |

Pull your real numbers from **Cost Management → Cost analysis** and put them in the report.

---

## Deliverables (same as AWS version)
1. **GitHub repo** — notebooks, `train.py`, pipeline scripts, GitHub Actions workflow.
2. **Architecture diagram** — reuse `architecture_diagram.svg` but swap labels to the
   Azure column of the service map above.
3. **Report (≤12 slides)** — architecture, model performance, monitoring, **cost
   breakdown (your $100 credit usage)**, challenges, future work.

---

## Suggested order for your week
**Day 1:** Part 0 + Phase 1. **Day 2:** Phase 2 (jobs + sweep + registry). **Day 3:**
Phase 3 (online + batch + Function API). **Day 4:** Phase 4 (pipeline + CI/CD + monitor
+ alerts). **Day 5:** Phase 5 (RBAC + dashboard + cost). **Day 6:** report + diagram.
**Day 7:** rehearse demo — redeploy the endpoint right before presenting, delete after.

> 💡 **Cheapest demo trick:** keep the endpoint **deleted** all week. Redeploy it
> (3.1, ~6 min) only when you're about to present, then delete it again. Your $100
> will easily cover the whole project this way.
