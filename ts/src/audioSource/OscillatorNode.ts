import { Vox } from '../core/Vox';
import { OscilType, VoxType, PlayState } from '../type';
import { VoxGain } from '../core/Gain';
import { VoxAudioParam } from '../core/AudioParam';


export class VoxOscillatorNode extends Vox.VoxAudioNode {

  public onended:(param:any) => void;

  public frequency:VoxAudioParam;
  public detune:VoxAudioParam;

  private _gain = 1;
  private _startTime = -1;
  private _stopTime = -1;
  private _gainNode:VoxGain;

  private _timeout;

  private _oscillator:OscillatorNode;

  constructor(opt?:{
    frequency?:number,
    detune?:number,
    type?:OscillatorType,
    onended?:(param:any) => void
  }) {
    super();
    opt = opt === undefined ? {} : opt;
    this.type = opt.type === undefined ? OscilType.sine : opt.type;
    this.onended = opt.onended === undefined ? () => {} : opt.onended;

    this._oscillator = this.context._ctx.createOscillator();
    // 包络
    this._gainNode = this.output = new Vox.VoxGain(0, VoxType.Default);
    // 频率
    this.frequency = new VoxAudioParam({
      param: this._oscillator.frequency,
      units: VoxType.Frequency,
      value: opt.frequency === undefined ? 440 : opt.frequency,
    });
    // 音差
    this.detune = new VoxAudioParam({
      param : this._oscillator.detune,
		  units : VoxType.Cents,
		  value : opt.detune === undefined ? 0 : opt.detune
    });
  }

  public start(time?:number) {
    if (this._startTime === -1) {
      this._startTime = this.toSeconds(time);
      this._startTime = Math.max(this._startTime, this.context._ctx.currentTime);
      this._oscillator.start(this._startTime);
      this._gainNode.gain.setValueAtTime(1, this._startTime);
    } else {
      console.warn('OscillatorNode 已经 start 过了');
    }
    return this;
  }

  public stop(time) {
    if (this._startTime === -1) {
      console.warn('必须现调用 satrt 才能 stop');
      return;
    }
    this.cancelStop();
    this._stopTime = this.toSeconds(time);
    this._stopTime = Math.max(this._stopTime, this.context._ctx.currentTime);
    if (this._stopTime > this._startTime) {
      this._gainNode.gain.setValueAtTime(0, this._stopTime);
      this._timeout = this.context.setTimeout(function(){
        this._oscillator.stop(this.now());
        this.onended();
      }.bind(this), this._stopTime - this.context._ctx.currentTime);
    } else {

    }
    return this;
  }

  public cancelStop() {
    if (this._startTime !== -1) {
      this._gainNode.gain.cancelScheduledValues(this._startTime+this.sampleTime);
      if (this._timeout !== undefined) {
        this.context.clearTimeout(this._timeout);
      }
      this._stopTime = -1;
    }
    return this;
  }

  get type() {
    return this._oscillator.type;
  }

  set type(value:OscillatorType) {
    this._oscillator.type = value;
  }

  get state() {
    return this.getStateAtTime(this.now());
  }

  public getStateAtTime(time?:number) {
    time = this.toSeconds(time);
    if (this._startTime !== -1 && time >= this._startTime && (this._stopTime === -1 || time <= this._stopTime)){
      return PlayState.Started;
    } else {
      return PlayState.Stopped;
    }
  }

  // 生成所需的 实数序列 和 复数序列
  private _getRealImaginary(type, phase) {
    let fftSize = 4096;
    
  }
}

Vox.VoxOscillatorNode = VoxOscillatorNode;