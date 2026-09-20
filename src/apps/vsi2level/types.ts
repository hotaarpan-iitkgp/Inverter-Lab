export type Theme = 'dark' | 'light';

export type PWMStrategy =
  | 'SPWM'
  | 'THIPWM'
  | 'MINMAX'
  | 'UPPER_CLAMP'
  | 'LOWER_CLAMP'
  | 'DPWM1';

export interface VsiParameters {
  strategy: PWMStrategy;
  ma: number; // Modulation index [0.1 .. 1.3]
  f0: number; // Fundamental frequency in Hz (e.g., 50 Hz)
  mf: number; // Carrier frequency ratio fc / f0 (e.g. 15, 21, 33, 45, 63)
  vdc: number; // DC Bus voltage in Volts (e.g. 400V)
  loadR: number; // Load resistance in Ohms (e.g. 10 Ohm)
  loadL: number; // Load inductance in mH (e.g. 25 mH)
}

export interface InstantState {
  time: number; // in seconds
  theta: number; // fundamental angle in rad [0 .. 2pi)
  carrierPhase: number; // carrier angle in rad
  vTri: number; // carrier [-1 .. +1]
  
  // Modulating signals
  vaSin: number; // pure sinusoidal reference
  vbSin: number;
  vcSin: number;
  
  vOffset: number; // offset / zero sequence injection
  vaStar: number; // actual modulating wave = vaSin + vOffset
  vbStar: number;
  vcStar: number;
  
  // Gate signals (1 = top switch ON, 0 = bottom switch ON)
  sa: number;
  sb: number;
  sc: number;
  
  // Inverter Vector & Space Vector Coordinates
  vectorName: string; // V0 .. V7
  sector: number; // 1 .. 6 (Active Space Vector Sector containing V*)
  vAlpha: number; // Alpha-axis component of reference space vector V*
  vBeta: number; // Beta-axis component of reference space vector V*
  thetaSv: number; // Angle of reference space vector V* in rad [0 .. 2pi)
  
  // Voltages relative to DC midpoint O
  vAO: number;
  vBO: number;
  vCO: number;
  
  // Line-to-line voltages
  vAB: number;
  vBC: number;
  vCA: number;
  
  // Common mode / neutral-to-midpoint voltage
  vnO: number;
  
  // Load phase-to-neutral voltages
  vAn: number;
  vBn: number;
  vCn: number;
  
  // Load currents
  ia: number;
  ib: number;
  ic: number;
  
  // 6 Gate driving signals (1 = HIGH, 0 = LOW)
  // Leg A: g1 (top S1), g2 (bot S2)
  // Leg B: g3 (top S3), g4 (bot S4)
  // Leg C: g5 (top S5), g6 (bot S6)
  g1: number;
  g2: number;
  g3: number;
  g4: number;
  g5: number;
  g6: number;

  // Decoupled switch states (Gate command vs actual conducting element)
  switchStates: {
    s1: SwitchStateDetail;
    s2: SwitchStateDetail;
    s3: SwitchStateDetail;
    s4: SwitchStateDetail;
    s5: SwitchStateDetail;
    s6: SwitchStateDetail;
  };

  // Active conducting elements for each leg:
  // For Phase A: top or bottom; MOSFET ('M') or Diode ('D')
  condA: { switchPos: 'TOP' | 'BOT'; device: 'MOSFET' | 'DIODE'; tag: string };
  condB: { switchPos: 'TOP' | 'BOT'; device: 'MOSFET' | 'DIODE'; tag: string };
  condC: { switchPos: 'TOP' | 'BOT'; device: 'MOSFET' | 'DIODE'; tag: string };
}

export interface SwitchStateDetail {
  id: string; // 'S1', 'S4', etc.
  name: string; // 'M1', 'M4', etc.
  gateLabel: string; // 'g1', 'g4', etc.
  gate: 'HIGH' | 'LOW';
  gateSignal: number; // 1 or 0
  vgs: string; // '+15V (Vgs > Vth)' or '0V'
  conducting: 'MOSFET' | 'DIODE' | 'OFF';
  activeTag: string; // 'M1 (MOSFET)', 'D1 (Diode)', 'OFF'
  carrierComp: string; // 'v* >= v_tri' or 'v* < v_tri'
}

export interface StrategyInfo {
  id: PWMStrategy;
  name: string;
  shortName: string;
  formula: string;
  description: string;
  maxLinearMa: number;
  switchingLossReduction: string;
  dcUtilization: string;
  highlight: string;
}

export interface HarmonicItem {
  harmonicNumber: number;
  frequency: number;
  magnitude: number;
  percentage: number;
}
