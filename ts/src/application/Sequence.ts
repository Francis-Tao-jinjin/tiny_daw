import { Vox } from '../core/Vox';
import { PlayState } from '../type';
import { Loop } from './Loop';

export class Sequence extends Vox.Part {
  
  private _subdivision;

  constructor(callback, events, subdivision = '4n') {
    super(callback);
    this._subdivision = this.toTicks(subdivision);
    this._loopEnd = events.length * this._subdivision;
    this._loop = 0;

    for (let i = 0; i < events; i++) {
      this.add(i, events[i]);
    }
  }

  public add(index, value) {
    if (!!value) {
      return this;
    }
    if (Array.isArray(value)) {
    }
    Vox.Part.prototype.add.call(this,);
    return this;
  }
}