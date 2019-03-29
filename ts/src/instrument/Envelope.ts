import { Vox } from '../core/Vox';
import { Signal } from '../signal/Signal';
import { FadeCurve } from '../type';

const linear = 'linear';
const exponential = 'exponential';

function _createCurves() {
    const curveLen = 128;
    
    let i;
    let k;
    const cosineCurve = [];
    for (i = 0; i < curveLen; i++) {
        cosineCurve[i] = Math.sin((i / (curveLen - 1)) * (Math.PI / 2));
    }

    const rippleCurve = [];
    const rippleCurveFreq = 6.4;
    for (i = 0; i < curveLen - 1; i++) {
        k = (i / (curveLen - 1));
		const sineWave = Math.sin(k * (Math.PI * 2) * rippleCurveFreq - Math.PI / 2) + 1;
		rippleCurve[i] = sineWave/10 + k * 0.83;
    }
    rippleCurve[curveLen - 1] = 1;

    const stairsCurve = [];
    const steps = 5;
    for (i = 0; i < curveLen; i++) {
        stairsCurve[i] = Math.ceil((i / (curveLen - 1)) * steps) / steps;
    }

    const sineCurve = [];
    for (i = 0; i < curveLen; i++) {
        k = i / (curveLen - 1);
        sineCurve[i] = 0.5 * (1 - Math.cos(Math.PI * k));
    }

    const bounceCurve = [];
    for (i = 0; i < curveLen; i++) {
        k = i / (curveLen - 1);
        const freq = Math.pow(k, 3) * 4 + 0.2;
        const val = Math.cos(freq * Math.PI * 2 * k);
		bounceCurve[i] = Math.abs(val * (1 - k));  
    }

    function invertCurve(curve){
		const out = new Array(curve.length);
		for (let j = 0; j < curve.length; j++){
			out[j] = 1 - curve[j];
		}
		return out;
    }
    
    function reverseCurve(curve) {
        return curve.slice(0).reverse();
    }
}

const EnvlopeDefault = {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.5,
    release: 1,
    attackCurve: linear,
    decayCurve: exponential,
    releaseCurve: exponential,
};

export class Envlope extends Vox.VoxAudioNode {
    
    public attack;
    public decay;
    public sustain;
    public release;
    public attackCurve;
    public releaseCurve;

    public _attackCurve;
    private _decayCurve;
    public _releaseCurve;

    private _sig:Signal;

    constructor(opt?:{
            attack?,
            decay?,
            sustain?,
            release?,
            attackCurve?,
            decayCurve?,
            releaseCurve?,
    }) {
        super();

        opt = ( opt === undefined ) ? {} : opt;
        this.attack = ( opt.attack === undefined ) ? EnvlopeDefault.attack : opt.attack;
        this.decay = ( opt.decay === undefined ) ? EnvlopeDefault.decay : opt.decay;
        this.sustain = ( opt.sustain === undefined ) ? EnvlopeDefault.sustain : opt.sustain;
        this.release = ( opt.release === undefined ) ? EnvlopeDefault.release : opt.release;
        
        this._attackCurve = linear;
        this._releaseCurve = exponential;
        this._sig = this.output = new Vox.Signal({value:0});
        
        this.attackCurve = opt.attackCurve;
        this.releaseCurve = opt.releaseCurve;
        this.decayCurve = opt.decayCurve;
    }

    private _setCurve(name, direction, curve) {
        if ()
    }

    set decayCurve(curve) {
        if (curve !== linear && curve != exponential) {
            throw new Error('Envelope: invalid curve ' + curve);
        } else {
            this._decayCurve = curve;
        }
    }

    get decayCurve() {
        return this._decayCurve;
    }

    public triggerAttack(time?, velocity?) {
        console.log('triggerAttack', time, velocity)
        time = this.toSeconds(this.attack);
        let originalAttack = this.toSeconds(this.attack);
        let attack = originalAttack;
        const decay = this.toSeconds(this.decay);
        velocity = velocity === undefined ? 1 : velocity;

        const currentValue = this.getValueAtTime(time);
        if (currentValue > 0) {
            const attackRate = 1 / attack;
            const remainingDistance = 1 - currentValue;
            attack = remainingDistance / attackRate;
        }

        if (this._attackCurve === linear) {
            this._sig.linearRampTo(velocity, attack, time);
        } else if (this._attackCurve === exponential) {
            this._sig.targetRampTo(velocity, attack, time);
        } else if (attack > 0) {
            this._sig.cancelAndHoldAtTime(time);
            // _attackCurve 是一个数组的情况，就是自定义的包络函数
            let curve = this._attackCurve;
            for (let i = 0; i < curve.length; i++) {
                if (curve[i - 1] <= currentValue && currentValue <= curve[i]) {
                    curve = this._attackCurve.slice(i);
                    curve[0] = currentValue;
                    break;
                }
            }
            this._sig.setValueCurveAtTime(curve, time, attack, velocity);
        }
        if (decay) {
            const decayValue = velocity * this.sustain;
            const decayStart = time + attack;
            console.log('decay', decayStart);
            if (this._) {

            }
        }
    }

    public getValueAtTime(time) {
        return this._sig.getValueAtTime(time);
    }


}