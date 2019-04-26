import EasuAL from "../EasuAL";

export class EasuAudioNode extends EasuAL{
    public input:any;
    public output:any;

    constructor () {
        super();
    }

    public connect(, ) {
    }

    public toDestination() {
    };
}

export class EasuDestination extends EasuAudioNode {
    public input:EasuGain;
    constructor() {
        super();
        
        this.input = new EasuGain();
        this.input.
    }
}

export class EasuGain extends EasuAudioNode {
    public input:GainNode;
    public output:GainNode;

    constructor() {
        super();
        this.input = this.output = this.context.createGain();
    }
}