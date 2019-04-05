import { Vox } from '../core/Vox';
import { Monophonic } from './Monophonic';
import { OscilType } from '../type';
import { Oscillator } from '../audioSource/Oscillator';
import { Signal } from '../signal/Signal';
import { AmplitudeEnvelope } from '../components/AmplitudeEnvelope';

export class Synth extends Monophonic {
  
  public readonly oscillator:Oscillator;
  public readonly frequency:Signal;
  public readonly detuen:Signal;
  public readonly envelope:AmplitudeEnvelope;

  constructor(opt?) {
    super(opt);
    opt = opt === undefined ? {} : opt;
    opt.oscillator = opt.oscillator == undefined ? { type: OscilType.triangle } : opt.oscillator;
    opt.envelope = opt.envelope === undefined ? {} : opt.envelope;
    opt.envelope.attack = opt.envelope.attack === undefined ? 0.005 : opt.envelope.attack;
    opt.envelope.decay = opt.envelope.decay === undefined ? 0.1 : opt.envelope.decay;
    opt.envelope.sustain = opt.envelope.sustain === undefined ? 0.3 : opt.envelope.sustain;
    opt.envelope.release = opt.envelope.release === undefined ? 1 : opt.envelope.release;
    
    this.oscillator = new Vox.Oscillator(opt.oscillator);
    this.frequency = this.oscillator.frequency;
    this.detuen = this.oscillator.detune;
    this.envelope = new Vox.AmplitudeEnvelope(opt.envelope);
    
    this.oscillator.connect(this.envelope);
    this.envelope.connect(this.output);
  }

  protected _triggerEnvelopeAttack(time, velocity) {
    this.envelope.triggerAttack(time, velocity);
    this.oscillator.start(time);
    if (this.envelope.sustain === 0) {
      this.oscillator.stop(time + this.envelope.attack + this.envelope.decay);
    }
    return this;
  }

  protected _triggerEnvelopeRelease(time) {
    time = this.toSeconds(time);
    this.envelope.triggerRelease(time);
    this.oscillator.stop(time + this.envelope.release);
    return this;
  }
}

Vox.Synth = Synth;