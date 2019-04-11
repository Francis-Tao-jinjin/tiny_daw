import { Vox } from './Vox';
import { Clock } from './Clock';
import { TickCounter } from '../components/TickCounter';
import { VoxType, PlayState } from '../type';
import { Timeline } from './Timeline';
import { IntervalTimeTree } from './IntervalTimeTree';

export class TransportCtrl extends Vox {
  
  public loop:boolean;
  private _loopStart:number;
  private _loopEnd:number;
  private _ppq:number;
  private _timeSignature:number;
  private _clock:Clock;
  private _timeline:Timeline;
  private _repeatedEvents:IntervalTimeTree;
  private _swingTicks:number;
  private _swingAmount:number;
  private _secheduleEvents:{[key:string]: {event:any, timeline:any}};
  public readonly bpm:TickCounter;

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

    this._bindClockEvents();

    this.bpm = this._clock.frequency;
    this.bpm._toUnits = this._toUnits.bind(this);
    this.bpm._fromUnits = this._fromUnits.bind(this);
    this.bpm.units = VoxType.BPM;
    this.bpm.value = TransportCtrl.default.bpm;

    this._timeSignature = TransportCtrl.default.timeSignature;

    this._secheduleEvents = {};
    this._timeline = new Vox.Timeline(Infinity);
    this._repeatedEvents = new Vox.IntervalTimeTree();

    this._swingTicks = TransportCtrl.default.PPQ;
    this._swingAmount = 0;

  }

  get state() {
    return this._clock.getStateAtTime(this.now());
  }

  get ticks() {
    return this._clock.ticks;
  }

  set ticks(t) {
    if (this._clock.ticks !== t) {
      const now = this.now();
      if (this.state === PlayState.Started) {
        this.emit(['stop', now]);
        this._clock.setTicksAtTime(t, now);
        this.emit(['start', now, this.seconds]);
      } else {
        this._clock.setTicksAtTime(t, now);
      }
    }
  }

  get seconds(){
    return this._clock.seconds;
  }

  set seconds(s) {
    const now = this.now();
    const ticks = this.bpm.timeToTicks(s, now);
    this.ticks = ticks.valueOf();
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
    this._ppq = value;
    // 通过 param 的 value setter 重新设置
    this.bpm.value = bpm;
  }

  get loopStart() {
    return (new Vox.Ticks(this._loopStart)).toSeconds();
  }

  set loopStart(startPosition) {
    this._loopStart = this.toTicks(startPosition);
  }

  public getTicksAtTime(time) {
    return Math.round(this._clock.getTicksAtTime(time));
  }

  public getSecondsAtTime(time) {
    return this._clock.getSecondsAtTime(time);
  }

  private _processTick(tickTime, ticks) {
    // console.log('_processTick');
    if (this.loop) {
      if (ticks >= this._loopEnd) {
        this.emit(['loopEnd', tickTime]);
        this._clock.setTicksAtTime(this._loopStart, tickTime);
        ticks = this._loopStart;
        this.emit(['loopStart', tickTime, this._clock.getSecondsAtTime(tickTime)]);
        this.emit(['loop', tickTime]);
      }
    }
    this._timeline.forEachAtTime(ticks, function(event) {
      event.invoke(tickTime);
    });
  }

  public scheduleRepeat(callback, interval, startTime?, duration?) {
    const event = new Vox.TransportRepeatEvent(this, {
      time: new Vox.TransportTime(startTime === undefined ? 0 : startTime),
      interval: new Vox.Time(interval),
      duration: new Vox.Time((duration === undefined ? Infinity : duration)),
      callback:  callback,
    });
    return this._addEvent(event, this._repeatedEvents);
  }

  public schedule(callback, time) {
    const event = new Vox.TransportEvent(this, {
      time: (new Vox.TransportTime(time)),
      callback:  callback,
    });
    console.log(event);
    return this._addEvent(event, this._timeline);
  }

  public scheduleOnce(callback, time) {
    const event = new Vox.TransportEvent(this, {
      time: new Vox.TransportTime(time),
      callback: callback,
      once: true,
    });
    return this._addEvent(event, this._timeline);
  }

  public clear(eventId) {
    if (this._secheduleEvents.hasOwnProperty(eventId)) {
      const item = this._secheduleEvents[eventId.toString()];
      item.timeline.remove(item.event);
      console.log('remove', item.event);
      console.log('timeline', item.timeline);
      item.event.dispose();
      delete this._secheduleEvents[eventId.toString()];
    }
    return this;
  }

  private _addEvent(event, timeline) {
    this._secheduleEvents[event.id.toString()] = {
      event: event,
      timeline: timeline,
    };
    timeline.add(event);
    return event.id;
  }

  public cancelAfter(time?) {
    time = time === undefined ? 0 : time;
    time = this.toTicks(time);
    this._timeline.forEachFrom(time, (event) => {
      this.clear(event.id);
    });
    this._repeatedEvents.forEachFrom(time, (event) => {
      this.clear(event.id);
    });
  }

  private _bindClockEvents() {
    this._clock.on('start', (time, offset) => {
      offset = (new Vox.Ticks(offset)).toSeconds();
      this.emit(['start', time, offset]);
    });

    this._clock.on('stop', (time) => {
      this.emit(['stop', time]);
    });

    this._clock.on('pause', (time) =>  {
      this.emit(['pause', time]);
    });
  }

  private _fromUnits(bpm) {
    return 1 / (60 / bpm / this.PPQ);
  }

  // convert from frequency into BPM
  private _toUnits(freq) {
    return (freq / this.PPQ) * 60;  
  }

  public start(time, offset) {
    if (Vox.isDefined(offset)) {
      offset = this.toTicks(offset);
    }
    this._clock.start(time, offset);
    return this;
  }

  public stop(time) {
    this._clock.stop(time);
    return this;
  }
}

if (Vox.VoxTransportCtrl === undefined) {
  Vox.VoxTransportCtrl = new TransportCtrl();
}