import { Vox } from '../core/Vox';
import { Time } from './Time';

export class Frequency extends Vox {
  public readonly TimeObject = true;
  public readonly _defaultUnits = 'hz';
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
      this._val = val.toFrequency();
    }
  }

  get sampleRate() {
    return Vox.context._ctx.sampleRate;
  }

  public valueOf() {
    return Time.prototype.valueOf.call(this);
  }

  public toFrequency() {
    return Time.prototype.toFrequency.call(this);
  }

  public toSeconds() {
    return 1 / Time.prototype.toSeconds.call(this);
  }

  public secondsToUnits(seconds) {
    return 1 / seconds;
  }

  public beatsToUnits(beats) {
    return 1 / Time.prototype.beatsToUnits.call(this, beats);
  }

  public ticksToUnits(ticks) {
    return 1 / ((ticks * 60) / (Vox.VoxTransportCtrl.bpm.value * Vox.VoxTransportCtrl.PPQ));
  }

  public frequencyToUnits(freq) {
    return freq;
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

  public getBpm(){
    return Time.prototype.getBpm.call(this);
  }

  public getTimeSignature() {
    return Time.prototype.getTimeSignature.call(this);
  }

  public getPPQ() {
    return Time.prototype.getPPQ.call(this);
  }

  public toNote() {
    const freq = this.toFrequency();
    const log = (Math as any).log2(freq / Vox.Frequency.A4);
    let noteNumber = Math.round(12 * log) + 57;
    const octave = Math.floor(noteNumber / 12);
    if (octave < 0) {
        noteNumber += -12 * octave;
    }
    const noteName = scaleIndexToNote[noteNumber % 12];
    return noteName + octave.toString;
  }

  public toTicks() {
    const quarterTime = this.beatsToUnits(1);
    const quarters = this.valueOf() / quarterTime;
    return Math.floor(quarters * Vox.VoxTransportCtrl.PPQ);
  }

  public static A4 = 440;
  public static mtof(midi) {
    return Vox.Frequency.A4 * Math.pow(2, (midi - 69) / 12);
  }

  public static ftom(freq) {
    return 69 + Math.round(12 * (Math as any).log2(freq / Vox.Frequency.A4));
  }
}

const scaleIndexToNote = [
  'C', 'C#', 'D', 'D#', 'E',
  'F', 'F#', 'G', 'G#', 'A',
  'A#', 'B'];

const noteToScaleIndex = {
  cb: -1, c: 0, 'c#': 1,
  db:  1, d: 2, 'd#': 3,
  eb:  3, e: 4, 'e#': 5,
  fb:  4, f: 5, 'f#': 6,
  gb:  6, g: 7, 'g#': 8,
  ab:  8, a: 9, 'a#': 10,
  bb: 10, b: 11, 'b#': 12,
}

Vox.Frequency = Frequency;