# Azure ML — Runnable Files for All 5 Phases

Companion code to [`../AZURE_GUIDE.md`](../AZURE_GUIDE.md). Upload this whole
`azure/` folder to your Azure ML **Compute Instance** and run the scripts in order.

## Setup (once)
```bash
pip install -r requirements.txt
# edit config.py: set AZ_SUBSCRIPTION_ID (or export it), resource group, workspace
python config.py        # should print: Connected to workspace: mlw-fraud
```

## Run order

| Phase | Command | What it does |
|------|---------|--------------|
| **1** | `python phase1_data_and_features.py` | EDA + features, registers raw/processed Data Assets |
| **1** | `python phase1_validate.py` | Great Expectations data validation |
| **2** | `python phase2_submit_and_tune.py` | Creates cluster, submits XGBoost + NN jobs + HPO sweep |
| **2** | `python phase2_register.py <BEST_JOB>` | Registers best model (approval=pending) |
| **2** | `python phase2_register.py <BEST_JOB> --approve` | Flips to approved (approval workflow) |
| **3** | `python phase3_deploy_online.py` | Real-time online endpoint |
| **3** | `python phase3_deploy_online.py --test` | Invoke the live endpoint |
| **3** | `python phase3_batch.py` then `--run` | Batch endpoint + bulk scoring |
| **3** | deploy `function_app/` | REST API (Azure Functions) → endpoint |
| **4** | `python phase4_pipeline.py` | validate→train→evaluate→register pipeline |
| **4** | `python phase4_monitoring_alerts.py` | Drift monitor + alert setup steps |
| **4** | `.github/workflows/azure-ml.yml` | CI/CD (copy to repo root to activate) |
| **5** | `python phase5_governance_cost.py` | Budget + governance checklist |

## File tree
```
azure/
├── config.py                     # shared MLClient connection
├── requirements.txt
├── phase1_data_and_features.py
├── phase1_validate.py
├── phase2_submit_and_tune.py
├── phase2_register.py
├── phase3_deploy_online.py
├── phase3_batch.py
├── phase4_pipeline.py
├── phase4_monitoring_alerts.py
├── phase5_governance_cost.py
├── src/                          # scripts that run INSIDE jobs/pipeline steps
│   ├── train.py                  # XGBoost (Command/Sweep job)
│   ├── train_nn.py               # Neural net (2nd model type)
│   ├── step_validate.py          # pipeline step 1
│   ├── train_step.py             # pipeline step 2
│   └── eval_step.py              # pipeline step 3
├── function_app/                 # Phase 3 REST API (Azure Functions)
│   ├── host.json
│   ├── requirements.txt
│   └── score/{__init__.py, function.json}
└── .github/workflows/azure-ml.yml  # Phase 4 CI/CD
```

## 💸 Student-credit reminders
- Training cluster is **LowPriority, min_instances=0** → free when idle.
- **Delete the online endpoint between demos:** `python phase3_deploy_online.py --delete`
- **Stop your Compute Instance** when you stop working.
- Set the **$20 budget** (phase 5) early.
