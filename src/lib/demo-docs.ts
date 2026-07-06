export interface DemoDoc {
    title: string;
    slug: string;
    docType: string;
    content: string;
}

export const DEMO_DOCS: DemoDoc[] = [
    {
        title: "Immersion Cooling SOP",
        slug: "immersion-cooling-sop",
        docType: "sop",
        content: `> Illustrative demo content — not an authoritative procedure.

# Immersion Cooling SOP — Union County Campus

## 1. Purpose and Scope

This Standard Operating Procedure governs the operation, monitoring, and response protocols for the single-phase immersion cooling system installed at the Union County Campus data hall. It applies to all operations personnel responsible for maintaining cooling loop integrity and server thermal performance.

## 2. System Overview

The immersion cooling loop consists of primary and standby circulation pumps (P-101, P-102), a plate heat exchanger (HX-201), a loop filter housing (F-101), and immersion tanks (TK-A). Dielectric coolant is circulated from the tanks, through the heat exchanger where heat is rejected to the facility cooling water loop, and returned to the tanks.

## 3. Normal Operating Parameters

| Parameter | Normal Range | Alert Threshold | Alarm Threshold |
|---|---|---|---|
| Loop return temperature | < 102 °F | 100 °F | 105 °F |
| Loop flow rate | 390 – 430 GPM | < 390 GPM | < 360 GPM |
| Filter differential pressure | < 8 psi | 8 psi | 10 psi |
| Heat exchanger approach temp | per equipment datasheet | — | rising trend |

### 3.1 Return Temperature

Normal loop return temperature should remain below 102 °F under design load. Sustained return temperature approaching 105 °F indicates a thermal performance issue. If return temperature exceeds 105 °F, the operator shall:

1. Check heat-exchanger performance — verify facility cooling water supply temperature and flow are within design range.
2. Investigate flow restriction — inspect pump status (P-101 or P-102), verify isolation valves are fully open, and check for blockage.
3. Assess tank load — confirm compute load has not increased beyond the approved power density per tank.
4. Escalate to the facilities engineering team if the condition does not resolve within 15 minutes.

### 3.2 Loop Flow Rate

Design loop flow rate is 390 to 430 GPM with the primary pump P-101 running. Flow below 390 GPM requires investigation of pump performance, valve positions, and filter condition. Flow below 360 GPM triggers automatic alarm AL-1 and requires immediate response.

### 3.3 Filter Differential Pressure

Inspect and replace the filter element in F-101 when filter differential pressure exceeds 10 psi. Elevated differential pressure indicates the element is near or at end of service life and restricts flow. Follow the filter replacement procedure in the equipment manufacturer's instructions; use only the element specification listed per equipment datasheet.

## 4. Alarm Response

### 4.1 High Coolant Return Temperature (AL-1)

Response steps: verify pump operation and flow rate; check heat exchanger inlet/outlet temperatures against design; review tank-level compute load. If return temperature exceeds 105 °F, follow Section 3.1. Do not allow sustained operation above 110 °F without reducing compute load.

### 4.2 High Filter Differential Pressure (AL-2)

Response steps: schedule filter element replacement per the filter replacement procedure. If DP is above 15 psi, isolate F-101 immediately using upstream and downstream isolation valves and complete replacement before returning the loop to service.

## 5. Preventive Maintenance Schedule

- Weekly: log return temperature, flow, and filter DP; compare against normal ranges.
- Monthly: inspect pump mechanical seals and bearing temperatures per equipment datasheet.
- Quarterly: perform heat exchanger performance test; flush and sample coolant per site standard.
- Annual: full loop drain, inspection, and coolant replacement per site standard.

## 6. References

- HX-201 plate heat exchanger maintenance manual (per equipment datasheet)
- P-101/P-102 pump operating manual (per equipment datasheet)
- F-101 filter housing maintenance guide (per equipment datasheet)
`,
    },
    {
        title: "Cooling Loop Startup Checklist",
        slug: "cooling-loop-startup-checklist",
        docType: "checklist",
        content: `> Illustrative demo content — not an authoritative procedure.

# Cooling Loop Startup Checklist — Union County Campus

## Purpose

This checklist shall be completed before energizing any compute load in an immersion tank following a loop shutdown, maintenance, or initial fill. All steps must be initialed by the responsible operator. Do not proceed to the next step until the current step is verified.

## Pre-Startup — System Inspection

- [ ] Confirm all isolation valves are in the correct open/closed position per the P&ID drawing on file.
- [ ] Verify P-101 primary pump mechanical seal is dry (no leaks); visually confirm shaft coupling guard is in place.
- [ ] Confirm P-102 standby pump is in standby-ready mode: local isolations open, no alarms on motor protection relay.
- [ ] Inspect HX-201 plate heat exchanger: verify facility cooling water supply is flowing and at design temperature per equipment datasheet.
- [ ] Inspect F-101 filter housing: verify the filter element is new or within service life (DP below 8 psi indicates serviceable). If DP was previously ≥ 10 psi, replace element before startup.
- [ ] Verify all immersion tank lids are sealed and hold-down fasteners torqued per equipment datasheet.
- [ ] Confirm dielectric coolant level in expansion vessel is within the operating band marked on the sight glass.

## Startup Sequence

1. Start facility cooling water to HX-201 first; confirm flow on the facility BMS.
2. Start P-101 at reduced speed (if VFD installed); bring to design speed over 60 seconds.
3. Confirm loop flow rate reaches 390 – 430 GPM within 2 minutes. If flow is below 390 GPM, stop pump and investigate before re-attempting.
4. Monitor loop return temperature. Under no load, return temperature should stabilize near supply temperature. Under compute load, return temperature should remain below 102 °F.
5. Verify filter DP reads below 8 psi. If above 10 psi, stop and replace filter element per the Immersion Cooling SOP.
6. Log initial readings: supply temp, return temp, flow rate, filter DP, pump motor current (per equipment datasheet normal range).

## First-Load Check (after compute energization)

- [ ] Re-verify loop return temperature below 102 °F within 10 minutes of compute load reaching 50 % design.
- [ ] Re-verify flow rate in 390 – 430 GPM range.
- [ ] Confirm no alarms present on the cooling loop control panel or BMS.
- [ ] If return temperature reaches 102 °F before full load: pause load additions; investigate heat exchanger performance and flow restriction per the Immersion Cooling SOP Section 3.1.

## Sign-Off

| Role | Name | Date/Time |
|---|---|---|
| Operations Lead | | |
| Facilities Engineer | | |

All readings at startup shall be logged in the site operations log and retained per site record-keeping standard.
`,
    },
    {
        title: "Switchgear Thermographic Inspection Procedure",
        slug: "switchgear-thermographic-inspection",
        docType: "procedure",
        content: `> Illustrative demo content — not an authoritative procedure.

# Switchgear Thermographic Inspection Procedure — Union County Campus

## 1. Purpose

This procedure governs thermographic (infrared) inspection of the main switchgear (SWGR-1) at the Union County Campus. Thermographic inspection identifies elevated connection resistance, load imbalance, and degraded components before they progress to failure. It applies to scheduled inspections and to follow-up scans triggered by drone thermal findings.

## 2. Interpretation of Thermal Findings

### 2.1 Severity Criteria (ANSI/NETA MTS, ΔT between similar components)

Severity is assessed using the temperature difference (ΔT) between a suspect connection and an adjacent similar phase under similar loading, per the ANSI/NETA MTS thermographic criteria adopted as the site standard. Valid comparison requires the equipment to be under representative load at the time of the scan.

- **Investigate:** ΔT up to approximately 5 °F (3 °C) above a similar phase — possible deficiency; monitor and re-scan at the next scheduled interval.
- **Probable deficiency:** ΔT approximately 7–27 °F (4–15 °C) — schedule corrective maintenance; repair as time permits; re-scan after correction.
- **Major discrepancy (suspect connection):** ΔT greater than 27 °F (15 °C) above a similar phase under similar load — prompt corrective action required. De-energize under LOTO, inspect and clean the lug, re-torque per the equipment datasheet, check for load imbalance, and re-scan after correction before returning to full service.
- **Emergency:** visible discoloration or arcing evidence, or ΔT over ambient air exceeding 72 °F (40 °C) — component failure may be imminent; do not re-energize without engineering sign-off.

Note: A drone thermal finding reported as a phase lug running roughly 28 °F above adjacent phases exceeds the 27 °F major-discrepancy threshold and requires the corrective action in Section 2.2.

### 2.2 Responding to a Suspect Connection

When a drone thermal pass or scheduled scan identifies a ΔT above a similar phase that meets the major-discrepancy threshold:

1. **De-energize under LOTO** — issue full lockout/tagout per NFPA 70E and the site electrical safety program. Verify a zero-energy state with a calibrated meter before making contact.
2. **Inspect the lug** — remove the lug cover or panel section. Visually inspect for discoloration, oxidation, or mechanical damage at the conductor termination.
3. **Clean the contact surfaces** — remove oxidation with an approved contact cleaner; do not use abrasives that leave conductive residue.
4. **Re-torque the lug** — apply anti-oxidant compound where specified and re-torque the connector to the value in the equipment datasheet for the conductor size. Do not substitute a generic torque value.
5. **Check for load imbalance** — review phase current readings before and after correction. If one phase carries disproportionately higher load, investigate upstream distribution and correct before re-energizing.
6. **Re-scan after correction** — perform a thermographic re-scan with the switchgear at representative load (at least ~40% of rated, per the site standard for valid surveys) after a soak period. Confirm the ΔT has returned to the investigate/monitor range. Document results.

## 3. Drone Thermal Integration

Drone thermal passes over SWGR-1 are performed with panels open where safe and permitted, or through IR-transparent panel windows where available. A drone finding of a phase lug above adjacent phases triggers the Section 2.2 sequence regardless of the originating inspection method.

## 4. Equipment and PPE Requirements

- Calibrated thermal imaging camera, calibrated per the manufacturer schedule.
- Arc-flash PPE per the facility arc-flash study for SWGR-1 (PPE category is determined by the incident-energy analysis, not a fixed value).
- LOTO hardware and documentation kit.
- Calibrated voltage meter for zero-energy verification.
- Approved anti-oxidant compound and contact cleaner (per equipment datasheet).
- Calibrated torque wrench set to the lug torque value per the equipment datasheet.

## 5. Inspection Schedule

- Scheduled thermographic inspection during planned maintenance windows.
- Triggered inspection following any drone thermal finding rated probable-deficiency or higher, per the site standard.
- Post-repair re-scan before return to service after any lug corrective action.

## 6. Documentation

Each inspection produces a written report including scan date, load level at time of scan, thermal images with temperature annotations, ΔT values for all three phases at each point, severity classification per Section 2.1, and recommended action. Reports are retained per the site record-keeping standard.
`,
    },
    {
        title: "Gas Generation Startup & Leak Response SOP",
        slug: "gas-generation-startup-leak-response-sop",
        docType: "sop",
        content: `> Illustrative demo content — not an authoritative procedure.

# Gas Generation Startup & Leak Response SOP — Union County Campus

## 1. Purpose and Scope

This Standard Operating Procedure governs startup, normal monitoring, and emergency response for the behind-the-meter gas generation system at the Union County Campus, comprising GEN-1 (gas genset) and GAS-TRAIN-1 (gas train skid). It establishes response protocols for suspected methane indications detected by OGI drone survey, combustible gas detectors, or visual/olfactory means.

## 2. Methane Leak Response — Suspected Indication at a Flange or Fitting

Any indication of methane — whether from an OGI drone survey detecting a plume, a combustible gas detector reading, or any olfactory detection — shall be treated as a potential leak until confirmed otherwise. Personnel shall not attempt to dismiss an OGI-indicated methane plume at a flange as a false positive without completing the verification steps below.

### 2.1 Immediate Response Steps

1. **Don gas-rated PPE** before approaching the gas train skid — minimum: flame-resistant clothing (FRC), combustible gas / H₂S personal monitor, and appropriate respiratory protection if in a confined or partially enclosed area. Confirm no ignition sources within 25 ft of the affected section.
2. **Monitor with gas detection** — use a calibrated combustible gas detector (CGD) to survey the indicated location. Identify the plume boundary and the highest reading point.
3. **Isolate the affected section** — if gas detection confirms a reading above 10 % LEL (or per site standard), shut the upstream and downstream isolation valves on the affected gas train section. Do not re-open without following the return-to-service steps below.
4. **Verify flange integrity per equipment datasheet** — with the section isolated and depressurized per site standard, visually inspect the flange for visible damage, gasket extrusion, or bolt loosening. Verify all bolts are torqued per the equipment datasheet specification for the flange size and pressure rating.
5. **Re-run an OGI pass to confirm** — after completing corrective action (gasket replacement or re-torquing), request a repeat OGI drone survey pass over the affected flange to confirm the plume has been eliminated before returning the section to service. Do not consider the repair complete until the OGI re-scan shows no indication.
6. **Document and report** — record detector readings, photographs, corrective actions taken, and OGI re-scan result. Notify the facilities engineering team of any confirmed leak regardless of magnitude.

### 2.2 Return to Service After Isolation

1. Confirm corrective action (gasket replacement or re-torque) is complete and documented.
2. Perform a soap-bubble test on the repaired flange before repressurizing, if safe access allows.
3. Slowly re-pressurize the isolated section; monitor with CGD continuously during repressurization.
4. Conduct the OGI re-scan pass per Section 2.1 step 5.
5. Obtain sign-off from the facilities engineer before resuming gas generation operations.

## 3. Generator Startup Sequence (Normal)

1. Verify fuel supply isolation valves are open; confirm gas supply pressure at the train inlet is within the design band per equipment datasheet.
2. Confirm GEN-1 generator coolant level, oil level, and battery charge are all within operating specifications per the manufacturer's startup checklist.
3. Execute the automated start sequence from the generator control panel; monitor for successful crank, fuel admission, and ignition within the start timeout period per equipment datasheet.
4. After reaching rated speed and voltage, confirm transfer switch operation (ATS/STS) if applicable.
5. Log start time, fuel pressure, output voltage, output current, and any alarms.

## 4. Scheduled Load Testing

GEN-1 shall undergo a scheduled load test per site standard. The test is considered complete only when the generator maintains rated output under connected load for the required duration and load test sign-off is recorded. Incomplete load tests (e.g., test did not reach rated load or did not complete the required duration) shall be rescheduled and completed before the facility is considered operationally ready for primary power interruptions.

## 5. PPE and Safety Requirements

- Gas PPE: FRC, H₂S/CH₄ personal monitor mandatory in all gas train skid areas.
- No ignition sources (open flame, non-intrinsically safe electronics) within 25 ft of the gas train during any leak response.
- LOTO required for any mechanical work on the gas train after isolation and depressurization.
- All work on electrical components of GEN-1 requires arc flash PPE per the facility arc flash study per site standard.
`,
    },
    {
        title: "Data Hall Commissioning Plan",
        slug: "data-hall-commissioning-plan",
        docType: "plan",
        content: `> Illustrative demo content — not an authoritative procedure.

# Data Hall Commissioning Plan — Union County Campus

## 1. Purpose

This plan defines the commissioning gates, acceptance criteria, and sign-off sequence for the Union County Campus data hall, covering the transition from construction completion to operational readiness for commercial compute load. Commissioning is a phased process; no phase shall be considered complete until all acceptance criteria for that phase are met and signed off.

## 2. Commissioning Phases

### Phase 1 — Infrastructure Readiness

Acceptance criteria:
- All electrical systems (SWGR-1, UPS-1) have passed infrared thermographic inspection with no high-concern findings outstanding. **Readiness is gated on closing open high-severity findings** identified during pre-commissioning inspections, including any thermographic findings rated moderate or higher per the Switchgear Thermographic Inspection Procedure.
- Immersion cooling loop has completed the Cooling Loop Startup Checklist; loop return temperature and flow rate are confirmed within normal operating parameters.
- Fire alarm system (FAS-1) has been tested and accepted per the applicable NFPA standard per site standard.
- Perimeter security and access control systems are active; camera coverage verified per the Perimeter Security & Surveillance Plan.

### Phase 2 — Generator and Power Resilience

Acceptance criteria:
- GEN-1 generator load test sign-off is complete. **Completing generator load test sign-off is a required gate.** A scheduled load test that did not complete successfully must be rescheduled and passed before this phase closes. The load test must demonstrate rated output under representative load for the required duration per site standard.
- Automatic transfer switch (ATS/STS) has been tested through simulated utility interruption; transfer time is within specification per equipment datasheet.
- UPS-1 battery runtime test has been completed and results logged.

### Phase 3 — Network and Systems Handoff

Acceptance criteria:
- **Network handoff** from the commissioning team to the operations team is complete. This includes: structured cabling certification complete; out-of-band management network operational; monitoring and alerting platform configured with all critical asset alarm points active; DCIM/BMS integration tested end-to-end.
- All critical monitoring points (cooling, power, security) are confirmed active in the operations monitoring platform.
- Operations team has completed facility orientation and accepted operational responsibility in writing.

### Phase 4 — Initial Compute Load

Acceptance criteria:
- Phases 1, 2, and 3 fully signed off with no open high-severity findings.
- Immersion tank thermal performance verified at 25 % and 50 % design load; return temperature remains below 102 °F.
- All open findings from pre-commissioning inspections are closed or have an accepted remediation plan with a defined schedule — no high-severity findings may remain open at the time of initial compute load.

## 3. Open Findings Gate

Readiness for each commissioning phase is gated on the finding closure process. Open findings are classified by severity:

- **High severity**: Must be closed (remediated and re-verified) before advancing past Phase 1.
- **Medium severity**: Remediation plan with schedule accepted by the commissioning authority; may be open during Phase 2/3 but must be closed before Phase 4.
- **Low severity**: May be deferred to the 30-day operational period with documented acceptance.

Any new high-severity finding discovered during commissioning testing restarts the Phase 1 closure gate.

## 4. Documentation Requirements

Each commissioning phase shall produce a signed completion package including test records, equipment check sheets, alarm test logs, and a list of all findings opened and closed during that phase. The final commissioning package is retained per site record-keeping standard and transferred to the operations team at handoff.

## 5. Sign-Off Authority

| Gate | Sign-Off Required From |
|---|---|
| Phase 1 Infrastructure Readiness | Facilities Engineer + Commissioning Authority |
| Phase 2 Generator/Power Resilience | Facilities Engineer + Electrical Engineer of Record |
| Phase 3 Network Handoff | IT/Network Lead + Operations Manager |
| Phase 4 Initial Compute Load | Commissioning Authority + Customer Representative |
`,
    },
    {
        title: "Perimeter Security & Surveillance Plan",
        slug: "perimeter-security-surveillance-plan",
        docType: "plan",
        content: `> Illustrative demo content — not an authoritative procedure.

# Perimeter Security & Surveillance Plan — Union County Campus

## 1. Purpose and Scope

This plan establishes the patrol cadence, camera surveillance protocols, access control standards, and incident response procedures for the Union County Campus perimeter and controlled areas. It applies to all security personnel, operations staff, and contractors operating on site.

## 2. Patrol Cadence and Coverage

### 2.1 Scheduled Patrols

Physical patrols of the site perimeter are conducted per the schedule established in the site security operations order. Patrols cover all fence lines, vehicle access points, utility entry corridors, and the electrical room entrance. Patrol completion is logged in the security operations system with GPS waypoint confirmation at each designated checkpoint.

### 2.2 Drone Patrol Integration

Autonomous drone patrols supplement physical patrols. Drone patrol flights cover the full perimeter fence line, roof access points, and parking areas. Drone patrol footage is reviewed in real time by the security operations center (SOC) and retained per site standard.

### 2.3 After-Hours Motion Detection Response

After-hours motion detected at the fence line — whether by perimeter camera motion analytics or drone patrol sensor — triggers the following verification response:

1. **Immediate camera review**: The SOC operator reviews all cameras with coverage of the alerted zone. The operator determines whether the motion is a person, vehicle, wildlife, or environmental artifact (wind, vegetation).
2. **Verification patrol**: If the camera review is inconclusive or confirms human presence near the fence line, dispatch a physical verification patrol to the indicated zone within 15 minutes. After-hours motion at the fence line triggers a verification patrol and camera review regardless of whether an access breach is confirmed.
3. **Escalation**: If physical presence is confirmed inside the fence line or at a controlled access point, escalate to the site security lead and initiate the intrusion response protocol per site standard. Law enforcement notification follows site-specific authorization criteria.
4. **Log and report**: All after-hours motion events shall be logged in the security incident management system, including disposition (confirmed/not confirmed, patrol outcome).

## 3. Access Control

### 3.1 Badge Assignment and Schedule

All personnel are issued access credentials with time-of-day restrictions aligned to their approved work schedule. Access rights are assigned per the site access control matrix, reviewed by the security manager at least quarterly.

### 3.2 Out-of-Schedule Badge Use

Badge use outside the holder's assigned schedule is flagged by the access control system as an anomaly. All out-of-schedule access events are reviewed against the access matrix within one business day. Badge use outside assigned schedule is reviewed against the access matrix to determine whether the access was pre-authorized (e.g., approved overtime, emergency response), inadvertent (schedule configuration error), or unauthorized.

If the review determines access was unauthorized:
1. The affected credential is suspended pending investigation.
2. The security manager and the credential holder's supervisor are notified.
3. Physical inspection of the accessed area is conducted to confirm no security breach or asset removal.
4. A written record of the review, determination, and corrective action is retained per site standard.

### 3.3 Restricted Zones

The electrical room, gas generation enclosure, and data hall are classified as Restricted Zones. Access to Restricted Zones is limited to personnel whose roles are explicitly listed on the access control matrix for that zone. Visitors and contractors require escort by a listed authorized person.

## 4. Camera System

The perimeter camera array (CAM-PERIM) provides continuous coverage of the site perimeter. Cameras are monitored live by the SOC during all occupied hours and by automated analytics at all times. Camera health (image quality, storage, connectivity) is checked per site standard; any camera outage is escalated for repair within 24 hours.

## 5. Incident Classification and Response Times

| Classification | Examples | Initial Response Time |
|---|---|---|
| Priority 1 — Confirmed Intrusion | Person inside fence line, forced entry | Immediate; < 5 minutes |
| Priority 2 — Probable Intrusion | Inconclusive motion + damaged fence | < 10 minutes |
| Priority 3 — After-Hours Motion | Motion at fence, no breach confirmed | Verification patrol < 15 minutes |
| Priority 4 — Access Anomaly | Badge out of schedule | Review within 1 business day |

## 6. Retention and Reporting

All security event logs, patrol records, camera footage, and access reports are retained per site standard. Monthly security summary reports are provided to the facility manager and customer security representative where required by contract.
`,
    },
];
