import { Vox } from './Vox';
import { VoxTick } from '../type';
import { Timeline } from './Timeline';
import { VoxMaster } from './Master';

class Ticker {
  private _type;
  private _updateInterval:number;
  private _callback:() => void;
  private _timeout:NodeJS.Timer;
  private _worker:Worker;

  constructor(callback, type, updateInterval) {
    this._type = type;
    this._updateInterval = updateInterval;
    this._callback = callback;
  }

  private _createWorker() {
    const _URL:(typeof window.URL) = window.URL || (window as any).webkitURL;
    const blob = new Blob([`
      //the initial timeout time
      var timeoutTime = ${(this._updateInterval * 1000).toFixed(1)};
      //onmessage callback
      self.onmessage = function(msg){
      	timeoutTime = parseInt(msg.data);
      };
      //the tick function which posts a message
      //and schedules a new tick
      function tick(){
      	setTimeout(tick, timeoutTime);
      	self.postMessage('tick');
      }
      //call tick initially
      tick();
    `]);
    const blobUrl = _URL.createObjectURL(blob);
    const worker = new Worker(blobUrl);

    worker.onmessage = () => {
      this._callback();
    };
    this._worker = worker;
  }

  private _createTimeout() {
    this._timeout = setTimeout(() => {
      this._createTimeout();
      this._callback();
    }, this._updateInterval * 1000);
  }

  private createClock() {
    if (this._type === VoxTick.Worker) {
      try {
        this._createWorker();
      } catch(e) {
        this._type = VoxTick.Timeout;
        this._createTimeout();
      }
    } else if (this._type === VoxTick.Timeout) {
      this._createTimeout();
    }
  }

  private _disposeClock() {
    if (this._timeout) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
    if (this._worker) {
      this._worker.terminate();
      this._worker.onmessage = null;
      this._worker = null;
    }
  }

  private dispose() {
    this._disposeClock();
    this._callback = null;
  }
}

export class VoxContext extends Vox {

  public _ctx:AudioContext;
  
  public lookAhead:number;
  private _latencyHint:string;
  private _constants;
  private _computedUpdateInterval:number;
  private _ticker:Ticker;
  private _timeouts:Timeline;
  private _timeoutIds:number;

  public master!:VoxMaster;

  constructor(context:AudioContext, opt?:{clockSrc?:VoxTick, latencyHint?:string, lookAhead?:number, updateInterval?:number}) {
    super();
    this._ctx = context;
    opt = (opt === undefined ? {} : opt);
    opt.clockSrc = (opt.clockSrc === undefined ? VoxTick.Worker : opt.clockSrc);
    opt.latencyHint = (opt.latencyHint === undefined ? 'interactive' : opt.latencyHint);
    opt.lookAhead = (opt.lookAhead === undefined ? 0.1 : opt.lookAhead);
    opt.updateInterval = (opt.updateInterval === undefined ? 0.03 : opt.updateInterval);

    this._latencyHint = opt.latencyHint;
    this._constants = {};
    this.lookAhead = opt.lookAhead;
    this._computedUpdateInterval = 0;
    
    this.timeoutLoop = this.timeoutLoop.bind(this);

    this._ticker = new Ticker(this.timeoutLoop, opt.clockSrc, opt.updateInterval);
    this._timeouts = new Vox.Timeline(Infinity);
    
    this._timeoutIds = 0;

    this._ctx.onstatechange = function(e) {
      console.log('stagechange', e);
    }
  }

  public now() {
    return this._ctx.currentTime + this.lookAhead;
  }

  public timeoutLoop() {
    const now = this.now();
    while (this._timeouts && this._timeouts.length && this._timeouts.peek().time <= now) {
      this._timeouts.shift().callback();
    }
  }

  public setTimeout(fn, timeout) {
    this._timeoutIds++;
    let now = this.now();
    this._timeouts.add({
      callback: fn,
      time: now + timeout,
      id: this._timeoutIds, 
    });
  }

  public clearTimeout(id) {
  }
}

Vox.VoxContext = VoxContext;

if (!(Vox.context instanceof VoxContext)) {
  Vox.context = new VoxContext(new AudioContext());
  console.log('create context');
} else {
  console.log('context already exist');
}