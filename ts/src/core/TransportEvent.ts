import { Vox } from './Vox';
import { TransportCtrl } from './TransportCtrl';
import { Ticks } from './Ticks';

export class TransportEvent extends Vox {

  static _eventId = 0;

  public transportCtrl:TransportCtrl;
  public id:number;
  public time:Ticks;
  public callback = (time:any) => {};
  private _once:boolean;

  constructor(transportCtrl, opt?) {
    super();
    this.transportCtrl = transportCtrl;
    
    opt = opt === undefined ? {} : opt;
    this._once = opt.once === undefined ? false : opt.once;
    this.callback = opt.callback === undefined ? () => {} : opt.callback;
    this.id = Vox.TransportEvent._eventId++;
    this.time = new Vox.Ticks(opt.time);
    
  }

  public invoke(time) {
    if (this.callback) {
      this.callback(time);
      if (this._once && this.transportCtrl) {
        this.transportCtrl.clear(this.id);
      }
    }
  }

}

Vox.TransportEvent = TransportEvent;