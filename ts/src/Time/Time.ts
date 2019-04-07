import { Vox } from '../core/Vox';
import { expressions } from './RegexTest';

export class Time extends Vox {
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

  public valueOf():number {
    if (Vox.isUndef(this._val)) {
      return this.now();
    } else if (Vox.isString(this._val) && Vox.isUndef(this._units)) {
      for (let key in expressions) {
        if (expressions[key].regexp.test(this._val.trim())) {
          this._units = key;
          break;
        }
      }
    }
    if (Vox.isDefined(this._units)) {
      const expression = expressions[this._units];
      const matching = this._val.toString().trim().match(expression.regexp);
      if (matching) {
        return expression.method.apply(this, matching.slice(1));
      } else {
        return expression.method.call(this, parseFloat(this._val));
      }
    } else {
      return this._val;
    }
  }

  get sampleRate() {
    return Vox.context._ctx.sampleRate;
  }

  public toSeconds() {
    return this.valueOf();
  }

  public toFrequency() {
    return 1 / this.toSeconds();
  }

  public toSamples() {
    return this.toSeconds() * Vox.context._ctx.sampleRate;
  }

  public toMilliseconds() {
    return this.toSeconds() * 1000;
  }

  public getBpm() {
    if(Vox.VoxTransportCtrl) {
      return Vox.VoxTransportCtrl.bpm.value;
    } else {
      return 120;
    }
  }

  public getTimeSignature() {
    if (Vox.VoxTransportCtrl) {
      return Vox.VoxTransportCtrl.timeSignature;
    } else {
      return 4;
    }
  }

  public getPPQ() {
    if (Vox.VoxTransportCtrl) {
      return Vox.VoxTransportCtrl.PPQ;
    } else {
      return 192;
    }
  }

  public frequencyToUnits(freq) {
    console.log('timeBase freqcyToUnits');
    return 1/freq;
  }

  public beatsToUnits(beats) {
    return (60 / this.getBpm()) * beats;
  }

  public secondsToUnits(seconds) {
    console.log('call TimeBase secondsToUnits', seconds);
    return seconds;
  }

  public ticksToUnits(ticks) {
    return ticks * (this.beatsToUnits(1) / this.getPPQ());
  }

  public toNotation() {
    const time = this.toSeconds();
    const testNotations = ['1m'];
    for (let power = 1; power < 8; power++) {
      const subdiv = Math.pow(2, power);
      testNotations.push(subdiv + 'n.');
      testNotations.push(subdiv + 'n');
      testNotations.push(subdiv + 't');
    }
    testNotations.push('0');
    
    let closest = testNotations[0];
    let closestSeconds = (new Vox.Time(testNotations[0])).toSeconds();
    testNotations.forEach((notation) => {
      const notationSeconds = (new Vox.Time(notation)).toSeconds();
      if (Math.abs(notationSeconds - time) < Math.abs(closestSeconds - time)) {
        closest = notation;
        closestSeconds = notationSeconds;
      }
    });
    return closest;
  }

  public toTicks() {
    const quarterTime = this.beatsToUnits(1);
    const quarters = this.valueOf() / quarterTime;
    return Math.round(quarters * this.getPPQ());
  }
}

Vox.Time = Time;