# Component Matrix

Legend: ✅ Required - ⚡ Critical / unusually deep - 🔄 Optional / category-dependent

---

## Part 1: Foundational Infrastructure

| Component | Smart Home / Consumer IoT | Industrial Automation / SCADA Edge | Autonomous Robots / Drones / AMRs |
|---|:---:|:---:|:---:|
| Firmware / OS Runtime Base | ✅ | ✅ | ✅ |
| Hardware Abstraction Layer | ✅ | ⚡ | ⚡ |
| Device Identity / Provisioning | ✅ | ✅ | ✅ |
| Connectivity Stack | ⚡ | ⚡ | ⚡ |
| Local State / Persistence | ✅ | ✅ | ✅ |
| OTA Updates / Rollback | ⚡ | ✅ | ⚡ |
| Fleet Management / Registry | ✅ | ✅ | ✅ |
| Telemetry / Diagnostics | ✅ | ⚡ | ⚡ |
| Remote Config / Policy | ✅ | ✅ | ✅ |
| Edge-to-Cloud Sync | ✅ | ✅ | ✅ |
| Safety / Watchdogs / Fail-Safe | ✅ | ⚡ | ⚡ |
| Security / Secure Boot | ⚡ | ⚡ | ⚡ |
| Manufacturing / Calibration | ✅ | ✅ | ⚡ |
| Simulation / Test Harnesses | 🔄 | ✅ | ⚡ |
| Companion / Field UX Hooks | ⚡ | ✅ | ✅ |
| Compliance / Support Ops | ✅ | ⚡ | ⚡ |

---

## Part 2: Bespoke / Domain-Specific Components

### Smart Home & Consumer IoT

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Pairing / Commissioning Flow | High | No |
| Home Graph / Room / Device Model | Medium | No |
| Event Automations & Scenes | High | Partially (industrial rules) |
| Local-First Device Control | High | Partially |
| Cloud Video / Audio or Sensor Event Handling | High | Partially |
| Multi-User Household Permissions | Medium | No |
| Notifications / Alerts / Incident Flow | Medium | Partially |
| Power / Battery Optimization | High | Partially |
| Integrations with Voice / Home Ecosystems | Medium | No |
| Consumer Support / Replacement / RMA Flow | Medium | No |

**10 bespoke components**

---

### Industrial Automation & SCADA Edge

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Deterministic Control Loops | Very High | No |
| PLC / HMI / Historian Integration | High | No |
| Alarm, Event & Acknowledgement Workflows | High | Partially |
| Protocol Translation / Gateway Behavior | High | Partially |
| Real-Time Visualization / Control Panels | High | No |
| Safety Interlocks & Operational Constraints | Very High | Partially |
| Offline Operations & Field Reliability | High | Partially |
| Auditability & Regulatory Logging | High | Partially |
| Edge Analytics / Rules Engine | Medium | Partially |
| Role-Based Maintenance Workflows | Medium | No |
| Multi-Site Device / Plant Management | Medium | No |

**11 bespoke components**

---

### Autonomous Robots, Drones & AMRs

| Component | Complexity | Shared w/ Other Verticals? |
|---|---|---|
| Sensor Fusion | Very High | No |
| Localization / Mapping / SLAM | Very High | No |
| Path Planning & Navigation | Very High | No |
| Mission / Task Execution Model | High | Partially |
| Obstacle Avoidance & Safety Envelope | Very High | No |
| Real-Time Teleoperation / Override | High | Partially |
| Fleet Coordination & Task Allocation | High | Partially |
| Battery / Charging / Docking Logic | Medium | No |
| Simulation & Replay for Incidents | High | Partially |
| Payload / Camera / Tooling Control | Medium | No |
| Compliance / Flight or Operational Geofencing | High | No |
| Operator UX & Incident Management | Medium | Partially |

**12 bespoke components**

---

## Summary

| Vertical | Foundational | Bespoke | Total | % Foundational |
|---|:---:|:---:|:---:|:---:|
| Smart Home & Consumer IoT | 16 | 10 | 26 | 62% |
| Industrial Automation & SCADA Edge | 16 | 11 | 27 | 59% |
| Autonomous Robots / Drones / AMRs | 16 | 12 | 28 | 57% |
