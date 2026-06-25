<div align="center">

# 🛡️ SentinelAI

### Real-Time Fraud Intelligence Platform

**Product Requirements Document (PRD)**

`v1.0` · `Status: Draft → Review` · `Owner: Data Science Team` · `Last updated: 2026-06-25`

![Platform](https://img.shields.io/badge/platform-AWS%20SageMaker-ff9900)
![Type](https://img.shields.io/badge/type-MLOps%20Product-3b48cc)
![Stage](https://img.shields.io/badge/stage-MVP-3b9c5a)
![License](https://img.shields.io/badge/license-Academic-8245d6)

</div>

---

> **One-liner:** SentinelAI scores every transaction for fraud risk in under 200 ms,
> lets analysts review and act on flagged cases from a single dashboard, and keeps
> itself honest with automatic drift detection — so fraud teams catch more, faster,
> with less manual work.

---

## 📑 Table of Contents

1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Non-Goals](#3-goals--non-goals)
4. [Target Users & Personas](#4-target-users--personas)
5. [User Stories](#5-user-stories)
6. [Product Scope & Features](#6-product-scope--features)
7. [User Experience & Screens](#7-user-experience--screens)
8. [System Architecture](#8-system-architecture)
9. [Functional Requirements](#9-functional-requirements)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Success Metrics](#11-success-metrics)
12. [Milestones & Timeline](#12-milestones--timeline)
13. [Risks & Mitigations](#13-risks--mitigations)
14. [Open Questions](#14-open-questions)
15. [Appendix](#15-appendix)

---

## 1. Overview

| | |
|---|---|
| **Product name** | SentinelAI |
| **Category** | Fraud detection · MLOps · Risk analytics |
| **Primary platform** | Web application (analyst dashboard) + REST API |
| **Deployed on** | Amazon Web Services (SageMaker, Lambda, API Gateway) |
| **Business model** | Internal risk tool for a financial / telecom provider |
| **Document status** | Draft for stakeholder review |

SentinelAI is an end-to-end machine learning **product**, not just a model. It pairs
a high-accuracy fraud model with the operational surfaces a real fraud team needs:
a real-time scoring API, a review dashboard, batch reporting, and self-monitoring
that alerts the team the moment the model starts to drift.

---

## 2. Problem Statement

Fraud teams today are stuck between two bad options:

- **Rules engines** are fast but brittle — fraudsters learn the rules and route around them.
- **Manual review** is accurate but doesn't scale — analysts drown in alerts and miss the real ones.

Meanwhile, the business bleeds money on two fronts at once:

| Pain | Cost |
|------|------|
| 🔴 **Missed fraud** (false negatives) | Direct financial loss + chargebacks |
| 🟡 **False alarms** (false positives) | Blocked legitimate customers → churn + support load |
| 🟠 **Silent model decay** | Yesterday's model quietly fails on today's fraud patterns |

**SentinelAI's bet:** a continuously-monitored ML system that scores in real time,
ranks alerts by risk, and tells you when it needs retraining — beats both rules and
raw manual review.

---

## 3. Goals & Non-Goals

### ✅ Goals
- Score any transaction for fraud probability in **real time** (< 200 ms p95).
- Give analysts a **single dashboard** to triage, filter, and action flagged transactions.
- Support **batch scoring** for periodic / historic review.
- **Automatically detect data drift and model decay** and alert the team.
- Be **secure, cost-efficient, and fully automated** (CI/CD + retraining pipeline).

### 🚫 Non-Goals (v1)
- Automated money-movement / account freezing (human stays in the loop).
- Multi-tenant SaaS billing.
- Mobile native apps (web-responsive only).
- Cross-border regulatory case management.

---

## 4. Target Users & Personas

| Persona | Role | Needs | Key screen |
|--------|------|-------|-----------|
| 👩‍💼 **Amina — Fraud Analyst** | Reviews flagged transactions all day | Fast triage, clear risk ranking, one-click actions | Alert Queue |
| 👨‍🔧 **David — ML / Ops Engineer** | Keeps the model healthy in production | Drift alerts, model versions, retrain controls | Model Health |
| 👩‍💻 **Grace — Risk Manager** | Owns fraud KPIs and budget | Trends, $ saved, model performance over time | Executive Dashboard |
| 🔌 **Core Banking System** | Calls the API at transaction time | Low-latency JSON score, high availability | REST API |

---

## 5. User Stories

> Format: *As a `<persona>`, I want `<capability>` so that `<outcome>`.*

- **US-01** — As a **fraud analyst**, I want flagged transactions ranked by risk score so that I review the most dangerous ones first.
- **US-02** — As a **fraud analyst**, I want to mark a case as *confirmed fraud* or *false alarm* so that the model can learn from my feedback.
- **US-03** — As a **core banking system**, I want to POST a transaction and get a fraud probability back in JSON so that I can approve or hold the payment in real time.
- **US-04** — As an **ML engineer**, I want an email alert when data drift crosses a threshold so that I can retrain before accuracy degrades.
- **US-05** — As a **risk manager**, I want a monthly batch report of high-risk customers so that I can plan intervention campaigns.
- **US-06** — As an **ML engineer**, I want every model version tracked with an approval step so that only vetted models reach production.

---

## 6. Product Scope & Features

| # | Feature | Priority | Phase | Status |
|---|---------|----------|-------|--------|
| F1 | Real-time fraud scoring API | 🔴 Must | 3 | ✅ Built |
| F2 | Analyst alert queue (rank + filter) | 🔴 Must | 3 | 🟡 Planned UI |
| F3 | Batch scoring + monthly report | 🟠 Should | 3 | ✅ Built |
| F4 | Auto drift + quality monitoring | 🔴 Must | 4 | ✅ Built |
| F5 | Email / SNS alerting | 🔴 Must | 4 | ✅ Built |
| F6 | Model registry + approval workflow | 🟠 Should | 2 | ✅ Built |
| F7 | Auto-retraining pipeline (CI/CD) | 🟠 Should | 4 | ✅ Built |
| F8 | Executive KPI dashboard | 🟢 Could | 5 | 🟡 Planned |
| F9 | Analyst feedback loop → retrain | 🟢 Could | 5 | 🔵 Future |
| F10 | A/B & shadow deployment | 🔵 Bonus | — | 🔵 Future |

`🔴 Must · 🟠 Should · 🟢 Could · 🔵 Won't (this release)`

---

## 7. User Experience & Screens

### 7.1 Information Architecture

```
SentinelAI
├── 🔔 Alert Queue          ← analyst home: ranked flagged transactions
│    ├── Transaction detail  ← features, score, history, explainability
│    └── Action bar          ← Confirm fraud · Mark safe · Escalate
├── 📊 Executive Dashboard   ← KPIs: $ saved, precision, volume trends
├── 🩺 Model Health          ← drift charts, version, last retrain, status
├── 📦 Batch Reports         ← downloadable monthly high-risk lists
└── ⚙️ Settings              ← thresholds, alert recipients, API keys
```

### 7.2 Key Screen — Alert Queue (analyst home)

```
┌──────────────────────────────────────────────────────────────┐
│ 🛡️ SentinelAI            Alert Queue            Amina ▼  🔔 12 │
├──────────────────────────────────────────────────────────────┤
│  Filters: [ Risk: High ▾ ]  [ Today ▾ ]  [ Category ▾ ]  🔍   │
├──────────────────────────────────────────────────────────────┤
│  RISK   TXN ID      AMOUNT    CATEGORY      SCORE   STATUS     │
│  🔴 0.97  TXN-88213  $1,240.00  online_shop   ▓▓▓▓▓   ⏳ New    │
│  🔴 0.91  TXN-88207  $   89.50  gas_transport ▓▓▓▓░   ⏳ New    │
│  🟠 0.64  TXN-88199  $  450.00  grocery_pos   ▓▓▓░░   👁 Review │
│  🟢 0.22  TXN-88180  $   12.00  entertainment ▓░░░░   ✅ Cleared │
├──────────────────────────────────────────────────────────────┤
│       [ Confirm Fraud ]   [ Mark Safe ]   [ Escalate ]         │
└──────────────────────────────────────────────────────────────┘
```

### 7.3 Design Principles
- **Risk-first:** color + score bar make danger obvious at a glance (🔴🟠🟢).
- **One screen, one job:** analysts live in the queue; everything else is a click away.
- **Explainable:** every score opens to the top features that drove it (via SageMaker Clarify / SHAP).
- **Responsive & accessible:** WCAG AA contrast, keyboard-navigable, works on tablet.

---

## 8. System Architecture

See [`architecture_diagram.svg`](architecture_diagram.svg) for the full diagram.

```
Transaction ─▶ API Gateway ─▶ Lambda ─▶ SageMaker Endpoint ─▶ score
                                                  │
   S3 (raw/processed) ─▶ Feature Store ─▶ Training ─▶ Model Registry
                                                  │
              Model Monitor ─▶ CloudWatch / SNS ─▶ alert + retrain (CI/CD)
```

| Layer | AWS Service |
|-------|-------------|
| Ingestion & storage | Amazon S3, SageMaker Feature Store |
| Training | SageMaker Training, HPO, Experiments, Clarify |
| Governance | SageMaker Model Registry |
| Serving | SageMaker Endpoint (real-time) + Batch Transform |
| API | API Gateway + Lambda |
| Monitoring | Model Monitor, CloudWatch, SNS |
| Automation | SageMaker Pipelines, CodePipeline / CodeBuild |
| Security | IAM, KMS / SSE, VPC |

---

## 9. Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-1 | The API **shall** accept a transaction payload and return a fraud probability `[0,1]` + risk band. |
| FR-2 | The system **shall** persist every prediction with timestamp and model version for audit. |
| FR-3 | Analysts **shall** be able to filter alerts by risk band, date, and category. |
| FR-4 | Analysts **shall** be able to label a case (fraud / safe), feeding the retraining set. |
| FR-5 | The system **shall** run scheduled batch scoring and export a downloadable report. |
| FR-6 | Model Monitor **shall** compute drift against a baseline and raise an SNS alert on breach. |
| FR-7 | Only models in **Approved** registry status **shall** be deployable to production. |

---

## 10. Non-Functional Requirements

| Attribute | Target |
|-----------|--------|
| ⚡ Latency | p95 < 200 ms per real-time prediction |
| 📈 Availability | 99.5% for the scoring API |
| 🔒 Security | IAM least-privilege, encryption at rest (SSE/KMS) + in transit (TLS) |
| 📊 Scalability | Auto-scaling endpoint; handles 10× traffic spikes |
| 💸 Cost | Optimized via Graviton, multi-model endpoints, scale-to-zero (see `COST_ANALYSIS.md`) |
| 🧭 Observability | CloudWatch dashboard: latency, invocations, drift, cost |
| ♿ Accessibility | WCAG 2.1 AA |

---

## 11. Success Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| 🎯 Model AUC-PR | _TBD_ | ≥ 0.85 |
| 🟢 Precision @ alert threshold | _TBD_ | ≥ 0.80 |
| 🔵 Recall (fraud caught) | _TBD_ | ≥ 0.75 |
| ⏱️ Mean review time per alert | ~5 min | ≤ 90 sec |
| 💰 Estimated fraud loss prevented | — | +30% vs rules engine |
| 🚨 Drift-to-alert time | manual | < 1 hour (automated) |

---

## 12. Milestones & Timeline

| Phase | Milestone | Deliverable |
|-------|-----------|-------------|
| **P1** | Data foundation | S3 lake, EDA, Feature Store |
| **P2** | Model development | XGBoost + DL, HPO, Clarify, registered model |
| **P3** | Go-live serving | Real-time endpoint, REST API, batch pipeline |
| **P4** | Automation | SageMaker Pipeline, monitoring, SNS, CI/CD |
| **P5** | Production hardening | IAM/encryption, CloudWatch dashboard, cost optimization |
| **vNext** | Product polish | Analyst UI, feedback loop, A/B testing |

---

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Severe class imbalance hurts recall | High | High | SMOTE + AUC-PR optimization + threshold tuning |
| Model drift over time | High | High | Automated Model Monitor + SNS + retrain pipeline |
| Idle endpoint cost overrun | Medium | Medium | Auto-scaling + scheduled teardown + budgets alert |
| Region quota limits (af-south-1) | Medium | Medium | Early Service Quotas request; local fallback |
| False positives frustrate customers | Medium | High | Tunable threshold + analyst review before action |

---

## 14. Open Questions

- [ ] What is the acceptable false-positive rate for the business?
- [ ] Should confirmed-fraud labels trigger **automatic** retraining or stay manual-approval?
- [ ] Do we need real-time analyst notifications (websocket) or is the queue refresh enough?
- [ ] Which retention period is required for prediction audit logs (compliance)?

---

## 15. Appendix

- 📄 [`README.md`](README.md) — engineering overview & run instructions
- 💸 [`COST_ANALYSIS.md`](COST_ANALYSIS.md) — cost breakdown & optimization
- 🖼️ [`architecture_diagram.svg`](architecture_diagram.svg) — system architecture
- 📓 `Phase1–4` notebooks — full implementation

---

<div align="center">

**SentinelAI** · Built on AWS SageMaker · Data Science Year 3

*Catch more fraud. Bother fewer customers. Never fly blind.*

</div>
