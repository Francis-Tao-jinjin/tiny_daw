import { Vox } from './Vox';
import { PlayState } from '../type';
import { TickSource } from '../audioSource/TickSource';
import { TickSignal } from '../signal/TickSignal';

export class Clock extends Vox {
  
  private _nextTick = 0;
  private _tickSource:TickSource;
  private _lastUpdate = 0;
  private _state;
  public readonly frequency:TickSignal;
  public callback:(p:any) => void;
  constructor(opt?:{callback?:(p:any) => void, frequency?:number}) {
    super();
    opt = opt === undefined ? {} : opt;
    opt.callback = opt.callback === undefined ? () => {} : opt.callback;
    opt.frequency = opt.callback === undefined ? 1 : opt.frequency;
    this._tickSource = new Vox.TickSource(opt.frequency);
    this.frequency = this._tickSource.frequency;
    
    this._state = new Vox.TimelineState(PlayState.Stopped);
    this._state.setStateAtTime(PlayState.Stopped);

  }

  private _loop() {
    const startTime = this._lastUpdate;
    const endTime = this.now();
    this._lastUpdate = endTime;

    if (startTime !== endTime) {
    }
  }

  public getStateAtTime(time) {
    time = this.toSeconds(time);
    return this._state.getRecentValueAtTime(time);
  }
}

Vox.Clock = Clock;