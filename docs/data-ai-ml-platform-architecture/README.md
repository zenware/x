# Data / AI / ML Platform Architecture Reference

This documentation covers the components required to build **data platforms, AI products, and ML systems**, including analytics platforms, MLOps products, and foundation-model application platforms.

It separates:

- **Foundational infrastructure** - reusable data, training, inference, governance, and evaluation components
- **Bespoke / domain-specific components** - the model workflows, retrieval semantics, evaluation loops, and product-specific intelligence layers that define each category

These systems differ from ordinary SaaS because large-scale data movement, model lifecycle management, inference economics, and evaluation quality are first-class architectural concerns.

---

## Contents

| Document | Description |
|---|---|
| [Foundational Infrastructure](./foundational-infrastructure.md) | Shared platform components across AI, ML, and data products |
| [Foundation Model Application Platforms](./verticals/foundation-model-application-platforms.md) | Architecture for ChatGPT / Claude / Copilot-style products |
| [Lakehouse & Analytics Platforms](./verticals/lakehouse-analytics-platforms.md) | Architecture for Databricks / Snowflake / BigQuery ecosystems |
| [MLOps, Training & Evaluation Platforms](./verticals/mlops-training-evaluation-platforms.md) | Architecture for W&B / MLflow / model ops platforms |
| [Component Matrix](./component-matrix.md) | Cross-reference of shared and bespoke systems across covered data/AI categories |

---

## Approximate Split by Vertical

| Vertical | Foundational | Bespoke | Total | % Foundational |
|---|:---:|:---:|:---:|:---:|
| Foundation Model Application Platforms | 16 | 11 | 27 | 59% |
| Lakehouse & Analytics Platforms | 16 | 10 | 26 | 62% |
| MLOps, Training & Evaluation Platforms | 16 | 11 | 27 | 59% |
