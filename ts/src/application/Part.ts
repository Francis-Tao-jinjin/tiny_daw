import { Vox } from '../core/Vox';

export class Part extends Vox.Loop {

  private _events:any[];

  constructor(callback, events = []) {
    super(callback);

    this.loop = -1;
    this.loopEnd = '1m';
    this.loopStart = 0;
    this.playbackRate = 1;
    this._events = [];

    for (let i = 0; i < events.length; i++) {
      if (Array.isArray(events[i])) {
        this.add(events[i][0], event[i][1]);
      } else if (events[i] && events[i].time !== undefined) {
        this.add(events[i].time, event[i]);
      }
    }
  }

  public add(time, data) {
    time = this.toTicks(time);
    const event = new Vox.Loop(this._tick.bind(this), data);
    event.startOffset = time;
    event.loopEnd = this.loopEnd;
    event.loopStart = this.loopStart;
    event.loop = this.loop;
    event.playbackRate = this.playbackRate;
  }

  private _tick() {

  }
}