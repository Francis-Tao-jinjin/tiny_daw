import { Vox } from '../core/Vox';
import { VoxSource } from './Source';
import { VoxBuffer } from '../core/Buffer';
import { VoxType, FadeCurve, PlayState } from '../type';
import { VoxAudioParam } from '../core/AudioParam';
import { VoxGain } from '../core/Gain';

export class VoxBufferSource extends Vox.VoxAudioNode {
  public onended:(param:any) => void;
  private _sourceStarted = false;
  private _sourceStopped = false;

  private _startTime = -1;
  private _stopTime = -1;

  private _onendedTimeout;

  private _gainNode:VoxGain;
  private _source:AudioBufferSourceNode;
  private _buffer:VoxBuffer;

  public playbackRate:VoxAudioParam;
  public fadeInDuration:number;
  public fadeOutDuration:number;
  public fadeCurve:FadeCurve;

  public loop:boolean;
  public loopStartMoment:number;
  public loopEndMoment:number;

  constructor(opt:{
    buffer:AudioBuffer|VoxBuffer,
    playbackRate?:number,
    onload?:() => void,
    onended?:() => void,
    fadeInDuration?:number,
    fadeOutDuration?:number,
    fadeCurve?:FadeCurve,
    loop?:boolean,
    loopStartMoment:number,
    loopEndMoment:number,
  }) {
    super();
    this.onended = ( opt.onended === undefined ? () => {} : opt.onended);
    opt.onload = ( opt.onload === undefined ? () => {} : opt.onload);
    opt.playbackRate = ( opt.playbackRate === undefined ? 1 : opt.playbackRate);

    this._gainNode = this.output = new Vox.VoxGain(0, VoxType.Default);
    
    this._source = this.context._ctx.createBufferSource();
    Vox.connect(this._source, this._gainNode);
    this._source.onended = this._onended.bind(this);
    this._buffer = new Vox.VoxBuffer({src: opt.buffer, onload: opt.onload});

    this.playbackRate = new Vox.VoxAudioParam({
      param: this._source.playbackRate,
      units: VoxType.Positive,
      value: opt.playbackRate,
    });

    this.fadeInDuration = (opt.fadeInDuration === undefined ? 0 : opt.fadeInDuration);
    this.fadeOutDuration = (opt.fadeOutDuration === undefined ? 0 : opt.fadeOutDuration);
    this.fadeCurve = (opt.fadeCurve === undefined ? FadeCurve.Linear : opt.fadeCurve);
    this._onendedTimeout = -1;

    this.loop = (opt.loop === undefined ? false : opt.loop);
    this.loopStartMoment = (opt.loopStartMoment === undefined ? 0 : opt.loopStartMoment);
    this.loopEndMoment = (opt.loopEndMoment === undefined ? 0 : opt.loopEndMoment);
  }

  public getStateAtTime(time) {
    time = this.toSeconds(time);
    if (this._startTime !== -1 && this._startTime <= time &&
        (this._stopTime === -1 || time < this._stopTime) &&
        !this._sourceStopped) {
      return PlayState.Started;
    } else {
      return PlayState.Stopped;
    }
  }

  public start(time?:number, offset?:number, duration?:number, gain?:number) {
    if (!(this._startTime === -1)) {
      throw('can only be start once');
    }
    if (!this.buffer.loaded) {
      throw('buffer is either not set or not loaded');
    }
    if (this._sourceStopped) {
      throw('source is already stopped');
    }

    time = this.toSeconds(time);
    if (this.loop) {
      offset = (offset === undefined ? this.loopStartMoment : offset);
    } else {
      offset = (offset === undefined ? 0 : offset);
    }
    offset = Math.max(this.toSeconds(offset), 0);
    gain = (gain === undefined ? 1 : gain);

    const fadeInDuration = this.toSeconds(this.fadeInDuration);
    if (fadeInDuration > 0) {
      this._gainNode.gain.setValueAtTime(0, time);
      if (this.fadeCurve === FadeCurve.Exponential) {
        this._gainNode.gain.exponentialApproachValueAtTime(gain, time, fadeInDuration);
      } else {
        this._gainNode.gain.linearRampToValueAtTime(gain, time + fadeInDuration);
      }
    } else {
      this._gainNode.gain.setValueAtTime(gain, time);
    }

    this._startTime = time;
    
    if (duration !== undefined) {
      duration = Math.max(this.toSeconds(duration), 0);
      this.stop(time + duration);
    }

    if (this.loop) {
      let loopEnd = this.loopEndMoment || this.buffer.duration;
      let loopStart = this.loopStartMoment;
      const loopDuration = loopEnd - loopStart;
      if (offset >= loopEnd) {
        offset = ((offset - loopStart) % loopDuration) + loopStart;
      }
    }
    this._source.buffer = this.buffer.get();
    this._source.loopEnd = this.loopEndMoment || this.buffer.duration;

    if (offset < this._buffer.duration) {
      this._sourceStarted = true;
      this._source.start(time, offset);
    }
    return this;
  }

  public stop(time) {
    console.log('stop', time);
    if (!this.buffer.loaded) {
      console.log('空buffer');
      return;
    }
    if (this._sourceStopped) {
      console.log('已经被停止过');
      return;
    }

    time = this.toSeconds(time);

    // 如果已经有了停止的事件
    if (this._stopTime !== -1) {
      this.cancelStop();
    }

    const fadeOutDuration = this.toSeconds(this.fadeOutDuration);
    this._stopTime = time + fadeOutDuration;

    if (fadeOutDuration > 0) {
      if (this.fadeCurve == FadeCurve.Linear) {
        this._gainNode.gain.linearRampTo(0, fadeOutDuration, time);
      } else {
        this._gainNode.gain.targetRampTo(0, fadeOutDuration, time);
      }
    } else {
      this._gainNode.gain.cancelAndHoldAtTime(time);
      this._gainNode.gain.setValueAtTime(0, time);
    }
    Vox.context.clearTimeout(this._onendedTimeout);
    this._onendedTimeout = Vox.context.setTimeout(this._onended.bind(this), this._stopTime - this.now());

	  return this;
  }

  public cancelStop() {
    if (this._startTime !== -1 && !this._sourceStopped) {
      const fedeInMoment = this.toSeconds(this.fadeInDuration);
      this._gainNode.gain.cancelScheduledValues(this._startTime + this.fadeInDuration + this.sampleTime);
      this.context.clearTimeout(this._onendedTimeout);
      this._stopTime = -1;
    }
    return this;
  }

  private _onended() {
    if (!this._sourceStopped){
      this._sourceStopped = true;
      //allow additional time for the exponential curve to fully decay
      var additionalTail = this.fadeCurve === FadeCurve.Exponential ? this.fadeOutDuration * 2 : 0;
      if (this._sourceStarted && this._stopTime !== -1){
        this._source.stop(this._stopTime + additionalTail);
      }
      this.onended(this);
      console.log('source _onended');
    }
  }

  get buffer() {
    return this._buffer;
  }

  set buffer(buf) {
    this._buffer.set(buf);
  }
}

Vox.VoxBufferSource = VoxBufferSource;