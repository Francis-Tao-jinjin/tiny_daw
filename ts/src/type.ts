export enum VoxType{
  Default,
  Time,
  Frequency,
  Decibels,
  BPM,
  Positive,
  Cents,
  Ticks,
}

export enum VoxTick {
  Worker,
  Timeout,
  Offline,
}

export enum PlayState {
  Stopped,
  Started,
  Paused,
}

export enum FadeCurve {
  Linear,
  Exponential,
}

export const OscilType = {
  sine: ('sine' as OscillatorType),
  square: ('square' as OscillatorType),
  triangle: ('triangle' as OscillatorType),
  sawtooth: ('sawtooth' as OscillatorType),
  custom : ('custom' as OscillatorType),
}