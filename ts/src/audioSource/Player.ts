import { Vox } from '../core/Vox';
import { VoxBuffer } from '../core/Buffer';
import { PlayState } from '../type';
import { VoxBufferSource } from './BufferSource';

export class Player extends Vox.VoxSource {
  private autostart:boolean;
  public _buffer:VoxBuffer;
  private _playbackRate:number;
  private _loop:boolean;
  private _loopStartMoment:number;
  private _loopEndMoment:number;
  public fadeInDuration:number;
  public fadeOutDuration:number;

  private _activeSource:VoxBufferSource[] = [];

  constructor(opt:{
    src:string|VoxBuffer,
    onload?:() => void,
    autostart?:boolean,
    reverse?:boolean,
    playbackRate?:number,
    loop?:boolean,
    loopStartMoment?:number,
    loopEndMoment?:number,
    fadeInDuration?:number,
    fadeOutDuration?:number,
  }) {
    super();
    opt.onload = opt.onload === undefined ? () => {} : opt.onload;
    opt.reverse = opt.reverse === undefined ? false : opt.reverse;
    this._playbackRate = opt.playbackRate === undefined ? 1 : opt.playbackRate;
    this._loop = opt.loop === undefined ? false : opt.loop;
    this.autostart = opt.autostart === undefined ? false : opt.autostart;
    this._loopStartMoment = opt.loopStartMoment === undefined ? 0 : opt.loopStartMoment;
    this._loopEndMoment = opt.loopEndMoment === undefined ? 0 : opt.loopEndMoment;
    this.fadeInDuration = opt.fadeInDuration === undefined ? 0 : opt.fadeInDuration;
    this.fadeOutDuration = opt.fadeOutDuration === undefined ? 0 : opt.fadeOutDuration;
    
    this._buffer = new Vox.VoxBuffer({
      src: opt.src,
      onload: this._onload.bind(this, opt.onload)
    });
  }

  public load(src, callback) {
    return this._buffer.load(src, this._onload.bind(this, callback), () => {});
  }

  private _onload(callback?:(param:any) => void) {
    console.log('player._onload');
    if (callback !== undefined) {
      callback(this);
    }
    if (this.autostart) {
      this.start();
    }
  }

  public _start(startTime?:number, offset?:number, duration?:number) {
    if (this._loop) {
      offset = offset === undefined ? this._loopStartMoment : offset;
    } else {
      offset = offset === undefined ? 0 : offset;
    }

    offset = this.toSeconds(offset);
    let computedDuration = duration === undefined ? Math.max(this._buffer.duration - offset, 0) : duration;
    computedDuration = this.toSeconds(computedDuration) / this._playbackRate;
    startTime = this.toSeconds(startTime);

    // 每次都要 new 是因为 Source 是一次性的，start 方法只能被调用一次
    const source = new Vox.VoxBufferSource({
      buffer: this._buffer,
      loop : this._loop,
      loopStartMoment : this._loopStartMoment,
      loopEndMoment : this._loopEndMoment,
      onended : this._onSourceEnd.bind(this),
      playbackRate : this._playbackRate,
      fadeInDuration : this.fadeInDuration,
      fadeOutDuration : this.fadeOutDuration,
    }).connect(this.output);

    if (!this._loop) {
      this._state.setStateAtTime(PlayState.Stopped, startTime + computedDuration);
    }
    this._activeSource.push(source);

    if (this._loop && duration !== undefined) {
      source.start(startTime, offset);
    } else {
      source.start(startTime, offset, computedDuration - this.toSeconds(this.fadeOutDuration));
    }
    return this;
  }

  
  public _stop(time?:number) {
    time = this.toSeconds(time);
    this._activeSource.forEach(function(source) {
      source.stop(time);
    });
    return this;
  }
  
  public restart(time?:number, offset?:number, duration?:number) {
    this._stop(time);
    this._start(time, offset, duration);
    return this;
  }
  
  private _onSourceEnd(source) {
    const idx = this._activeSource.indexOf(source);
    this._activeSource.splice(idx, 1);
    if (this._activeSource.length === 0) {
      this._state.setStateAtTime(PlayState.Stopped, this.now());
    }
  }
}

Vox.Player = Player;

