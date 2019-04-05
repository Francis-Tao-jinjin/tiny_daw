import { Vox } from '../core/Vox';
import { Envelope } from '../components/Envelope';
import { Signal } from '../signal/Signal';

export abstract class Monophonic extends Vox.Instrument {

  public portamento:number;

  public abstract envelope:Envelope;
  public abstract frequency:Signal;
  constructor(opt?) {
    opt = opt === undefined ? {} : opt;
    opt.portamento = opt.portamento === undefined ? 0 : opt.portamento;

    super(opt);

    // 滑音
    this.portamento = opt.portamento;
  }

  public getLevelAtTime(time?) {
    time = this.toSeconds(time);
    return this.envelope.getValueAtTime(time);
  }

  public triggerAttack(note, time?, velocity?) {
    time = this.toSeconds(time);
    time = this.toSeconds(time);
    this._triggerEnvelopeAttack(time, velocity);
    this.setNote(note, time);
    return this;
  }

  public triggerRelease(time?) {
    time = this.toSeconds(time);
    this._triggerEnvelopeRelease(time);
    return this;
  }

  public setNote(note, time?) {
    time = this.toSeconds(time);
    if (this.portamento > 0 && this.getLevelAtTime(time) > 0.05) {
      const portTime = this.toSeconds(this.portamento);
      this.frequency.exponentialRampTo(note, portTime, time);
    } else {
      this.frequency.setValueAtTime(note, time);
    }
    return this;
  }

  protected abstract _triggerEnvelopeAttack(time?, velocity?);
  protected abstract _triggerEnvelopeRelease(time?);

}

Vox.Monophonic = Monophonic;