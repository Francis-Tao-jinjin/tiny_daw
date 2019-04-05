import { Vox } from './Vox';
import { PlayState } from '../type';
import { TickSource } from '../audioSource/TickSource';
import { TickSignal } from '../signal/TickSignal';
import { TimelineState } from './TimelineState';

export class Clock extends Vox {
  
  private _nextTick = 0;
  private _tickSource:TickSource;
  private _lastUpdate = 0;
  private _state:TimelineState;
  public readonly frequency:TickSignal;
  public callback:Function;

  private _boundLoop:Function;

  constructor(opt?:{callback?:(p:any) => void, frequency?:number}) {
    super();
    opt = opt === undefined ? {} : opt;
    this.callback = opt.callback === undefined ? () => {} : opt.callback;
    opt.frequency = opt.callback === undefined ? 1 : opt.frequency;
    this._tickSource = new Vox.TickSource(opt.frequency);
    this.frequency = this._tickSource.frequency;
    
    this._state = new Vox.TimelineState(PlayState.Stopped);
    this._state.setStateAtTime(PlayState.Stopped, 0);

    this._boundLoop = this._loop.bind(this);

    Vox.context.on('tick', this._boundLoop);
  }

  get ticks() {
    return Math.ceil(this._tickSource.getTicksAtTime(this.now()));
  }

  set ticks(t) {
    this._tickSource.ticks = t;
  }

  get seconds() {
    return this._tickSource.seconds;
  }

  set seconds(s) {
    this._tickSource.seconds = s;
  }

  public getSecondsAtTime(time) {
    return this._tickSource.getSecondsAtTime(time);
  }

  public setTicksAtTime(ticks, time) {
    this._tickSource.setTicksAtTime(ticks, time);
    return this;
  }

  public getTicksAtTime(time) {
    return this._tickSource.getTicksAtTime(time);
  }

  private _loop() {
    const startTime = this._lastUpdate;
    const endTime = this.now();
    this._lastUpdate = endTime;
    // console.log('startTime:', startTime);
    // console.log('endTime:', endTime);

    if (startTime !== endTime) {
      this._state.forEachBetween(startTime, endTime, (e) => {
        switch (e.state) {
          case PlayState.Started:
            const offset = this._tickSource.getTicksAtTime(e.time);
            this.emit(['start', e.time, offset]);
            break;
          case PlayState.Stopped:
            if (e.time !== 0) {
              this.emit(['stop', e.time]);
            }
            break;
          case PlayState.Paused:
            this.emit(['pause', e.time]);
            break;
        }
      });
      this._tickSource.forEachTickBetween(startTime, endTime, (time, ticks) => {
        console.log('time', time);
        console.log('ticks', ticks);

        this.callback(time, ticks);
      });
    }
  }

  public getStateAtTime(time) {
    time = this.toSeconds(time);
    return this._state.getRecentValueAtTime(time);
  }

  public start(time, offset) {
    Vox.context._ctx.resume();
    
    time = this.toSeconds(time);
    if (this._state.getRecentValueAtTime(time) !== PlayState.Started) {
      this._state.setStateAtTime(PlayState.Started, time);
      this._tickSource.start(time, offset);
      if (time < this._lastUpdate) {
        this.emit(['start', time, offset]);
      }
    }
    return this;
  }

  public stop(time?) {
    time = this.toSeconds(time);
    this._state.cancelAfter(time);
    this._state.setStateAtTime(PlayState.Stopped, time);
    this._tickSource.stop(time);
    if (time < this._lastUpdate) {
      this.emit(['stop', time]);
    }
    return this;
  }

  public pause(time) {
    time = this.toSeconds(time);
    if (this._state.getRecentValueAtTime(time) === PlayState.Started) {
      this._state.setStateAtTime(PlayState.Paused, time);
      if (time < this._lastUpdate) {
        this.emit(['pause', time]);
      }
    }
    return this;
  }
}

Vox.Clock = Clock;