"""
PHASE 5 - Production: cost guardrails + governance helpers.

Most of Phase 5 (RBAC, Key Vault, VNet, dashboards) is configured in the portal
(see AZURE_GUIDE.md Part 5). This script does the two things worth automating:
  1. Create a Cost Management budget with an email alert (protects your $100 credit).
  2. Print the least-privilege RBAC + encryption checklist for the report.

A budget needs the azure-mgmt-consumption SDK; if it's not installed the script
prints the equivalent `az` CLI command instead.

    python phase5_governance_cost.py
"""
from config import SUBSCRIPTION_ID, RESOURCE_GROUP


def print_budget_cli():
    print("Create a $20 budget with an 80% email alert via Azure CLI:\n")
    print(f"""az consumption budget create \\
  --budget-name fraud-mlops-budget \\
  --amount 20 \\
  --category Cost \\
  --time-grain Monthly \\
  --start-date $(date +%Y-%m-01) \\
  --end-date 2027-01-01 \\
  --resource-group {RESOURCE_GROUP}

Then add an email alert in: Portal -> Cost Management -> Budgets -> fraud-mlops-budget
-> Alert conditions (80% -> your email).
""")


def checklist():
    print("""
PHASE 5 governance checklist (screenshot each for the report):
  [ ] RBAC: teammates assigned 'AzureML Data Scientist' (NOT Owner)  -> least privilege
  [ ] Managed Identity used by endpoints (no stored creds)
  [ ] Key Vault holds ENDPOINT_KEY / secrets (auto-created with the workspace)
  [ ] Storage encryption at rest = ON by default (show the Storage account -> Encryption)
  [ ] Cost Management budget + alert active
  [ ] Monitor dashboard: latency, requests, CPU, drift, cost
  [ ] (Optional) VNet + Private Endpoint documented as the isolation strategy
""")


if __name__ == "__main__":
    print(f"Subscription: {SUBSCRIPTION_ID}\nResource group: {RESOURCE_GROUP}\n")
    print_budget_cli()
    checklist()
