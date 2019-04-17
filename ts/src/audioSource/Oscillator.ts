import { Vox } from '../core/Vox';
import { VoxSource } from './Source';
import { Signal } from '../signal/Signal';
import { VoxType, OscilType } from '../type';

export class Oscillator extends VoxSource {
  private _oscillator = null;
  
  public frequency:Signal;
  public detune:Signal;
  protected _wave:PeriodicWave;
  protected _partials:any[];
  protected _partialCount:number
  protected _phase:number;
  protected _type:string;

  constructor(opt?:{
    frequency?,
    type?,
    detune?,
    phase?,
    partials?,
    partialCount?,
  }) {
    super();

    opt = opt === undefined ? {} : opt;
    opt.type = opt.type === undefined ? 'sine' : opt.type;

    this.frequency = new Vox.Signal({
      value: opt.frequency === undefined ? 440 : opt.frequency,
      units: VoxType.Frequency,
    });

    this.detune = new Vox.Signal({
      value: opt.detune === undefined ? 0 : opt.detune,
      units: VoxType.Cents,
    });

    this._wave = null;

    this._partials = opt.partials === undefined ? [] : opt.partials;
    this._partialCount = opt.partialCount === undefined ? 0 : opt.partialCount; 

    this._phase = opt.phase === undefined ? 0 : opt.phase;
    this._type = opt.type === undefined ? OscilType.sine : opt.type;

    this.type = this._type;
  }

  // https://chromium.googlesource.com/chromium/blink/+/master/Source/modules/webaudio/PeriodicWave.cpp
  public _getRealImaginary(type, phase) {
    const fftSize = 4096;
    let periodicWaveSize = fftSize / 2;
    const real = new Float32Array(periodicWaveSize);
    const imag = new Float32Array(periodicWaveSize);

    let partialCount = 1;
    if (type === OscilType.custom) {

    } else {
      const partial = /^(sine|triangle|square|sawtooth)(\d+)$/.exec(type);
      if (partial) {
        partialCount = parseInt(partial[2]) + 1;
        this._partialCount = parseInt(partial[2]);
        type = partial[1];
        partialCount = Math.max(partialCount, 2);
        periodicWaveSize = partialCount;
      } else {
        this._partialCount = 0;
      }
      this._partials = [];
    }

    // https://webaudio.github.io/web-audio-api/#periodicwave
    // https://chromium.googlesource.com/chromium/blink/+/master/Source/modules/webaudio/PeriodicWave.cpp#237
    for (var n = 1; n < periodicWaveSize; ++n) {
      const piFactor = 2/(n * Math.PI);
      let b;
      switch (type) {
        case OscilType.sine:
          b = (n <= partialCount) ? 1 : 0;
          this._partials[n - 1] = b;
          break;
        case OscilType.square:
          b = (n & 1) ? 2 * piFactor : 0;
          this._partials[n - 1] = b;
          break;
        case OscilType.triangle:
          if (n & 1) {
            b = 2 * (piFactor * piFactor) * ((((n - 1) >> 1) & 1) ? -1 : 1);
          } else {
            b = 0;
          }
          this._partials[n-1] = b;
          break;
        case OscilType.sawtooth:
          b = piFactor * ((n & 1) ? 1 : -1);
          this._partials[n - 1] = b;
          break;
        case OscilType.custom:
          b = this._partials[n - 1];
          break;
        default:
          throw new TypeError('Oscillator: invalid type: ' + type);
      }
      if (b !== 0) {
        real[n] = -b * Math.sin(phase * n);
        imag[n] = b * Math.cos(phase * n);
      } else {
        real[n] = 0;
        imag[n] = 0;
      }
    }
    return [real, imag];
  }

  get type() {
    return this._type;
  }

  set type(t) {
    const coefs = this._getRealImaginary(t, this._phase);
    const periodicWave = this.context._ctx.createPeriodicWave(coefs[0], coefs[1]);
    // console.log('coefs', coefs);
    // console.log('periodicWave', periodicWave);
    this._wave = periodicWave;
    if (this._oscillator !== null) {
      this._oscillator.setPeriodicWave(this._wave);
    }
    this._type = t;
  }

  get phase() {
    return this._phase * (180 / Math.PI);
  }

  public _start(time?) {
    this._stop(time);
    this._oscillator = new Vox.VoxOscillatorNode();
    this._oscillator.setPeriodicWave(this._wave);
    this._oscillator.connect(this.output);
    this.frequency.connect(this._oscillator.frequency);
    this.detune.connect(this._oscillator.detune);

    time = this.toSeconds(time);
    this._oscillator.start(time);
  }

  public _stop(time?) {
    if (this._oscillator) {
      time = this.toSeconds(time);
      this._oscillator.stop(time);
    }
    return this;
  }

  public restart(time) {
    if (this._oscillator) {
      this._oscillator.cancelStop();
    }
    this._state.cancelAfter(this.toSeconds(time));
    return this;
  }
}

Vox.Oscillator = Oscillator;