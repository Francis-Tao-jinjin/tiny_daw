import { Vox } from './Vox';
import { Volume } from '../components/Volume';
import { VoxAudioParam } from './AudioParam';

export class VoxMaster extends Vox.VoxAudioNode {
  
  private _volume:Volume;
  public readonly volume:VoxAudioParam;

  constructor() {
    super();
    this.createInsOuts(1, 0);
    this._volume = this.output = new Vox.Volume(1);
    this.volume = this._volume.volume;

    Vox.connect(this.input, this.output);
    Vox.connect(this.output, this.context._ctx.destination);
    this.context.master = this;
  }

  get mute() {
    return this._volume.mute;
  }

  set mute(val:boolean) {
    this._volume.mute = val;
  }
}

if (!(Vox.VoxMaster instanceof VoxMaster)) {
  Vox.VoxMaster = new VoxMaster();
  console.log('create context');
} else {
  console.log('context already exist');
}