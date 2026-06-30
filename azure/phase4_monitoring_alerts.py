"""
PHASE 4 - Model Monitoring (data + prediction drift) with email alerts.

This sets up an AzureML monitoring schedule against the online endpoint. The
alerting (SNS equivalent) is an Azure Monitor Action Group — created in the portal
(steps printed below) because Action Groups live in Azure Monitor, not AzureML.

    python phase4_monitoring_alerts.py
"""
from azure.ai.ml.entities import (
    MonitorSchedule, MonitorDefinition, MonitoringTarget,
    ServerlessSparkCompute, RecurrenceTrigger,
)
from azure.ai.ml.constants import MonitorTargetTasks

from config import get_client, ONLINE_ENDPOINT

ml = get_client()


def main():
    # Daily monitoring job over the endpoint's collected data.
    monitor_def = MonitorDefinition(
        compute=ServerlessSparkCompute(runtime_version="3.4", instance_type="standard_e4s_v3"),
        monitoring_target=MonitoringTarget(
            ml_task=MonitorTargetTasks.CLASSIFICATION,
            endpoint_deployment_id=f"azureml:{ONLINE_ENDPOINT}:blue",
        ),
    )
    schedule = MonitorSchedule(
        name="fraud-drift-monitor",
        trigger=RecurrenceTrigger(frequency="day", interval=1),
        create_monitor=monitor_def,
    )
    try:
        ml.schedules.begin_create_or_update(schedule).result()
        print("Monitoring schedule 'fraud-drift-monitor' created (daily).")
    except Exception as e:  # noqa: BLE001
        print("Could not auto-create monitor (enable data collection on the "
              "deployment first). Set it up in Studio -> Monitoring. Detail:", e)

    print("""
NEXT - create the email alert (Azure Monitor Action Group):
  1. Portal -> Monitor -> Alerts -> Action groups -> + Create
       Name: ag-fraud-alerts   Notification: Email -> your address
  2. Portal -> Monitor -> Alerts -> + Create alert rule
       Scope: your ML workspace
       Condition: custom log/metric on drift (or endpoint 5xx / latency)
       Action: ag-fraud-alerts
  3. Confirm the subscription email Azure sends you.
""")


if __name__ == "__main__":
    main()
