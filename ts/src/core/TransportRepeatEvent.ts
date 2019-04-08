import { Vox } from './Vox';
import { TransportCtrl } from './TransportCtrl';
import { Ticks } from '../Time/Ticks';

export class TransportRepeatEvent extends Vox.TransportEvent {

  public duration:Ticks;
  public _interval:Ticks;
  public _currentId:number;
  public _nextId:number;
  public _nextTick:number;

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
    this._nextTick = this.time.valueOf();

  }

  private _restart(time) {
    const t_ticks = this.time.valueOf();
    const t_interval = this._interval.valueOf();

    this.transportCtrl.clear(this._currentId);
    this.transportCtrl.clear(this._nextId);
    this._nextTick = t_ticks;
    const ticks = this.transportCtrl.getTicksAtTime(time);
    if (ticks > t_ticks) {
      this._nextTick = this.time.valueOf() + Math.ceil((ticks - t_ticks) / t_interval) * t_interval;
    }
    this._currentId = this.transportCtrl.scheduleOnce(this.invoke.bind(this), new Vox.Ticks(this._nextTick));
    this._nextTick += t_interval;
    this._nextId = this.transportCtrl.scheduleOnce(this.invoke.bind(this), new Vox.Ticks(this._nextTick));
  }

  public Invoke(time) {
    
  }

  private _createEvents(time) {
    const t_ticks = this.time.valueOf();
    const t_interval = this._interval.valueOf();

    const ticks = this.transportCtrl.getTicksAtTime(time);
    if (ticks >= t_ticks && ticks >= this._nextTick &&
        this._nextTick + t_interval < t_ticks + this.duration) {

    }
  }
}