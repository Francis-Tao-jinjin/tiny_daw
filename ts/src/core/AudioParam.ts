import { Vox } from './Vox';
import { VoxType } from '../type';
import { Timeline } from './Timeline';

export class VoxAudioParam extends Vox.VoxAudioNode {
  protected _param:AudioParam;
  protected _timelineEv:Timeline;
  protected _initValue:number;

  protected _miniOutput = 1e-5;
  
  public input;
  public units:VoxType;
  public convert:boolean;

  public overridden = false;
  public static ActionType = {
    Linear: 'linearRampToValueAtTime',
    Exponential: 'exponentialRampToValueAtTime',
    Target: 'setTargetAtTime',
    SetValue: 'setValueAtTime',
    Cancel : 'cancelScheduledValues',
  }

  constructor(opt:{param?:AudioParam, units:VoxType, convert?:boolean, value?:number}) {
    super();
    this._param = this.input = opt.param;
    this.units = opt.units;
    this.convert = (opt.convert === undefined ? true : opt.convert);
    this._timelineEv = new Vox.Timeline(1000);
    if (Vox.isDefined(opt.value) && this._param) {
      this.setValueAtTime(opt.value, 0);
    }
  }

  get value() {
    return this._toUnits(this.getValueAtTime(this.now()));
  }

  set value(val) {
    this._initValue = this._fromUnits(val);
    this.cancelScheduledValues(this.now());
    this.setValueAtTime(val, this.now());
  }

  public cancelScheduledValues(time) {
    time = this.toSeconds(time);
    this._timelineEv.cancelAfter(time);
    this._param.cancelScheduledValues(time);
    console.log('cancelScheduledValues', time);
    return this;
  }

  public cancelAndHoldAtTime(time) {
    const valueAtTime = this.getValueAtTime(time);
    console.log('cancelScheduledValues', time, 'value = ', valueAtTime);
    this._param.cancelScheduledValues(time);
    const recent = this._timelineEv.getMostRecent(time);
    const after = this._timelineEv.getAfter(time);
    if (recent && recent.time === time) {
      if (after) {
        this._timelineEv.cancelAfter(after.time);
      } else {
        this._timelineEv.cancelAfter(time + this.sampleTime);
      }
    } else if (after) {
      this._timelineEv.cancelAfter(after.time);
      if (after.type === VoxAudioParam.ActionType.Linear) {
        this.linearRampToValueAtTime(valueAtTime, time);
      } else if (after.type === VoxAudioParam.ActionType.Exponential) {
        this.exponentialRampToValueAtTime(valueAtTime, time);
      }
    }

    this._timelineEv.add({
      type: VoxAudioParam.ActionType.SetValue,
      value: valueAtTime,
      time: time,
    });
    this._param.setValueAtTime(valueAtTime, time);
    return this;
  }

  public setValueAtTime(value, time) {
    time = this.toSeconds(time);
    value = this._fromUnits(value);
    this._timelineEv.add({
      time,
      value,
      type: VoxAudioParam.ActionType.SetValue,
    });
    this._param.setValueAtTime(value, time);
    console.log(VoxAudioParam.ActionType.SetValue, value, time);
    return this;
  }

  public setRampPoint(time) {
    time = this.toSeconds(time);
    let currentVal = this.getValueAtTime(time);
    this.cancelAndHoldAtTime(time);
    if (currentVal === 0) {
      currentVal = this._miniOutput;
    }
    this.setValueAtTime(this._toUnits(currentVal), time);
    return this;
  }

  public targetRampTo(value:number, rampTime:number, startTime:number) {
    startTime = this.toSeconds(startTime);
    this.setRampPoint(startTime);
    this.exponentialApproachValueAtTime(value, startTime, rampTime);
    return this;
  }

  // 没有 startTime 就默认是当前时间
  public exponentialRampTo(value:number, rampTime:number, startTime?:number) {
    startTime = this.toSeconds(startTime);
    this.setRampPoint(startTime);
    this.exponentialRampToValueAtTime(value, startTime + this.toSeconds(rampTime));
    return this;
  }

  // 没有 startTime 就默认是当前时间
  public linearRampTo(value:number, rampTime:number, startTime?:number) {
    startTime = this.toSeconds(startTime);
    this.setRampPoint(startTime);
    this.linearRampToValueAtTime(value, startTime + this.toSeconds(rampTime));
    return this;
  }

  public exponentialApproachValueAtTime(value, time, rampTime) {
    const timeConstant = Math.log(this.toSeconds(rampTime)+1)/Math.log(200);
    time = this.toSeconds(time);
    return this.setTargetAtTime(value, time, timeConstant);
  }

  public linearRampToValueAtTime(value, endTime) {
    value = this._fromUnits(value);
    endTime = this.toSeconds(endTime);
    this._timelineEv.add({
      type: VoxAudioParam.ActionType.Linear,
      value: value,
      time: endTime,
    });
    console.log(VoxAudioParam.ActionType.Linear, value, endTime);
    this._param.linearRampToValueAtTime(value, endTime);
    return this;
  }

  public exponentialRampToValueAtTime(value, endTime) {
    value = this._fromUnits(value);
    value = Math.max(this._miniOutput, value);
    endTime = this.toSeconds(endTime);
    this._timelineEv.add({
      type: VoxAudioParam.ActionType.Exponential,
      time: endTime,
      value: value,
    });
    console.log(VoxAudioParam.ActionType.Exponential, value, endTime);
    this._param.exponentialRampToValueAtTime(value, endTime);
    return this;
  }

  public _toUnits(value) {
    if (this.convert || Vox.isDefined(this.convert)) {
      if (this.units === VoxType.Decibels) {
        return this.gainToDb(value);
      } else {
        return value;
      }
    } else {
      return value;
    }
  }

  public _fromUnits = function(value) {
    if (this.convert || Vox.isUndef(this.convert)) {
      switch (this.units) {
        case VoxType.Time:
          return this.toSeconds(value);
        case VoxType.Decibels:
          return this.dbToGain(value);
        default:
          return value;
      }
    } else {
      return value;
    }
  }

  public setTargetAtTime(value, startTime, timeConstant) {
    value = this._fromUnits(value);
    if (timeConstant <= 0) {
      throw new Error("timeConstant must be greater than 0");
    }

    startTime = this.toSeconds(startTime);
    this._timelineEv.add({
      type: VoxAudioParam.ActionType.Target,
      value: value,
      time: startTime,
      constant: timeConstant,
    });
    console.log('setTargetAtTime', value, startTime, timeConstant);
    this._param.setTargetAtTime(value, startTime, timeConstant);
    return this;
  }

  public getValueAtTime(time) {
    time = this.toSeconds(time);
    const after = this._timelineEv.getAfter(time);
    const recent = this._timelineEv.getMostRecent(time);
    const initValue = (this._initValue !== undefined) ? this._initValue : this._param.defaultValue;
    let value = initValue;
    if (recent === null) {
      value = initValue;
    } else if (recent.type === VoxAudioParam.ActionType.Target) {
      let previous = this._timelineEv.getBefore(recent.time);
      let previousVal;
      if (previous === null) {
        previousVal = initValue;
      } else {
        previousVal = previous.value;
      }
      value = this._exponentialApproach(recent.time, previousVal, recent.value, recent.constant, time);
    } else if (after === null) {
      value = recent.value;
    } else if (after.type === VoxAudioParam.ActionType.Linear) {
      value = this._linearInterpolate(recent.time, recent.value, after.time, after.value, time);
    } else if (after.type === VoxAudioParam.ActionType.Exponential) {
      value = this._exponentialInterpolate(recent.time, recent.value, after.time, after.value, time);
    } else {
      value = recent.value;
    }
    return value;
  }

  private _exponentialApproach(t0, v0, v1, timeConstant, t) {
    return v1 + (v0 - v1) * Math.exp(-(t - t0) / timeConstant);
  }

  private _linearInterpolate(t0, v0, t1, v1, t) {
    return v0 + (v1 - v0) * ((t - t0) / (t1 - t0));
  }

  private _exponentialInterpolate(t0, v0, t1, v1, t) {
    return v0 * Math.pow(v1 / v0, (t - t0) / (t1 - t0));
  }
}

Vox.VoxAudioParam = VoxAudioParam;