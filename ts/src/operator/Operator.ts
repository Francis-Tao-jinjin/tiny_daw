import { Vox } from "../core/Vox";

export class Multiply extends Vox.VoxGain {
    constructor() {
        super(1);
    }

    get input1() {
        return this;
    }

    get input2() {
        return this.gain;
    }
}

export class Add extends Vox.VoxGain {
    constructor() {
        super(1);
    }

    get input1() {
        return this;
    }

    get input2() {
        return this;
    }
}
