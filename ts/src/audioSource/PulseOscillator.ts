import { Vox } from "../core/Vox";
import { Oscillator } from "./Oscillator";
import { Signal } from "../signal/Signal";
import { OscilType } from "../type";

export class PulseOscillator extends Vox.VoxSource{

    private _sawtooth:Oscillator;
    public frequency:Signal;
    public detune:Signal;

    public _shaper:WaveShaperNode;

    public _curve:Float32Array;

    constructor(opt?) {
        super();

        opt = (opt === undefined ? {} : opt);
        opt.frequency = (opt.frequency === undefined ? 440 : opt.frequency);
        opt.detune = (opt.detune === undefined ? 0 : opt.detune);
        opt.phase = (opt.phase === undefined ? 0 : opt.phase);
        opt.width = (opt.width === undefined ? 0.2 : opt.width);

        this._sawtooth = new Vox.Oscillator({
            frequency: opt.frequency,
            detune: opt.detune,
            type: OscilType.sawtooth,
            phase: opt.phase,
        });

        this.frequency = this._sawtooth.frequency;
        this.detune = this._sawtooth.detune;

        this._shaper = this.context._ctx.createWaveShaper();
        this._curve = new Float32Array(1024);
        this.setMap(function(val) {
            if (val < 0) {
                return -1;
            } else {
                return 1;
            }
        });
        Vox.connect(this._sawtooth, this._shaper);
        Vox.connect(this._shaper, this.output);      
    }

    public setMap(mapping) {
        for (let i = 0, len = this._curve.length; i < len; i++) {
            // 将 [0, LEN-1] 内的值映射到 [-1, 1]
            let normalized = (i / (len - 1)) * 2 - 1;
            this._curve[i] = mapping(normalized, i);
        }
        this._shaper.curve = this._curve;
        return this;
    }

    public _start(time?){

    }

    public _stop(time?){

    }

    public restart(time?){

    }
}