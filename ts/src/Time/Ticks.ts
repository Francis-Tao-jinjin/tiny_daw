import { Vox } from '../core/Vox';
import { Time } from './Time';

export class Ticks extends Vox {
  public readonly TimeObject = true;
  public readonly _defaultUnits = 'i';
  public _units;
  private _val;

  constructor(val?, unit?) {
    super();

    this._val = val;
    this._units = unit;

    if (this._units !== undefined && Vox.isString(this._val) &&
        !!parseFloat(this._val) && this._val.charAt(0) !== '+') {
      this._val = parseFloat(this._val);
      this._units = this._defaultUnits;
    } else if (val && val.constructor === this.constructor) {
      this._val = val.val;
      this._units = val._units;
    } else if (val.TimeObject === true) {
      this._val = val.toTicks();
    }
  }
  
  public now() {
    return Vox.VoxTransportCtrl.ticks;
  }

  get sampleRate() {
    return Vox.context._ctx.sampleRate;
  }

  public valueOf() {
    return Time.prototype.valueOf.call(this);
  }

  public beatesToUnits(beats) {
    return this.getPPQ() * beats;
  }

  public ticksToUnits(ticks) {
    return ticks;
  }

  public toTicks() {
    return this.valueOf();
  }

  public getBpm(){
    return Time.prototype.getBpm.call(this);
  }

  public getTimeSignature() {
    return Time.prototype.getTimeSignature.call(this);
  }

  public getPPQ() {
    return Time.prototype.getPPQ.call(this);
  }

  public frequencyToUnits(freq) {
    return Time.prototype.frequencyToUnits.call(this, freq);
  }

  public beatsToUnits(beats) {
    return Time.prototype.beatsToUnits.call(this, beats);
  }

  public secondsToUnits(seconds) {
    console.log('call Ticks secondsToUnits', seconds);
    return Math.floor(seconds / (60 / this.getBpm())) * this.getPPQ();
  }

  public toSeconds() {
    return (this.valueOf() / this.getPPQ()) * (60 / this.getBpm());
  }

  public toFrequency() {
    return Time.prototype.toFrequency.call(this);
  }

  public toSamples() {
    return Time.prototype.toSamples.call(this);
  }
  
  public toMilliseconds(){
    return Time.prototype.toMilliseconds.call(this);
  }

  public toNotation() {
    return Time.prototype.toNotation.call(this);
  }
}

Vox.Ticks = Ticks;