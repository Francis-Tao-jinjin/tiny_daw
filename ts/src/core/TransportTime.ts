import { Vox } from './Vox';

export class TransportTime extends Vox.Time {
  constructor(val, units?) {
    super(val, units);
  }

  public now() {
    return Vox.VoxTransportCtrl.seconds;
  }
}

Vox.TransportTime = TransportTime;