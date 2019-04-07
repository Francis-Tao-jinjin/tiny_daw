import { Vox } from './Vox';
import { TransportCtrl } from './TransportCtrl';
import { Ticks } from '../Time/Ticks';

export class TransportRepeatEvent extends Vox.TransportEvent {

  public duration:Ticks;
  public _interval:Ticks;
  public _currentId:number;
  public _nextId:number;
  public _nextTick:Ticks;

  constructor(transportCtrl, opt?) {
    super(transportCtrl, opt);
    opt = opt === undefined ? {} : opt;
    opt.interval === undefined ? 1 : opt.interval;
    opt.duration === undefined ? Infinity : opt.duration;

    this._interval = new Vox.Ticks(opt.interval);
    this.duration = new Vox.Ticks(opt.duration);

    // The ID of the current timeline event
    this._currentId = -1;
    // The ID of the next timeline event
    this._nextId = -1;
    // The time of the next event
    this._nextTick = this.time;

  }

  public _restart(time) {
    this.transportCtrl.clear(this._currentId);
    this.transportCtrl.clear(this._nextId);
    this._nextTick = this.time;


  }
}