import { Vox } from './Vox';


// tick is "tick per beat", beat is the unit in the tempo

export class Ticks extends Vox.Time {

  protected _defaultUnits = 'i';

  constructor(value, units?) {
    super(value, units);
  }



  public now() {
    return Vox.VoxTransportCtrl.ticks;
  }

}

Vox.Ticks = Ticks;