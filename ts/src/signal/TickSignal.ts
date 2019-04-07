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

    console.log('new TickSignal, value =', value);
    console.log('this.units', this.units);
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
    if (event === null) {
      event = {
        ticks: 0,
        time: 0
      };
    } else if (Vox.isUndef(event.ticks)) {
      const previousEvent = this._timelineEv.previousEvent(event);
      event.ticks = this._getTickUntilEvent(previousEvent, event.time);
    }
    const val0 = this.getValueAtTime(event.time);
    let val1 = this.getValueAtTime(time);

    if (this._timelineEv.getMostRecent(time).time === time && 
        this._timelineEv.getMostRecent(time).type === Vox.VoxAudioParam.ActionType.SetValue) {
      val1 = this.getValueAtTime(time - this.sampleTime);
    }
    return 0.5 * (time - event.time) * (val0 + val1) + event.ticks;
  }

  public getTicksAtTime(time) {
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
    return new Vox.Time(this.getDurationOfTicks(ticks, when));
  }

  public getDurationOfTicks(ticks, time?) {
    time = this.toSeconds(time);
    const currentTick = this.getTicksAtTime(time);
    return this.getTimeOfTick(currentTick + ticks) - time;
  }

  public timeToTicks(duration, when?) {
    when = this.toSeconds(when);
    duration = this.toSeconds(duration);
    const startTicks = this.getTicksAtTime(when);
    const endTicks = this.getTicksAtTime(when + duration);
    return new Vox.Ticks(endTicks - startTicks);
  }
}

Vox.TickSignal = TickSignal;