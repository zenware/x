# Embedded / IoT / Robotics / Edge Architecture Reference

This documentation covers the components required to build **software that runs on or tightly around physical devices**: smart-home products, industrial systems, autonomous robots, drones, and other edge-connected systems.

It separates:

- **Foundational infrastructure** - reusable device, fleet, safety, and cloud-edge components
- **Bespoke / domain-specific components** - the control loops, sensor fusion, autonomy, industrial workflows, and device-specific behaviors that define a product category

These systems differ from SaaS because hardware constraints, intermittent connectivity, field deployment, OTA safety, manufacturing, and real-world failure modes are all central design concerns.

---

## Contents

| Document | Description |
|---|---|
| [Foundational Infrastructure](./foundational-infrastructure.md) | Shared platform components across embedded, IoT, robotics, and edge products |
| [Smart Home & Consumer IoT](./verticals/smart-home-consumer-iot.md) | Architecture for Nest / Ring / connected-home products |
| [Industrial Automation & SCADA Edge Systems](./verticals/industrial-automation-scada-edge.md) | Architecture for PLC/HMI/SCADA and industrial edge software |
| [Autonomous Robots, Drones & AMRs](./verticals/autonomous-robots-drones-amrs.md) | Architecture for DJI, warehouse robots, and autonomy-heavy devices |
| [Component Matrix](./component-matrix.md) | Cross-reference of shared and bespoke systems across covered device categories |

---

## Approximate Split by Vertical

| Vertical | Foundational | Bespoke | Total | % Foundational |
|---|:---:|:---:|:---:|:---:|
| Smart Home & Consumer IoT | 16 | 10 | 26 | 62% |
| Industrial Automation & SCADA Edge | 16 | 11 | 27 | 59% |
| Autonomous Robots / Drones / AMRs | 16 | 12 | 28 | 57% |
