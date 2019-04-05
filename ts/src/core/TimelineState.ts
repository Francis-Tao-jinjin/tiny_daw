import { Vox } from './Vox';
import { PlayState } from '../type';

export class TimelineState extends Vox.Timeline {

  private _initialState;
  constructor(initialState:PlayState) {
    super(Infinity);
    this._initialState = initialState;
  }

  public getRecentValueAtTime(time) {
    let timelineEvent = this.getMostRecent(time);
    if (timelineEvent !== null) {
      return timelineEvent.state;
    } else {
      return this._initialState;
    }
  }

  public setStateAtTime(state, time?) {
    this.add({
      state,
      time,
    });
    return this;
  }

  public getLastState(state, time) {
    time = this.toSeconds(time);
    const idx = this._searchAloneTime(time);
    for (var i = idx; i >= 0; i--){
      const timelineEvent = this._timeline[i];
      if (timelineEvent.state === state){
        return timelineEvent;
      }
    }
  }

  public getNextState(state, time) {
    time = this.toSeconds(time);
    const idx = this._searchAloneTime(time);
    if (idx !== -1) {
      for (let i = idx; i < this._timeline.length; i++) {
        const timelineEvent = this._timeline[i];
        if (timelineEvent.state === state) {
          return timelineEvent;
        }
      }
    }
  }
}

Vox.TimelineState = TimelineState;