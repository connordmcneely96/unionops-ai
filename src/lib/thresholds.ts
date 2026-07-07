// Illustrative demo thresholds. NETA switchgear ΔT criteria are validated;
//  cooling/power values are demo defaults pending PE validation before real
//  telemetry is wired. Single source of truth — edit here only.

export const THRESHOLDS = {
    thermal: {
        // Phase-to-phase ΔT between similar components (°F), NETA MTS:
        //   <=5 investigate, 7-27 probable deficiency, >27 major discrepancy.
        deltaSimilarF: { investigateMax: 5, probableMax: 27 },
        // ΔT over ambient air (°F) at/above which failure may be imminent.
        deltaAmbientEmergencyF: 72,
        // Minimum equipment load (% of rated) for a valid thermographic survey.
        minValidLoadPct: 40,
    },
    cooling: {
        // Coolant loop return temperature (°F).
        coolantReturnF: { alarm: 105, note: 102 }, // >105 alarm
        // Loop flow rate (GPM).
        loopFlowGpm: { low: 390 }, // <390 alert
        // Filter differential pressure (psi).
        filterDpPsi: { inspect: 10 }, // >10 inspect
    },
} as const;
