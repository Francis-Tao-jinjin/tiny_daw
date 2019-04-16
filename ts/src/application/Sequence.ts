import { Vox } from '../core/Vox';
import { PlayState } from '../type';
import { Loop } from './Loop';

export class Sequence extends Vox.Part {
  
  private _subdivision;

  constructor(callback, events, subdivision:any = new Vox.Ticks('4n')) {
    super(callback);
    this._subdivision = this.toTicks(subdivision);
    this._loopEnd = events.length * this._subdivision;
    this._loop = 0;

    
    for (let i = 0; i < events.length; i++) {
      this.add(i, events[i]);
    }    
  }

  public add(index, value) {
    if (!value) {
      return this;
    }
    if (Array.isArray(value)) {
      const subSubdivision = Math.round(this._subdivision / value.length);
      value = new Vox.Sequence(this._invoke.bind(this), value, new Vox.Ticks(subSubdivision));
    }
    Vox.Part.prototype.add.call(this, this._indexTime(index), value);
    return this;
  }

  private _indexTime(index) {
    return (new Vox.Ticks(index * this._subdivision + this.startOffset)).toSeconds();
  }

  public dispose() {
    Vox.Part.prototype.dispose.call(this);
    return this;
  }
}

Vox.Sequence = Sequence;