import { Vox } from '../core/Vox';
import { Envelope } from './Envelope';
import { VoxType } from '../type';

export class AmplitudeEnvelope extends Vox.Envelope {
  
  constructor(opt?) {
    super(opt);
    this.input = this.output = new Vox.VoxGain(1, VoxType.Default);
    this.sig.connect(this.output.gain);
  }

}

Vox.AmplitudeEnvelope = AmplitudeEnvelope;