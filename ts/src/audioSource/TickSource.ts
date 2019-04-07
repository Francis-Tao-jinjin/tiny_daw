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

  public getTimeOfTick(tick, before?) {
    before = before === undefined ? this.now() : before;
    const offset = this._tickOffset.getMostRecent(before);
    const event = this._state.getMostRecent(before);
    const startTime = Math.max(offset.time, event.time);
    const absoluteTicks = this.frequency.getTicksAtTime(startTime);
    return this.frequency.getTimeOfTick(absoluteTicks);
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
    const stopEvent = this._state.getLastState(PlayState.Stopped, time);
    const tmpEvent = {
      state: PlayState.Paused,
      time : time,
    };
    this._state.add(tmpEvent);

    let lastState = stopEvent;
    let elapsedTicks = 0;

    this._state.forEachBetween(stopEvent.time, time + this.sampleTime, (e) => {
      let periodStartTime = lastState.time;
      const offsetEvent = this._tickOffset.getMostRecent(e.time);
      if (offsetEvent.time >= lastState.time) {
        elapsedTicks = offsetEvent.ticks;
        periodStartTime = offsetEvent.time;
      }
      if (lastState.state === PlayState.Started && e.state !== PlayState.Started) {
        elapsedTicks += this.frequency.getTicksAtTime(e.time) - this.frequency.getTicksAtTime(periodStartTime);
      }
      lastState = e;
    });
    this._state.remove(tmpEvent);
    return elapsedTicks;
  }

  get ticks() {
    return this.getTicksAtTime(this.now());
  }

  set ticks(t) {
    this.setTicksAtTime(t, this.now());
  }

  get seconds() {
    return this.getSecondsAtTime(this.now());
  }

  set seconds(s) {
    const now = this.now();
  }

  get state() {
    return this._state.getRecentValueAtTime(this.now());
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

  public start(time?, offset?) {
    time = this.toSeconds(time);
    if (this._state.getRecentValueAtTime(time) !== PlayState.Started) {
      this._state.setStateAtTime(PlayState.Started, time);
      if (Vox.isDefined(offset)) {
        this.setTicksAtTime(offset, time);
      }
    }
    return this;
  }

  public pause(time) {
    time = this.toSeconds(time);
    if (this._state.getRecentValueAtTime(time) === PlayState.Started) {
      this._state.setStateAtTime(PlayState.Paused, time);
    }
    return this;
  }

  public stop(time) {
    time = this.toSeconds(time);
    if (this._state.getRecentValueAtTime(time) === PlayState.Stopped) {
      const event = this._state.getMostRecent(time);
      if (event.time > 0) {
        this._tickOffset.cancelAfter(event.time);
        this._state.cancelAfter(event.time);
      }
    }
    this._state.cancelAfter(time);
    this._state.setStateAtTime(PlayState.Stopped, time);
    this.setTicksAtTime(0, time);
    return this;
  }

  public forEachTickBetween(startTime, endTime, callback) {
    // 
    let lastStateEvent = this._state.getMostRecent(startTime);
    this._state.forEachBetween(startTime, endTime, (event) => {
      if (lastStateEvent.state === PlayState.Started && event.state !== PlayState.Started) {
        this.forEachTickBetween(Math.max(lastStateEvent.time, startTime), event.time - this.sampleTime, callback);
      }
      lastStateEvent = event;
    });
    // console.log('lastStateEvent', lastStateEvent);
    startTime = Math.max(lastStateEvent.time, startTime);
    if (lastStateEvent.state === PlayState.Started && this._state) {
      const startTicks = this.frequency.getTicksAtTime(startTime);
      const ticksAtStart = this.frequency.getTicksAtTime(lastStateEvent.time);
      const diff = startTicks - ticksAtStart;
      let offset = diff % 1;
      if (offset !== 0) {
        offset = 1 - offset;
      }
      let nextTickTime = this.frequency.getTimeOfTick(startTicks + offset);
      while (nextTickTime < endTime && this._state) {
        try {
          const tick = Math.round(this.getTicksAtTime(nextTickTime));
          callback(nextTickTime, tick);
        } catch(e) {
          console.log('error', e);
          break;
        }
        if (this._state) {
          nextTickTime += this.frequency.getDurationOfTicks(1, nextTickTime);
        }
      }
    }
    return this;
  }
}

Vox.TickSource = TickSource;

