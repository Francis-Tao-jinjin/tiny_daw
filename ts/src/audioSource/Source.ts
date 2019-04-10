import { Vox } from '../core/Vox';
import { Volume } from '../components/Volume';
import { VoxAudioParam } from '../core/AudioParam';
import { VoxAudioNode } from '../core/AudioNode';
import { TimelineState } from '../core/TimelineState';
import { PlayState } from '../type';

export abstract class VoxSource extends Vox.VoxAudioNode {

  public readonly volume:VoxAudioParam;
  private _volume:Volume;
  private _synced:boolean;
  public _state:TimelineState;

  private _scheduled:any[] = [];

  constructor(opt?:{volume?: number, mute?:boolean}) {
    super();
    opt = (opt === undefined ? {} : opt);
    opt.mute = (opt.mute === undefined ? false : opt.mute);
    opt.volume = (opt.volume === undefined ? 0 : opt.volume);

    this._volume = new Vox.Volume(opt.volume);
    this.output = this._volume;
    this.volume = this._volume.volume;

    this._volume.output.output.channelCount = 2;
    this._volume.output.output.channelCountMode = 'explicit';

    this._state = new Vox.TimelineState(PlayState.Stopped);
    this._state.memory = 100;

    this._synced = false;
    this.mute = opt.mute;    
  }

  get mute() {
    return this._volume.mute;
  }
  
  set mute(val:boolean) {
    console.log('set mute', val);
    this._volume.mute = val;
  }

  get state() {
    if (this._synced) {

    } else {
      return this._state;
    }
  }

  abstract _start(time, offset, duration);

  abstract restart(time, offset, duration);

  abstract _stop(time, offset, duration);

  // Start the source at the specified time.
  public start(time?:number, offset?:number, duration?:number) {
    if (time === undefined && this._synced) {
    } else {
      time = this.toSeconds(time);
      time = Math.max(time, this.context._ctx.currentTime);
    }

    this._state.cancelAfter(time);
    this._state.setStateAtTime(PlayState.Started, time);
    this._start.apply(this, arguments);

    // if (this._state.getRecentValueAtTime(time) === PlayState.Started) {
    //   console.log('^^ RecentValueAtTime', time, 'is Start');
    //   this._state.cancelAfter(time);
    //   this._state.setStateAtTime(PlayState.Started, time);
    //   this.restart(time, offset, duration);
    // } else {
    //   console.log('VV RecentValueAtTime', time, 'is Start');
    //   this._state.setStateAtTime(PlayState.Started, time);
    //   if (this._synced) {

    //   } else {
    //     this._start.apply(this, arguments);
    //   }
    // }
    return this;
  }

  public stop(time?) {
    if (time === undefined && this._synced) {
    } else {
      time = this.toSeconds(time);
      time = Math.max(time, this.context._ctx.currentTime);
    }

    if (!this._synced) {
      this._stop.apply(this, arguments);
    } else {

    }
    this._state.cancelAfter(time);
    this._state.setStateAtTime(PlayState.Stopped, time);
  }
}

Vox.VoxSource = VoxSource;