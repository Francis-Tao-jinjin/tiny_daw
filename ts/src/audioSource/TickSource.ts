import { Vox } from '../core/Vox';
import { TickSignal } from '../signal/TickSignal';
import { TimelineState } from '../core/TimelineState';
import { PlayState } from '../type';
import { Timeline } from '../core/Timeline';

export class TickSource extends Vox{

  public readonly frequency:TickSignal;

  private _tickOffset:Timeline;
  private _state:TimelineState;
  constructor(frequency?:number) {
    super();
    frequency = frequency === undefined ? 1 : frequency;
    this.frequency = new Vox.TickSignal(frequency);
    
    this._state = new Vox.TimelineState(PlayState.Stopped);
    this._state.setStateAtTime(PlayState.Stopped, 0);
    this._tickOffset = new Vox.Timeline(Infinity);
    this.setTicksAtTime(0, 0);
  }

  public setTicksAtTime(ticks, time) {
    time = this.toSeconds(time);
    this._tickOffset.cancelAfter(time);
    this._tickOffset.add({
      time: time,
      ticks: ticks,
      seconds: this.frequency.getDurationOfTicks(ticks, time),
    });
    return this;
  }

  public getTicksAtTime(time) {
    time = this.toSeconds(time);
    
  }

  get seconds() {
    return this.getSecondsAtTime(this.now());
  }

  public getSecondsAtTime(time) {
    time = this.toSeconds(time);
    const stopEvent = this._state.getLastState(PlayState.Stopped, time);
    const tmpEvent = { state: PlayState.Paused, time: time };
    this._state.add(tmpEvent); 

    let lastState = stopEvent;
    let elapsedSeconds = 0;

    this._state.forEachBetween(stopEvent.time, time + this.sampleTime, (e) => {
      let periodStartTime = lastState.time;
      const offsetEvent = this._tickOffset.getMostRecent(e.time);
      if (offsetEvent.time >= lastState.time) {
        elapsedSeconds = offsetEvent.seconds;
        periodStartTime = offsetEvent.time;
      }
      if (lastState.state === PlayState.Started && e.state !== PlayState.Started) {
        elapsedSeconds += e.time - periodStartTime;
      }
      lastState = e;
    });
    this._state.remove(tmpEvent);
    return elapsedSeconds;
  }
}

Vox.TickSource = TickSource;

