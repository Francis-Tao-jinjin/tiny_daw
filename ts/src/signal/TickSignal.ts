import { Vox } from '../core/Vox';
import { VoxType } from '../type';

export class TickSignal extends Vox.Signal{
  
  constructor(value?:number) {
    value = value === undefined ? 1 : value;
    super({units:VoxType.Ticks, value:value});
    
    this._timelineEv.memory = Infinity;
    this.cancelScheduledValues(0);
    this._timelineEv.add({
      type: Vox.VoxAudioParam.ActionType.SetValue,
      time: 0,
      value: value,
    });
  }

  private _wrapScheduleMethods(method) {
    const self = this;
    return function (value, time) {
      time = self.toSeconds(time);
      method.apply(self, arguments);
      const event = self._timelineEv.getMostRecent(time);

    }
  }

  private _getTickUntilEvent(event?, time?:number) {
    
    const val0 = this.getValueAtTime(event.time);
    let val1 = this.getValueAtTime(time);

    if (this._timelineEv.getMostRecent(time).time === time && 
        this._timelineEv.getMostRecent(time).type === Vox.VoxAudioParam.ActionType.SetValue) {
      val1 = this.getValueAtTime(time - this.sampleTime);
    }
    return 0.5 * (time - event.time) * (val0 + val1) + event.ticks;
  }

  private getTicksAtTime(time) {
    time = this.toSeconds(time);
    const event = this._timelineEv.getMostRecent(time);
    return Math.max(this._getTickUntilEvent(event, time), 0);
  }

  public getTimeOfTick(tick) {
    const recent = this._timelineEv.getMostRecent(tick, 'ticks');
    const after = this._timelineEv.getAfter(tick, 'ticks');
    if (recent && recent.ticks === tick) {
      return recent.time;
    } else if (recent && after && 
      after.type === Vox.VoxAudioParam.ActionType.Linear &&
      recent.value !== after.value) {
      const val0 = this.getValueAtTime(recent.time);
      const val1 = this.getValueAtTime(after.time);
      const delta = (val1 - val0) / (after.time - recent.time);
      const k = Math.sqrt(Math.pow(val0, 2) - 2 * delta * (recent.ticks - tick));
      const sol1 = (-val0 + k) / delta;
      const sol2 = (-val1 - k) / delta;
      return (sol1 > 0 ? sol1 : sol2) + recent.time;
    } else if (recent) {
      if (recent.value === 0) {
        return Infinity;
      } else {
        return recent.time + (tick - recent.ticks) / recent.value;
      }
    } else {
      return tick / this._initValue;
    }
  }

  public ticksToTime(ticks, when) {
    when = this.toSeconds(when);
  }

  public getDurationOfTicks(ticks, time?:number) {
    time = this.toSeconds(time);
    const currentTick = this.getTicksAtTime(time);
    return this.getTimeOfTick(currentTick + ticks) - time;
  }
}

Vox.TickSignal = TickSignal;