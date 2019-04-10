
import { Vox } from '../core/Vox';
import { VoxAudioNode } from '../core/AudioNode';
import { Volume } from '../components/Volume';
import { VoxAudioParam } from '../core/AudioParam';

export abstract class Instrument extends Vox.VoxAudioNode {
  
  private _volume:Volume;
  public readonly volume:VoxAudioParam;

  public abstract triggerAttack(note, time?, velocity?);
  public abstract triggerRelease(time?);

  constructor(opt?:{volume?}) {
    super();
    opt = opt === undefined ? {} : opt;
    opt.volume = opt.volume === undefined ? 0 : opt.volume;
    
    this._volume = this.output = new Vox.Volume(opt.volume);

    this.volume = this._volume.volume;
  }


  public triggerAttackRelease(note, duration, time?, velocity?) {
    time = this.toSeconds(time);
    duration = this.toSeconds(duration);
    this.triggerAttack(note, time, velocity);
    this.triggerRelease(time + duration);
    return this;
  }

}

Vox.Instrument = Instrument;