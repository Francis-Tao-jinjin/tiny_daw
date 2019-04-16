import { Vox } from '../core/Vox';
import { PlayState } from '../type';
import { Loop } from './Loop';

export class Part extends Vox {

  protected _loopEvents:Loop[] = [];
  protected _loop = -1;
  protected _loopEnd = this.toTicks('1m');
  protected _loopStart = this.toTicks(0);
  protected _playbackRate = 1;
  protected _state = new Vox.TimelineState(PlayState.Stopped);

  protected _startOffset = 0;

  public callback:(time, data) => void;

  constructor(callback, events = []) {
    super();
    this.callback = callback;
    for (let i = 0; i < events.length; i++) {
      if (Array.isArray(events[i])) {
        this.add(events[i][0], events[i][1]);
      } else if (events[i] && events[i].time !== undefined) {
        this.add(events[i].time, events[i]);
      }
    }
  }

  public add(time, data) {
    time = this.toTicks(time);
    let event;
    if (data instanceof Loop || data instanceof Part) {
      event = data;
      event.callback = this._invoke.bind(this);
    } else {
      event = new Vox.Loop(this._invoke.bind(this), data);
    }
    event.startOffset = time;
    event.loopEnd = this.loopEnd;
    event.loopStart = this.loopStart;
    event.loop = this.loop;
    event.playbackRate = this.playbackRate;
    
    this._loopEvents.push(event);
    this._restartLoopEvent(event);
    return this;
  }

  protected _invoke(time, data) {
    this.callback(time, data);
  }

  public start(time?, offset?) {
    const ticks = this.toTicks(time);
    if (this._state.getRecentValueAtTime(ticks) !== PlayState.Started) {
      if (this._loop > 0) {
        offset = offset === undefined ? this._loopStart : offset;
      } else {
        offset = offset === undefined ? 0 : offset;
      }
      offset = this.toTicks(offset);
      this._state.add({
        state: PlayState.Started,
        time: ticks,
        offset: offset,
      });
      this._forEach((event) => {
        this._startLoopEvent(event, ticks, offset);
      });
    }
    return this;
  }

  private _startLoopEvent(event:Loop, ticks, offset) {
    // 减去 offset 是应为在 event 的 start 里面会重新加上 offset
    ticks -= offset;
    if (this._loop >= 0) {
      // 时间的开始时间在第一个 loop 时段内
      if (event.startOffset >= this._loopStart && event.startOffset < this._loopEnd) {
        // 如果起始偏移小于整体的偏移，就放到下一个循环执行
        if (event.startOffset < offset) {
          ticks += this._getLoopDuration();
        }
        // 因为要保证单位是 ticks 不变，如果直接传值，会被默认为秒
        event.start(new Vox.Ticks(ticks));
      } else if (event.startOffset < this._loopStart && event.startOffset >= offset) {
        event.loop = -1;
        event.start(new Vox.Ticks(ticks));
      }
    } else if (event.startOffset >= offset) {
      event.start(new Vox.Ticks(ticks));
    }
  }

  private _restartLoopEvent(event) {
    this._state.forEach((statePoint) => {
      if (statePoint.state === PlayState.Started) {
        this._startLoopEvent(event, statePoint.time, statePoint.offset);
      } else {
        event.stop(new Vox.Ticks(statePoint.time));
      }
    });
  }

  public stop(time?) {
    const ticks = this.toTicks(time);
    this._state.cancelAfter(ticks);
    this._state.setStateAtTime(PlayState.Stopped, ticks);
    this._forEach((event) => {
      event.stop(time)
    });
    return this;
  }

  public dispose() {
    this.removeAll();
    this._state = null;
    this.callback = null;
    this._loopEvents = null;
    return this;
  }

  public removeAll() {
    this._forEach((event) => {
      event.dispose();
    });
    this._loopEvents = [];
    return this;
  }

  private _forEach(callback) {
    if (this._loopEvents) {
      for (let i = this._loopEvents.length - 1; i >= 0; i--) {
        const e = this._loopEvents[i];
        if (e instanceof Part) {
          e._forEach(callback);
        } else {
          callback(e);
        }
      }
    }
  }

  get loop() {
    return this._loop;
  }

  set loop(value:number) {
    this._loop = value;
    this._forEach((event) => {
      event.loop = this._loop;
    });
  }

  get loopEnd() {
    return new Vox.Ticks(this._loopEnd).toSeconds();
  }

  set loopEnd(value) {
    this._loopEnd = this.toTicks(value);
    // 确保所有的子元素都要和父元素的值保持一致
    if (this._loop >= 0) {
      this._forEach((event) => {
        event.loopEnd = value;
      });
    }
  }

  get loopStart() {
    return new Vox.Ticks(this._loopStart).toSeconds();
  }

  set loopStart(value) {
    this._loopStart = this.toTicks(value);
     // 确保所有的子元素都要和父元素的值保持一致
    if (this._loop >= 0) {
      this._forEach((event) => {
        event.loopStart = value;
      });
    }
  }

  get playbackRate() {
    return this._playbackRate;
  }

  set playbackRate(value) {
    this._playbackRate = value;
    this._forEach((event) => {
      event.playbackRate = value;
    });
  }

  get startOffset() {
    return this._startOffset;
  }

  set startOffset(value) {
    this._startOffset = value;
    this._forEach((event) => {
      event.startOffset += this._startOffset;
    });
  }

  private _getLoopDuration() {
    return Math.round((this._loopEnd - this._loopStart) / this._playbackRate);
  }
}

Vox.Part = Part;