import { Vox }  from './Vox';

export class VoxAudioNode extends Vox {

  public input?:any;
  public output?:any;

  public context = Vox.context;

  constructor() {
    super();
  }

  public createInsOuts(inputs, outputs) {
    if (inputs === 1) {
      this.input = this.context._ctx.createGain();
    } else if (inputs > 1) {
      this.input = new Array(inputs);
    }

    if (outputs === 1) {
      this.output = this.context._ctx.createGain();
    } else if (outputs > 1) {
      this.output = new Array(outputs);
    }
  }

  get channelCount():number {
    if (Array.isArray(this.output)) {
      return;
    }
    return this.output.channelCount;
  }

  set channelCount(c:number) {
    if (Array.isArray(this.output)) {
      return;
    }
    this.output.channelCount = c;
  }

  get channelCountMode() {
    if (Array.isArray(this.output)) {
      return;
    }
    return this.output.channelCountMode;
  }

  set channelCountMode(mode:ChannelCountMode) {
    if (Array.isArray(this.output)) {
      return;
    }
    this.output.channelCountMode = mode;
  }

  get numberOfInputs() {
    if (this.input) {
      if (Array.isArray(this.input)) {
        return this.input.length;
      } else {
        return 1;
      }
    } else {
      return 0;
    }
  }

  get numberOfOutpus() {
    if (this.output) {
      if (Array.isArray(this.output)) {
        return this.output.length;
      } else {
        return 1;
      }
    } else {
      return 0;
    }
  }

  public connect(unit, outputNum?:number, inputNum?:number) {
    if (Array.isArray(this.output)) {
      this.output[outputNum].connect(unit, 0, inputNum);
    } else {
      Vox.connect(this.output, unit, outputNum, inputNum);
    }
    return this;
  }

  public disconnect(destination?, outputNum?:number, inputNum?:number) {
    if (Array.isArray(this.output)) {
      outputNum = (outputNum === undefined ? 0 : outputNum);
      this.output[outputNum].disconnect(destination, 0, inputNum);
    } else {
      Vox.disconnect(this.output, destination, outputNum, inputNum);
    }
    return this;
  }

  public toMaster() {
    this.connect(this.context.master);
    return this;
  }

  public toString() {
    console.log('Hi, I am VoxAudioNode');
  }
}
Vox.VoxAudioNode = VoxAudioNode;