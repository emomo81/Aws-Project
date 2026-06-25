# Cost Analysis & Optimization

Region: **af-south-1 (Cape Town)**. All figures are **estimates** based on AWS
on-demand pricing at time of writing — confirm against the
[SageMaker pricing page](https://aws.amazon.com/sagemaker/pricing/) and your own
**Cost Explorer** before quoting in the final report. Prices in USD.

> Rates below are illustrative (af-south-1 carries a modest premium over
> us-east-1). Replace the `Rate` column with the exact numbers from the pricing
> page for your instances.

---

## 1. Cost Breakdown by Component

| Component | Service / Instance | Rate (USD/hr) | Usage | Est. Cost |
|-----------|--------------------|--------------:|-------|----------:|
| Studio notebook (dev) | `ml.t3.medium` | 0.058 | 20 hr | $1.16 |
| Training job (XGBoost) | `ml.m5.xlarge` | 0.27 | 0.3 hr | $0.08 |
| Hyperparameter tuning | `ml.m5.xlarge` × 5 jobs | 0.27 | 1.5 hr | $0.41 |
| Clarify processing | `ml.m5.xlarge` | 0.27 | 0.3 hr | $0.08 |
| **Real-time endpoint** | `ml.m5.xlarge` | 0.27 | 24 hr | **$6.48** |
| Batch Transform | `ml.m5.large` | 0.135 | 0.2 hr | $0.03 |
| SageMaker Pipeline run | `ml.m5.xlarge` | 0.27 | 0.5 hr | $0.14 |
| Model Monitor schedule | `ml.m5.xlarge` (hourly) | 0.27 | 4 hr | $1.08 |
| Lambda | requests + GB-s | — | <1 M req | ~$0.00 (free tier) |
| API Gateway | per million calls | $3.50 / M | <10 k calls | ~$0.04 |
| S3 storage | Standard | $0.025 / GB-mo | ~2 GB | $0.05 |
| SNS | email notifications | — | <1 k | ~$0.00 (free tier) |
| CloudWatch | dashboards + metrics | $3.00 / dashboard-mo | 1 | $3.00 |
| **Estimated total (demo week)** | | | | **≈ $12.60** |

> **The real-time endpoint is the dominant, ongoing cost.** It bills per hour
> *even when idle*. Leaving a single `ml.m5.xlarge` endpoint running for a full
> month would cost **≈ $195/month** on its own — hence the optimizations below.

---

## 2. Cost-Optimization Techniques (≥2 required)

### ✅ Technique 1 — Graviton (ARM) inference instances
Redeploy the endpoint on Graviton (`ml.c7g.large` / `ml.m7g.large`) instead of
Intel `ml.m5.xlarge`. Graviton delivers comparable throughput for XGBoost at
**~20% lower hourly cost** and better price/performance.

```python
predictor = xgb_sm.deploy(
    initial_instance_count=1,
    instance_type="ml.c7g.large",   # Graviton ARM — cheaper than ml.m5.xlarge
    endpoint_name="fraud-detection-endpoint",
)
```

### ✅ Technique 2 — Multi-Model Endpoint (host both models on one endpoint)
Instead of one endpoint per model, host XGBoost **and** the deep-learning model
behind a single **Multi-Model Endpoint (MME)**. Models share the same compute,
cutting hosting cost roughly in half versus two dedicated endpoints. (Also counts
toward the bonus challenge.)

```python
from sagemaker.multidatamodel import MultiDataModel
mme = MultiDataModel(
    name="fraud-mme",
    model_data_prefix=f"s3://{bucket}/{prefix}/mme-models/",
    model=xgb_sm, sagemaker_session=session,
)
predictor = mme.deploy(initial_instance_count=1, instance_type="ml.m5.large")
```

### ✅ Technique 3 — Auto-scaling + scheduled teardown
- Auto-scaling (already configured in Phase 3) scales instances down at low
  traffic so you don't pay for idle peak capacity.
- **Delete the endpoint between demos** and redeploy on demand — the single
  biggest saver for a student project. Stop the JupyterLab space when idle.

```python
# Tear down when done to stop hourly billing
import boto3
sm = boto3.client("sagemaker")
sm.delete_endpoint(EndpointName="fraud-detection-endpoint")
sm.delete_endpoint_config(EndpointConfigName="fraud-detection-endpoint")
```

### (Bonus) Technique 4 — Savings Plans / Serverless Inference
For sustained production use, a 1-year **SageMaker Savings Plan** discounts
compute up to ~64%. For spiky, low-volume traffic, **Serverless Inference**
removes idle cost entirely (pay per request).

---

## 3. Cost Hygiene Checklist

- [ ] Endpoint deleted when not demoing
- [ ] JupyterLab space stopped at end of session
- [ ] Training/tuning jobs use right-sized instances (not oversized)
- [ ] Model Monitor schedule paused after grading
- [ ] CloudWatch dashboard deleted after submission ($3/mo each)
- [ ] S3 lifecycle rule to expire old `batch-output/` artifacts
- [ ] Set an **AWS Budgets** alert (e.g. $20) to catch surprises
