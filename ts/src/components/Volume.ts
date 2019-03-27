import { Vox } from '../core/Vox';
import { VoxGain } from '../core/Gain';
import { VoxType } from '../type';
import { VoxAudioParam } from '../core/AudioParam';

export class Volume extends Vox.VoxAudioNode {

  public readonly volume:VoxAudioParam;

  private initialVolume:number;

  public input:VoxGain;
  public output:VoxGain;

  constructor(volume) {
    super();

    // 数值为 分贝
    this.output = this.input = new Vox.VoxGain(volume, VoxType.Decibels);
    this.initialVolume = volume;
    this.volume = (<VoxGain>(this.output as any)).gain;
    this.mute = false;
  }
  
  get mute() {
    return this.volume.value === -Infinity;
  }

  set mute(mute) {
    if (!this.mute && mute) {
      this.initialVolume = this.volume.value;
      this.volume.value = -Infinity;
    } else if (this.mute && !mute){
      this.volume.value = this.initialVolume;
    }
  }
}

Vox.Volume = Volume;