import { Vox } from "./Vox";

export class TimeBase extends Vox {
  
  private _units;
  private _val;
  protected _defaultUnits = 's';

  public expressions = {
    n: {  //音符
      regexp: /^(\d+)n(\.?)$/i,
      method: (value, dot) => {
        value = parseInt(value);
        const scalar = dot === '.' ? 1.5 : 1;
        if (value === 1) {
          return this.beatsToUnits(this.getTimeSignature()) * scalar;
        } else {
          return this.beatsToUnits(4 / value) * scalar;
        }
      }
    },
    t: {  //3连音
      regexp: /^(\d+)t$/i,
      method: function(value) {
        value = parseInt(value);
        return this.beatsToUnits(8 / (parseInt(value) * 3));
      }
    },
    i: {  //tick
      regexp: /^(\d+)i$/i,
      method: function(value) {
        return this.ticksToUnits(parseInt(value));
      }
    },
    hz: {
      regexp: /^(\d+(?:\.\d+)?)hz$/i,
      method: function(value) {
        return this.freqcyToUnits(parseFloat(value));
      }
    },
    s: {
      regexp: /^(\d+(?:\.\d+)?)s$/,
      method: function(value) {
        return this.secondsToUnits(parseFloat(value));
      }
    },
    sample: {
      regexp: /^(\d+)samples$/,
      method: function(value) {
        return parseInt(value) / Vox.context._ctx.sampleRate;
      }
    },
    default: {
      regexp: /^(\d+(?:\.\d+))$/,
    }
  }

  constructor(val?, unit?) {
    super();

    this._val = val;
    this._units = unit;

    if (Vox.isDefined(this._units) && Vox.isString(this._val) && 
        parseFloat(this._val) === this._val && this._val.charAt(0) !== '+') {
      this._val = parseFloat(this._val);
      this._units = this._defaultUnits;
    } else if (val && val.constructor === this.constructor) { // 类型一样
      this._val = val._val;
      this._units = val._units;
    } else if (val instanceof Vox.TimeBase) {
      switch(this._defaultUnits) {
        case 's':
          this._val = val.toSeconds();
          break;
        
        case 'i':
          this._val = (val as any).toTicks();

        
      }
    }
  }

  public valueOf() {
    console.log('get call value of');
    if (Vox.isUndef(this._val)) {
      return this.now();
    } else if (Vox.isString(this._val) && Vox.isUndef(this._units)) {
      for (let key in this.expressions) {
        if (this.expressions[key].regexp.test(this._val.trim())) {
          this._units = key;
          break;
        }
      }
    }

    if (Vox.isDefined(this._units)) {
      const expression = this.expressions[this._units];
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

  public freqcyToUnits(freq) {
    console.log('timeBase freqcyToUnits');
    return 1/freq;
  }

  public beatsToUnits(beats) {
    return (60 / this.getBpm()) * beats;
  }

  // public secondsToUnits(seconds) {
  //   return seconds;
  // }

  public ticksToUnits(ticks) {
    return ticks * (this.beatsToUnits(1) / this.getPPQ());
  }
}

Vox.TimeBase = TimeBase;