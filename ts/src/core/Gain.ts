import { Vox } from './Vox';
import { VoxType } from '../type';
import { VoxAudioParam } from './AudioParam';

export class VoxGain extends Vox.VoxAudioNode {
  public input:GainNode;
  public output:GainNode;
  public gain:VoxAudioParam;

  private _gainNode;

  constructor(gain:number, units:VoxType) {
    super();
    this.input = this.output = this._gainNode = this.context._ctx.createGain();
    this.gain = new Vox.VoxAudioParam({
      param: this._gainNode.gain,
      units: units,
      convert: true,
      value: gain,
    });
  }
}

Vox.VoxGain = VoxGain;