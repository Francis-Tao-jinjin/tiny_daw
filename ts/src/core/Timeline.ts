import { Vox } from './Vox';
interface timeEvent {
  time:any;
  type?:string;
  [name:string]:any;
};

export class Timeline extends Vox {
  
  public _timeline:timeEvent[] = [];

  public memory:number;

  constructor(memory:number) {
    super();
    this.memory = memory;
  }

  get length() {
    return this._timeline.length;
  }

  public add(event:timeEvent) {
    if (Vox.isUndef(event)) {
      throw new Error('Timeline: add events must have a time attribute')
    }
    if (event.time instanceof Vox.Ticks) {
      console.log('Ticks:', event.time, '->', event.time.valueOf());
    }
    event.time = event.time.valueOf();
    // 按照时间先后插入
    let idx = this._searchAloneTime(event.time);
    this._timeline.splice(idx + 1, 0, event);
    if (idx > this.memory) {
      let overflow = this.length - this.memory;
      this._timeline.splice(0, overflow);
    }
    return this;
  }

  public remove(event) {
    const index = this._timeline.indexOf(event);
    if (index !== -1){
      this._timeline.splice(index, 1);
    }
    return this;
  }

  // 在时间线上查找某个时间点
  public _searchAloneTime(time:number, field?:string) {
    field = field === undefined ? 'time' : field; 
    if (this._timeline.length === 0) {
      return -1;
    }
    const len = this._timeline.length;
    let start = 0;
    let end = len;
    if (len > 0 && this._timeline[len - 1][field] <= time) {
      return len - 1;
    }
    while (start < end) {
      let mid = Math.floor(start + (end - start) / 2);
      const event = this._timeline[mid];
      let nextEv = this._timeline[mid + 1];
      if (event[field] === time) {
        for (let i = mid; i < this._timeline.length; i++) {
          if (this._timeline[i][field] === time) {
            mid = i;
          }
        }
        return mid;
      } else if (event[field] < time && nextEv[field] > time) {
        return mid;
      } else if (event[field] > time) {
        end = mid;
      } else {
        start = mid + 1;
      }
    }
    return -1;
  }

  public getAfter(time, field?:string) {
    const idx = this._searchAloneTime(time, field);
    if (idx + 1 < this._timeline.length) {
      return this._timeline[idx + 1];
    } else {
      return null;
    }
  }

  public getMostRecent(time, field?:string) {
    const idx = this._searchAloneTime(time, field);
    if (idx !== -1) {
      return this._timeline[idx];
    } else {
      return null;
    }
  }

  public getBefore(time, field?:string) {
    field = field === undefined ? 'time' : field;
    const len = this._timeline.length;
    if (len > 0 && this._timeline[len - 1][field] < time) {
      return this._timeline[len - 1];
    }
    const index = this._searchAloneTime(time);
    if (index - 1 >= 0) {
      return this._timeline[index - 1];
    } else {
      return null;
    }
  }

  public peek() {
    return this._timeline[0];
  }

  public shift() {
    return this._timeline.shift();
  }

  public cancelAfter(after:number) {
    if (this._timeline.length > 1) {
      let idx = this._searchAloneTime(after);
      if (idx >= 0) {
        if (this._timeline[idx].time === after) {
          for (let i = idx; i >= 0; i--) {
            if (this._timeline[i].time === after) {
              idx = i;
            } else {
              break;
            }
          }
          this._timeline = this._timeline.slice(0, idx);
        } else {
          this._timeline = this._timeline.slice(0, idx + 1);
        }
      } else {
        this._timeline = [];
      }
    } else if (this._timeline.length === 1){
      if (this._timeline[0].time >= after) {
        this._timeline = [];
      }
    }

    return this;
  }

  public cancelBefore(time) {
    const idx = this._searchAloneTime(time);
    if (idx >= 0) {
      this._timeline = this._timeline.slice(idx + 1);
    }
    return this;
  }

  private _iterate(callback, begin?:number, end?:number) {
    begin = begin === undefined ? 0 : begin;
    end = end === undefined ? this._timeline.length - 1 : end;
    this._timeline.slice(begin, end + 1).forEach((event) => {
      callback.call(this, event);
    });
  }

  public forEach(callback) {
    this._iterate(callback);
    return this;
  }

  public forEachBefore(time,callback) {
    const end = this._searchAloneTime(time);
    if (end !== -1) {
      this._iterate(callback, 0, end);
    }
    return this;
  }

  public forEachAfter(time, callback) {
    const start = this._searchAloneTime(time);
    this._iterate(callback, start + 1);
    return this;
  } 

  public forEachBetween(startTime, endTime, callback) {
    let end = this._searchAloneTime(endTime);
    let start = this._searchAloneTime(startTime);
    if (start !== -1 && end !== -1) {
      if (this._timeline[start].time !== startTime) {
        start += 1;
      }
      if (this._timeline[end].time === endTime) {
        end -= 1;
      }
      this._iterate(callback, start, end);
    } else if (start === -1) {
      this._iterate(callback, 0, end);
    }
    return this;
  }

  public forEachAtTime(time, callback) {
    const end = this._searchAloneTime(time);
    if (end !== -1) {
      this._iterate(function (event) {
        if (event.time === time) {
          callback.call(this, event);
        }
      }, 0, end);
    }
    return this;
  }

  public previousEvent(event) {
    const index = this._timeline.indexOf(event);
    if (index > 0) {
      return this._timeline[index - 1];
    } else {
      return null;
    }
  }
}

Vox.Timeline = Timeline;