import { InstantState, PWMStrategy, StrategyInfo, VsiParameters, HarmonicItem } from '../types';

export const STRATEGY_INFOS: Record<PWMStrategy, StrategyInfo> = {
  SPWM: {
    id: 'SPWM',
    name: 'Conventional Sinusoidal PWM',
    shortName: 'SPWM',
    formula: 'v_{offset}(t) = 0',
    description: 'Pure 3-phase sinusoidal modulating references compared directly with a triangular carrier. Simple and standard, but limits linear modulation index to 1.0 (DC bus utilization of 78.5% compared to six-step).',
    maxLinearMa: 1.0,
    switchingLossReduction: '0% (all 3 legs continuously switch)',
    dcUtilization: '78.5% (V_fund_peak = 0.500 * Vdc)',
    highlight: 'Standard benchmark, zero common-mode injection.'
  },
  THIPWM: {
    id: 'THIPWM',
    name: 'Third-Harmonic Injected PWM',
    shortName: 'THIPWM',
    formula: 'v_{offset}(t) = \\frac{m_a}{6} \\sin(3\\omega_0 t)',
    description: 'Injects a 1/6 amplitude 3rd-harmonic component into all three phases. The 3rd harmonic flattens the crest of the modulating waves, enabling a 15.5% increase in fundamental output voltage without overmodulation.',
    maxLinearMa: 1.155, // 2 / sqrt(3)
    switchingLossReduction: '0% (continuous switching)',
    dcUtilization: '90.7% (V_fund_peak = 0.577 * Vdc)',
    highlight: 'Triplen harmonic naturally cancels in 3-wire line-to-line voltages.'
  },
  MINMAX: {
    id: 'MINMAX',
    name: 'Min-Max Injected PWM (SVPWM Equivalent)',
    shortName: 'Min-Max SVPWM',
    formula: 'v_{offset}(t) = -\\frac{1}{2}\\big(\\max(v_a, v_b, v_c) + \\min(v_a, v_b, v_c)\\big)',
    description: 'Calculates the offset as half the sum of maximum and minimum reference signals at every instant. This carrier-based implementation produces identical switching sequences and dwell times to Space Vector PWM with centered zero vectors (V0 & V7).',
    maxLinearMa: 1.155, // 2 / sqrt(3)
    switchingLossReduction: '0% (continuous switching)',
    dcUtilization: '90.7% (V_fund_peak = 0.577 * Vdc)',
    highlight: 'Carrier-based exact mathematical equivalent to Space Vector Modulation.'
  },
  UPPER_CLAMP: {
    id: 'UPPER_CLAMP',
    name: 'Upper Bus Clamping PWM (DPWM-MAX)',
    shortName: 'Upper Clamp',
    formula: 'v_{offset}(t) = 1 - \\max(v_a, v_b, v_c)',
    description: 'Clamps the phase leg with the highest reference to the positive DC bus rail (+1). The corresponding top IGBT remains continuously ON during this interval, eliminating switching transitions in that leg.',
    maxLinearMa: 1.155,
    switchingLossReduction: '33% fewer switching transitions',
    dcUtilization: '90.7%',
    highlight: 'Top rail clamping; stops switching on the phase with highest positive voltage.'
  },
  LOWER_CLAMP: {
    id: 'LOWER_CLAMP',
    name: 'Lower Bus Clamping PWM (DPWM-MIN)',
    shortName: 'Lower Clamp',
    formula: 'v_{offset}(t) = -1 - \\min(v_a, v_b, v_c)',
    description: 'Clamps the phase leg with the lowest reference to the negative DC bus rail (-1). The corresponding bottom IGBT remains continuously ON during this interval, completely halting switching events on that phase.',
    maxLinearMa: 1.155,
    switchingLossReduction: '33% fewer switching transitions',
    dcUtilization: '90.7%',
    highlight: 'Bottom rail clamping; keeps bottom switches continuously conductive in turns.'
  },
  DPWM1: {
    id: 'DPWM1',
    name: 'Discontinuous PWM (60° Clamped DPWM1)',
    shortName: 'DPWM1 (60°)',
    formula: 'v_{offset} = (V_{max} + V_{min} \\ge 0) \\;?\\; 1 - V_{max} : -1 - V_{min}',
    description: 'Clamps each phase leg to the positive rail for 60° around its positive peak, and to the negative rail for 60° around its negative peak (total 120° clamping per cycle). Because clamping coincides with high current intervals, switching loss is slashed by up to 50%!',
    maxLinearMa: 1.155,
    switchingLossReduction: '33% to 50% switching loss reduction',
    dcUtilization: '90.7%',
    highlight: 'Optimal for medium-to-high power factor loads, maximum thermal efficiency.'
  }
};

/**
 * Calculates the offset voltage for the chosen strategy
 */
export function calculateOffset(
  strategy: PWMStrategy,
  va: number,
  vb: number,
  vc: number,
  theta: number,
  ma: number
): number {
  const vMax = Math.max(va, vb, vc);
  const vMin = Math.min(va, vb, vc);

  switch (strategy) {
    case 'SPWM':
      return 0;

    case 'THIPWM': {
      // Third harmonic: -1/6 * ma * sin(3*theta)
      // With sin references: at theta = pi/2, sin(3*pi/2) = -1, so 1/6 * ma * sin(3*theta) subtracts 1/6 from crest!
      // Here: va = ma*sin(theta). When theta=pi/2, va=+ma.
      // Offset should depress va by ma/6, so offset at theta=pi/2 should be -ma/6.
      // sin(3 * pi/2) = -1. Thus: (ma / 6) * sin(3 * theta) = -ma / 6. Exactly right!
      return (ma / 6) * Math.sin(3 * theta);
    }

    case 'MINMAX': {
      // SVPWM zero-sequence injection
      return -0.5 * (vMax + vMin);
    }

    case 'UPPER_CLAMP': {
      // Clamps the maximum phase to +1.0
      return 1.0 - vMax;
    }

    case 'LOWER_CLAMP': {
      // Clamps the minimum phase to -1.0
      return -1.0 - vMin;
    }

    case 'DPWM1': {
      // 60-degree clamping:
      // If |vMax| >= |vMin| => vMax + vMin >= 0 => clamp to +1
      // Else clamp to -1
      if (vMax + vMin >= 0) {
        return 1.0 - vMax;
      } else {
        return -1.0 - vMin;
      }
    }

    default:
      return 0;
  }
}

/**
 * Generates symmetric triangular carrier [-1, 1]
 */
export function getCarrier(time: number, fc: number): number {
  // 2/pi * arcsin(sin(2*pi*fc*t)) produces exact triangle wave between -1 and +1
  return (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * fc * time));
}

/**
 * Calculates continuous, physically exact switching ripple current for a single inverter pole.
 * In an R-L load, inductor current cannot change instantaneously (L * di/dt = v - R*i).
 * The ripple current is the exact integral of (v_pole(t) - v_avg) / L over each carrier interval,
 * yielding a smooth, continuous piecewise-linear triangle/ramp without jump discontinuities.
 */
export function computePoleCurrentRipple(
  t: number,
  fc: number,
  vMod: number,
  vdc: number,
  L_H: number
): number {
  // Clamp modulating wave to [-1, 1] for linear ripple computation
  const vStar = Math.max(-1, Math.min(1, vMod));
  const Tc = 1 / fc;

  // Align so tRel = 0 is a carrier valley (vTri = -1).
  // In getCarrier: vTri = (2/pi) * asin(sin(2*pi*fc*t)), valley is at fc*t = -0.25 + k
  const tRel = t + 0.25 * Tc;
  const tMod = ((tRel % Tc) + Tc) % Tc; // [0, Tc)

  // Switching threshold times within the carrier cycle where vTri = vStar:
  // vTri rises from -1 to +1 between 0 and Tc/2, crossing vStar at t1:
  const t1 = (Tc / 4) * (1 + vStar);
  // vTri falls from +1 to -1 between Tc/2 and Tc, crossing vStar at t2:
  const t2 = Tc - t1;

  // Inductor di/dt = delta_v / L:
  // When switch is ON (vStar >= vTri):  di/dt = (Vdc / (2*L)) * (1 - vStar)  (ramping up)
  // When switch is OFF (vStar < vTri): di/dt = -(Vdc / (2*L)) * (1 + vStar) (ramping down)
  const kL = vdc / (2 * L_H);
  const iPeak = kL * (Tc / 4) * (1 - vStar * vStar);

  if (tMod <= t1) {
    // Region 1: [0, t1], switch is ON, current ramps up from 0 to iPeak
    return kL * (1 - vStar) * tMod;
  } else if (tMod <= t2) {
    // Region 2: [t1, t2], switch is OFF, current ramps down from iPeak to -iPeak
    return iPeak - kL * (1 + vStar) * (tMod - t1);
  } else {
    // Region 3: [t2, Tc], switch is ON, current ramps up from -iPeak to 0
    return -iPeak + kL * (1 - vStar) * (tMod - t2);
  }
}

/**
 * Computes instantaneous electrical and circuit state at time t
 */
export function computeInstantState(
  t: number,
  params: VsiParameters
): InstantState {
  const { strategy, ma, f0, mf, vdc, loadR, loadL } = params;
  const omega0 = 2 * Math.PI * f0;
  const fc = f0 * mf;
  const theta = (omega0 * t) % (2 * Math.PI);
  const carrierPhase = (2 * Math.PI * fc * t) % (2 * Math.PI);

  // Pure 3-phase sinusoidal references
  const vaSin = ma * Math.sin(theta);
  const vbSin = ma * Math.sin(theta - (2 * Math.PI) / 3);
  const vcSin = ma * Math.sin(theta - (4 * Math.PI) / 3);

  // Offset voltage injection
  const vOffset = calculateOffset(strategy, vaSin, vbSin, vcSin, theta, ma);

  // Actual modulating waveforms
  const vaStar = vaSin + vOffset;
  const vbStar = vbSin + vOffset;
  const vcStar = vcSin + vOffset;

  // Carrier waveform
  const vTri = getCarrier(t, fc);

  // Gate signals: 1 when modulating signal >= carrier, 0 otherwise
  const sa = vaStar >= vTri ? 1 : 0;
  const sb = vbStar >= vTri ? 1 : 0;
  const sc = vcStar >= vTri ? 1 : 0;

  // Vector identification V0 to V7
  const vectorIndex = (sa << 2) | (sb << 1) | sc;
  const vectorMap: Record<number, string> = {
    0: 'V₀ [000]',
    4: 'V₁ [100]',
    6: 'V₂ [110]',
    2: 'V₃ [010]',
    3: 'V₄ [011]',
    1: 'V₅ [001]',
    5: 'V₆ [101]',
    7: 'V₇ [111]'
  };
  const vectorName = vectorMap[vectorIndex] || 'V₀ [000]';

  // Reference space vector in stationary α-β plane via Clarke Transformation:
  // v_alpha = (2/3) * (va - 0.5*vb - 0.5*vc)
  // v_beta  = (1/sqrt(3)) * (vb - vc)
  // The injected common-mode offset vOffset cancels out in the Clarke transform,
  // accurately preserving the synthesized fundamental voltage space vector.
  const vAlpha = (2 / 3) * (vaSin - 0.5 * vbSin - 0.5 * vcSin);
  const vBeta = (vbSin - vcSin) / Math.sqrt(3);
  let thetaSv = Math.atan2(vBeta, vAlpha);
  if (thetaSv < 0) {
    thetaSv += 2 * Math.PI;
  }

  // Active sector (1..6) in the α-β space vector plane:
  // Sector 1: [0°, 60°)   -> bounded by V₁ [100] (0°) and V₂ [110] (60°)
  // Sector 2: [60°, 120°)  -> bounded by V₂ [110] (60°) and V₃ [010] (120°)
  // Sector 3: [120°, 180°) -> bounded by V₃ [010] (120°) and V₄ [011] (180°)
  // Sector 4: [180°, 240°) -> bounded by V₄ [011] (180°) and V₅ [001] (240°)
  // Sector 5: [240°, 300°) -> bounded by V₅ [001] (240°) and V₆ [101] (300°)
  // Sector 6: [300°, 360°) -> bounded by V₆ [101] (300°) and V₁ [100] (0°/360°)
  const thetaSvDeg = (thetaSv * 180) / Math.PI;
  const sector = Math.min(6, Math.max(1, Math.floor(thetaSvDeg / 60) + 1));

  // Pole voltages relative to DC midpoint O (+/- Vdc / 2)
  const vAO = (sa ? 1 : -1) * (vdc / 2);
  const vBO = (sb ? 1 : -1) * (vdc / 2);
  const vCO = (sc ? 1 : -1) * (vdc / 2);

  // Line voltages
  const vAB = vAO - vBO;
  const vBC = vBO - vCO;
  const vCA = vCO - vAO;

  // Star load neutral-to-midpoint voltage
  const vnO = (vAO + vBO + vCO) / 3;

  // Phase voltages across load (An, Bn, Cn)
  const vAn = vAO - vnO;
  const vBn = vBO - vnO;
  const vCn = vCO - vnO;

  // Load currents (R-L load fundamental + exact continuous switching ripple)
  const L_H = Math.max(0.001, loadL / 1000); // Henry
  const Z = Math.sqrt(loadR * loadR + (omega0 * L_H) * (omega0 * L_H));
  const phi = Math.atan2(omega0 * L_H, loadR);

  // Fundamental phase current amplitude
  const iFundPeak = (ma * (vdc / 2)) / Math.max(0.1, Z);

  // Fundamental sinusoidal currents (strictly balanced)
  const iaFund = iFundPeak * Math.sin(theta - phi);
  const ibFund = iFundPeak * Math.sin(theta - (2 * Math.PI) / 3 - phi);
  const icFund = iFundPeak * Math.sin(theta - (4 * Math.PI) / 3 - phi);

  // High-frequency switching ripple for each inverter leg (continuous piecewise-linear)
  const ripAPole = computePoleCurrentRipple(t, fc, vaStar, vdc, L_H);
  const ripBPole = computePoleCurrentRipple(t, fc, vbStar, vdc, L_H);
  const ripCPole = computePoleCurrentRipple(t, fc, vcStar, vdc, L_H);

  // Coupled star-load phase currents through isolated neutral (vAn = vAO - vnO)
  // Guarantees Kirchhoff's Current Law: ia + ib + ic = 0 strictly at every instant
  const ripA = (2 * ripAPole - ripBPole - ripCPole) / 3;
  const ripB = (2 * ripBPole - ripAPole - ripCPole) / 3;
  const ripC = (2 * ripCPole - ripAPole - ripBPole) / 3;

  const ia = iaFund + ripA;
  const ib = ibFund + ripB;
  const ic = icFund + ripC;

  // 6 Gate Signals:
  // Phase A: g1 (top S1), g2 (bot S2)
  // Phase B: g3 (top S3), g4 (bot S4)
  // Phase C: g5 (top S5), g6 (bot S6)
  const g1 = sa;
  const g2 = 1 - sa;
  const g3 = sb;
  const g4 = 1 - sb;
  const g5 = sc;
  const g6 = 1 - sc;

  // Active conducting device determination for each leg:
  // Leg A:
  let condA: InstantState['condA'];
  if (sa === 1) {
    // Top switch gated (S1)
    condA = ia >= 0
      ? { switchPos: 'TOP', device: 'MOSFET', tag: 'M₁ (MOSFET)' }
      : { switchPos: 'TOP', device: 'DIODE', tag: 'D₁ (Diode)' };
  } else {
    // Bottom switch gated (S2)
    condA = ia < 0
      ? { switchPos: 'BOT', device: 'MOSFET', tag: 'M₂ (MOSFET)' }
      : { switchPos: 'BOT', device: 'DIODE', tag: 'D₂ (Diode)' };
  }

  // Leg B:
  let condB: InstantState['condB'];
  if (sb === 1) {
    // Top switch gated (S3)
    condB = ib >= 0
      ? { switchPos: 'TOP', device: 'MOSFET', tag: 'M₃ (MOSFET)' }
      : { switchPos: 'TOP', device: 'DIODE', tag: 'D₃ (Diode)' };
  } else {
    // Bottom switch gated (S4)
    condB = ib < 0
      ? { switchPos: 'BOT', device: 'MOSFET', tag: 'M₄ (MOSFET)' }
      : { switchPos: 'BOT', device: 'DIODE', tag: 'D₄ (Diode)' };
  }

  // Leg C:
  let condC: InstantState['condC'];
  if (sc === 1) {
    // Top switch gated (S5)
    condC = ic >= 0
      ? { switchPos: 'TOP', device: 'MOSFET', tag: 'M₅ (MOSFET)' }
      : { switchPos: 'TOP', device: 'DIODE', tag: 'D₅ (Diode)' };
  } else {
    // Bottom switch gated (S6)
    condC = ic < 0
      ? { switchPos: 'BOT', device: 'MOSFET', tag: 'M₆ (MOSFET)' }
      : { switchPos: 'BOT', device: 'DIODE', tag: 'D₆ (Diode)' };
  }

  // Decoupled switch conduction and gate states for all 6 discrete switches:
  // Leg A: S1 (top), S2 (bottom)
  // Leg B: S3 (top), S4 (bottom)
  // Leg C: S5 (top), S6 (bottom)
  const switchStates: InstantState['switchStates'] = {
    s1: {
      id: 'S₁',
      name: 'M₁',
      gateLabel: 'g₁',
      gate: sa === 1 ? 'HIGH' : 'LOW',
      gateSignal: g1,
      vgs: sa === 1 ? '+15V (Vgs > Vth)' : '0V',
      conducting: sa === 1 ? (ia >= 0 ? 'MOSFET' : 'DIODE') : 'OFF',
      activeTag: sa === 1 ? (ia >= 0 ? 'M₁ (MOSFET)' : 'D₁ (Body Diode)') : 'OFF',
      carrierComp: vaStar >= vTri ? 'va* >= v_tri' : 'va* < v_tri'
    },
    s2: {
      id: 'S₂',
      name: 'M₂',
      gateLabel: 'g₂',
      gate: sa === 0 ? 'HIGH' : 'LOW',
      gateSignal: g2,
      vgs: sa === 0 ? '+15V (Vgs > Vth)' : '0V',
      conducting: sa === 0 ? (ia < 0 ? 'MOSFET' : 'DIODE') : 'OFF',
      activeTag: sa === 0 ? (ia < 0 ? 'M₂ (MOSFET)' : 'D₂ (Body Diode)') : 'OFF',
      carrierComp: vaStar < vTri ? 'va* < v_tri' : 'va* >= v_tri'
    },
    s3: {
      id: 'S₃',
      name: 'M₃',
      gateLabel: 'g₃',
      gate: sb === 1 ? 'HIGH' : 'LOW',
      gateSignal: g3,
      vgs: sb === 1 ? '+15V (Vgs > Vth)' : '0V',
      conducting: sb === 1 ? (ib >= 0 ? 'MOSFET' : 'DIODE') : 'OFF',
      activeTag: sb === 1 ? (ib >= 0 ? 'M₃ (MOSFET)' : 'D₃ (Body Diode)') : 'OFF',
      carrierComp: vbStar >= vTri ? 'vb* >= v_tri' : 'vb* < v_tri'
    },
    s4: {
      id: 'S₄',
      name: 'M₄',
      gateLabel: 'g₄',
      gate: sb === 0 ? 'HIGH' : 'LOW',
      gateSignal: g4,
      vgs: sb === 0 ? '+15V (Vgs > Vth)' : '0V',
      conducting: sb === 0 ? (ib < 0 ? 'MOSFET' : 'DIODE') : 'OFF',
      activeTag: sb === 0 ? (ib < 0 ? 'M₄ (MOSFET)' : 'D₄ (Body Diode)') : 'OFF',
      carrierComp: vbStar < vTri ? 'vb* < v_tri' : 'vb* >= v_tri'
    },
    s5: {
      id: 'S₅',
      name: 'M₅',
      gateLabel: 'g₅',
      gate: sc === 1 ? 'HIGH' : 'LOW',
      gateSignal: g5,
      vgs: sc === 1 ? '+15V (Vgs > Vth)' : '0V',
      conducting: sc === 1 ? (ic >= 0 ? 'MOSFET' : 'DIODE') : 'OFF',
      activeTag: sc === 1 ? (ic >= 0 ? 'M₅ (MOSFET)' : 'D₅ (Body Diode)') : 'OFF',
      carrierComp: vcStar >= vTri ? 'vc* >= v_tri' : 'vc* < v_tri'
    },
    s6: {
      id: 'S₆',
      name: 'M₆',
      gateLabel: 'g₆',
      gate: sc === 0 ? 'HIGH' : 'LOW',
      gateSignal: g6,
      vgs: sc === 0 ? '+15V (Vgs > Vth)' : '0V',
      conducting: sc === 0 ? (ic < 0 ? 'MOSFET' : 'DIODE') : 'OFF',
      activeTag: sc === 0 ? (ic < 0 ? 'M₆ (MOSFET)' : 'D₆ (Body Diode)') : 'OFF',
      carrierComp: vcStar < vTri ? 'vc* < v_tri' : 'vc* >= v_tri'
    }
  };

  return {
    time: t,
    theta,
    carrierPhase,
    vTri,
    vaSin,
    vbSin,
    vcSin,
    vOffset,
    vaStar,
    vbStar,
    vcStar,
    sa,
    sb,
    sc,
    g1,
    g2,
    g3,
    g4,
    g5,
    g6,
    switchStates,
    vectorName,
    sector,
    vAlpha,
    vBeta,
    thetaSv,
    vAO,
    vBO,
    vCO,
    vAB,
    vBC,
    vCA,
    vnO,
    vAn,
    vBn,
    vCn,
    ia,
    ib,
    ic,
    condA,
    condB,
    condC
  };
}

/**
 * Precomputes waveform dataset over fundamental cycles for smooth oscilloscope rendering
 */
export function generateCycleData(
  params: VsiParameters,
  numCycles = 1,
  samplePoints = 1200
): InstantState[] {
  const period = numCycles / params.f0;
  const dt = period / (samplePoints - 1);
  const data: InstantState[] = [];

  for (let i = 0; i < samplePoints; i++) {
    const t = i * dt;
    data.push(computeInstantState(t, params));
  }

  return data;
}

/**
 * Precomputes waveform dataset over an arbitrary time range [tStart, tEnd]
 * Used for high-resolution X-zoom drag inspection in the oscilloscope
 */
export function generateTimeRangeData(
  params: VsiParameters,
  tStart: number,
  tEnd: number,
  samplePoints = 1200
): InstantState[] {
  const span = Math.max(1e-6, tEnd - tStart);
  const dt = span / (samplePoints - 1);
  const data: InstantState[] = [];

  for (let i = 0; i < samplePoints; i++) {
    const t = tStart + i * dt;
    data.push(computeInstantState(t, params));
  }

  return data;
}

/**
 * Calculates FFT and harmonics on line voltage or phase voltage
 */
export function calculateHarmonics(
  cycleData: InstantState[],
  signalKey: 'vAB' | 'vAn' | 'ia',
  f0: number,
  maxHarmonic = 50
): { harmonics: HarmonicItem[]; thd: number; fundamentalRms: number } {
  const N = cycleData.length;
  if (N < 64) return { harmonics: [], thd: 0, fundamentalRms: 0 };

  const values = cycleData.map(d => d[signalKey]);
  const harmonics: HarmonicItem[] = [];

  let fundamentalMag = 0;
  let harmonicEnergySum = 0;

  for (let h = 1; h <= maxHarmonic; h++) {
    let sumCos = 0;
    let sumSin = 0;

    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * h * n) / N;
      sumCos += values[n] * Math.cos(angle);
      sumSin += values[n] * Math.sin(angle);
    }

    const a_h = (2 / N) * sumCos;
    const b_h = (2 / N) * sumSin;
    const mag = Math.sqrt(a_h * a_h + b_h * b_h);

    if (h === 1) {
      fundamentalMag = Math.max(0.001, mag);
      harmonics.push({
        harmonicNumber: 1,
        frequency: f0,
        magnitude: mag,
        percentage: 100
      });
    } else {
      harmonicEnergySum += mag * mag;
      harmonics.push({
        harmonicNumber: h,
        frequency: h * f0,
        magnitude: mag,
        percentage: (mag / fundamentalMag) * 100
      });
    }
  }

  const thd = (Math.sqrt(harmonicEnergySum) / fundamentalMag) * 100;
  const fundamentalRms = fundamentalMag / Math.SQRT2;

  return { harmonics, thd, fundamentalRms };
}
