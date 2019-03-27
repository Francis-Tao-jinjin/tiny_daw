/**
 * 信号系统中，一个节点的值不仅仅可以用简单的类型设置，也可以
 * 使用另一个信号进行调制
 */
import { Vox } from '../core/Vox';

export class Signal extends Vox.VoxAudioParam {
  private _constantSource:ConstantSourceNode;

  constructor(opt?:{value?, units?}) {
    opt = opt === undefined ? {} : opt;
    opt.units = opt.units === undefined ? 0 : opt.units;
    opt.value = opt.value === undefined ? 0 : opt.value;
    super({value: opt.value, units: opt.units});

    this._constantSource = this.context._ctx.createConstantSource();

    this._constantSource.start(0);

    this._param = this._constantSource.offset;
    this.value = opt.value;

    this.output = this._constantSource;

    this.input = this._param = this.output.offset;

    this.disconnect = Vox.VoxAudioNode.prototype.disconnect.bind(this);
  }

  public connect(node:any, outputNumber?:number, inputNumber?:number) {
    if (node.constructor === Vox.Signal || node.constructor === Vox.VoxAudioParam) {
      node._param.cancelScheduledValues(0);
      node._param.setValueAtTime(0);
      node.overridden = true;
    } else if (node instanceof AudioParam) {
      node.cancelScheduledValues(0);
      node.setValueAtTime(0, 0);
    }
    Vox.VoxAudioNode.prototype.connect.call(this, node, outputNumber, inputNumber);
    return this;
  }

  public disconnect:(destination?: any, outputNum?: number, inputNum?: number) => any;
}

Vox.Signal = Signal;