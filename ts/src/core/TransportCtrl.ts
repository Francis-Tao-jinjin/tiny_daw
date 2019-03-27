import { Vox } from './Vox';
import { Clock } from './Clock';
import { TickSignal } from '../signal/TickSignal';
import { VoxType } from '../type';
import { Timeline } from './Timeline';

export class TransportCtrl extends Vox {
  
  public loop:boolean;
  private _loopStart:number;
  private _loopEnd:number;
  private _ppq:number;
  private _timeSignature:number;
  private _clock:Clock;
  private _timeline:Timeline;
  private _swingTicks:number;
  private _swingAmount:number;
  private _secheduleEvents:{[key:string]: {event:any, timeline:any}};
  public readonly bpm:TickSignal;
  static default = {
    bpm: 120,
    swing: 0,
    swingSubdivision: "8n",
    timeSignature: 4,
    loopStart: 0,
    loopEnd: "4m",
    PPQ: 192
  };

  constructor() {
    super();
    this.loop = false;
    this._loopEnd = 0;
    this._loopStart = 0;
    this._ppq = TransportCtrl.default.PPQ;

    this._clock = new Vox.Clock({
      callback: this._processTick.bind(this),
      frequency: 0,
    });

    this.bpm = this._clock.frequency;
    this.bpm._toUnits = this._toUnits.bind(this);
    this.bpm._fromUnits = this._fromUnits.bind(this);
    this.bpm.units = VoxType.BPM;
    this.bpm.value = TransportCtrl.default.bpm;

    this._timeSignature = TransportCtrl.default.timeSignature;

    this._secheduleEvents = {};
    this._timeline = new Vox.Timeline(Infinity);

    this._swingTicks = TransportCtrl.default.PPQ;
    this._swingAmount = 0;

  }

  get timeSignature() {
    return this._timeSignature;
  }

  set timeSignature(timeSig) {
    if (Array.isArray(timeSig)) {
      timeSig = (timeSig[0] / timeSig[1]) * 4;
    }
    this._timeSignature = timeSig;
  }

  get PPQ() {
    return this._ppq;
  }

  set PPQ(value) {
    const bpm = this.bpm.value;

  }

  get loopStart() {
    return 
  }

  private _processTick(tickTIme, ticks) {

  }

  private _bindClockEvents() {
    this._clock.on('start', (time, offset) => {

    });
  }

  private _fromUnits(bpm) {
    return 1 / (60 / bpm / this.PPQ);
  }

  // convert from frequency into BPM
  private _toUnits(freq) {
    return (freq / this.PPQ) * 60;  
  }
}

if (Vox.VoxTransportCtrl === undefined) {
  Vox.VoxTransportCtrl = new TransportCtrl();
}