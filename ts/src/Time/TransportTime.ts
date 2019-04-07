import { Vox } from '../core/Vox';
import { Time } from './Time';

export class TransportTime extends Vox {
  public readonly TimeObject = true;
  public readonly _defaultUnits = 's';
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
      this._val = val.toSeconds();
    }
  }

  public now() {
    return Vox.VoxTransportCtrl.seconds;
  }

  get sampleRate() {
    return Vox.context._ctx.sampleRate;
  }

  public valueOf() {
    return Time.prototype.valueOf.call(this);
  }

  public toSeconds() {
    return Time.prototype.toSeconds.call(this);
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

  public toTicks() {
    return Time.prototype.toTicks.call(this);
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
    return Time.prototype.secondsToUnits.call(this, seconds);
  }

  public ticksToUnits(ticks) {
    return Time.prototype.ticksToUnits.call(this, ticks);
  }
}

Vox.TransportTime = TransportTime;