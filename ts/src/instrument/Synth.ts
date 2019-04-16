import { Vox } from '../core/Vox';
import { Monophonic } from './Monophonic';
import { OscilType } from '../type';
import { Oscillator } from '../audioSource/Oscillator';
import { Signal } from '../signal/Signal';
// import { AmplitudeEnvelope } from '../components/AmplitudeEnvelope';
import { Envelope } from '../components/Envelope';

// Understanding every synthesizer in a 5 minute read
// https://medium.com/@dennisstoelwinder/understanding-every-synthesizer-in-a-5-minute-read-7af0a4a3a920
/**
 * The seven main components of a synthesizer
  1. Amplifier — also know as VCA or DCA
  2. Oscillator — also know as VCO, DCO, OSC, Frequency
  3. Filter — also known as modulator, VCF, DCF
  4. Volume envelope
  5. Filter envelope
  6. Pitch envelope
  7. LFO — low-frequency oscillator
 */

export class Synth extends Monophonic {
  
  public readonly oscillator:Oscillator;
  public readonly frequency:Signal;
  public readonly detuen:Signal;
  // public readonly envelope:AmplitudeEnvelope;
  public readonly envelope:Envelope;  

  constructor(opt?) {
    super(opt);
    opt = opt === undefined ? {} : opt;
    opt.oscillator = opt.oscillator == undefined ? { type: OscilType.triangle } : opt.oscillator;
    opt.envelope = opt.envelope === undefined ? {} : opt.envelope;
    opt.envelope.attack = opt.envelope.attack === undefined ? 0.005 : opt.envelope.attack;
    opt.envelope.decay = opt.envelope.decay === undefined ? 0.1 : opt.envelope.decay;
    opt.envelope.sustain = opt.envelope.sustain === undefined ? 0.3 : opt.envelope.sustain;
    opt.envelope.release = opt.envelope.release === undefined ? 0.5 : opt.envelope.release;
    
    this.oscillator = new Vox.Oscillator(opt.oscillator);
    this.frequency = this.oscillator.frequency;
    this.detuen = this.oscillator.detune;
    // this.envelope = new Vox.AmplitudeEnvelope(opt.envelope);
    this.envelope = new Vox.Envelope(opt.envelope);
    this.oscillator.connect(this.envelope);
    this.envelope.connect(this.output);
  }

  protected _triggerEnvelopeAttack(time, velocity) {
    this.envelope.triggerAttack(time, velocity);
    this.oscillator.start(time);
    console.log('## oscillator start', time);
    if (this.envelope.sustain === 0) {
      this.oscillator.stop(time + this.envelope.attack + this.envelope.decay);
    }
    return this;
  }

  protected _triggerEnvelopeRelease(time) {
    time = this.toSeconds(time);
    this.envelope.triggerRelease(time);
    this.oscillator.stop(time + this.envelope.release);
    console.log('@@ oscillator stop', time + this.envelope.release);
    return this;
  }
}

Vox.Synth = Synth;