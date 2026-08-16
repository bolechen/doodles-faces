export type Rng = () => number;

export type Pt = [number, number];
export type Pt3 = [number, number, number];
export type Proj = (x: number, y: number, z?: number) => Pt;

export type Weighted<T extends string> = readonly [T, number];

export type Skull = "egg" | "round" | "long" | "wide" | "block" | "pear" | "gaunt";
export type Eyes = "bags" | "dead" | "round" | "side" | "hollow" | "wide" | "squint";
export type Brow = "none" | "flat" | "tired" | "worry" | "raise" | "uni";
export type Nose = "hook" | "long" | "line" | "button" | "wide" | "bulb" | "beak";
export type Mouth = "flat" | "smile" | "smirk" | "grim" | "frown" | "open" | "line";
export type Hair = "bowl" | "buzz" | "spikes" | "curl" | "side" | "none" | "hat" | "baldspot";
export type Facial = "none" | "stubble" | "mustache" | "goatee";
export type Glasses = "none" | "round" | "square" | "shades";

export type Face = {
  seed: number;
  skull: Skull;
  hrx: number;
  hry: number;
  eyes: Eyes;
  brow: Brow;
  nose: Nose;
  mouth: Mouth;
  hair: Hair;
  facial: Facial;
  glasses: Glasses;
  ink: string;
  yaw: number;
  pitch: number;
  asym: number;
  ph1: number;
  ph2: number;
  ph3: number;
  a2: number;
  a3: number;
  tilt: number;
};

export type InkOpt = {
  width?: number;
  color?: string;
  jitter?: number;
  passes?: number;
  closed?: boolean;
  taper?: boolean;
  alpha?: number;
  samples?: number;
  smooth?: boolean;
};
