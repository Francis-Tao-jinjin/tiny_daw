import { Vox } from '../core/Vox';
import { Signal } from '../signal/Signal';
import { FadeCurve } from '../type';
import { isObject, isArray } from 'util';

const linear = 'linear';
const exponential = 'exponential';

const EnvelopeDefault = {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.5,
    release: 1,
    attackCurve: linear,
    decayCurve: exponential,
    releaseCurve: exponential,
};

export class Envelope extends Vox.VoxAudioNode {
    public static Type:{[key:string]:any};

    public attack;
    public decay;
    public sustain;
    public release;

    public _attackCurve;
    private _decayCurve;
    public _releaseCurve;

    protected sig:Signal;

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
        this.attack = ( opt.attack === undefined ) ? EnvelopeDefault.attack : opt.attack;
        this.decay = ( opt.decay === undefined ) ? EnvelopeDefault.decay : opt.decay;
        this.sustain = ( opt.sustain === undefined ) ? EnvelopeDefault.sustain : opt.sustain;
        this.release = ( opt.release === undefined ) ? EnvelopeDefault.release : opt.release;
        
        this._attackCurve = linear;
        this._releaseCurve = exponential;
        this.sig = this.output = new Vox.Signal({value:0});
        
        this.attackCurve = opt.attackCurve === undefined ? linear : opt.attackCurve;
        this.releaseCurve = opt.releaseCurve === undefined ? exponential : opt.releaseCurve;
        this.decayCurve = opt.decayCurve === undefined ? exponential : opt.decayCurve;

        this.connect = Vox.Signal.prototype.connect.bind(this);
    }

    private _getCurve(curve, direction) {
        if (Vox.isString(curve)) {
            return curve;
        } else if (isArray(curve)) {
            for (let t in Envelope.Type) {
                if (Envelope.Type[t][direction] === curve) {
                    return t;
                }
            }
        }
    }

    private _setCurve(name, direction, curve) {
        if (Envelope.Type.hasOwnProperty(curve)) {
            const curveDef = Envelope.Type[curve];
            if (isObject(curveDef)) {
                this[name] = curveDef[direction];
            } else {
                this[name] = curveDef;
            }
        } else if (isArray(curve)) {
            this[name] = curve;
        } else {
            throw new Error('Envelopt: invalid curve: ' +  curve);
        }
    }

    get attackCurve() {
        return this._getCurve(this._attackCurve, 'In');
    }

    set attackCurve(curve) {
        this._setCurve('_attackCurve', 'In', curve);
    }

    get releaseCurve() {
        return this._getCurve(this._releaseCurve, 'Out');
    }

    set releaseCurve(curve) {
        this._setCurve('_releaseCurve', 'Out', curve);
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
            this.sig.linearRampTo(velocity, attack, time);
        } else if (this._attackCurve === exponential) {
            this.sig.targetRampTo(velocity, attack, time);
        } else if (attack > 0) {
            this.sig.cancelAndHoldAtTime(time);
            // _attackCurve 是一个数组的情况，就是自定义的包络函数
            let curve = this._attackCurve;
            for (let i = 0; i < curve.length; i++) {
                if (curve[i - 1] <= currentValue && currentValue <= curve[i]) {
                    curve = this._attackCurve.slice(i);
                    curve[0] = currentValue;
                    break;
                }
            }
            this.sig.setValueCurveAtTime(curve, time, attack, velocity);
        }
        if (decay) {
            const decayValue = velocity * this.sustain;
            const decayStart = time + attack;
            console.log('decay', decayStart);
            if (this._decayCurve === linear) {
                this.sig.linearRampTo(decayValue, decay, decayStart + this.sampleTime);
            } else if (this._decayCurve === exponential) {
                this.sig.exponentialApproachValueAtTime(decayValue, decayStart, decay)
            }
        }
        return this;
    }

    public triggerRelease(time) {
        console.log('triggerRelease', time);
        time = this.toSeconds(time);
        const currentValue = this.getValueAtTime(time);
        if (currentValue > 0) {
            const release = this.toSeconds(this.release);
            if (this._releaseCurve === linear) {
                this.sig.linearRampTo(0, release, time);
            } else if (this._releaseCurve === exponential) {
                this.sig.targetRampTo(0, release, time);
            } else {
                const curve = this._releaseCurve;
                if (isArray(curve)) {
                    this.sig.cancelAndHoldAtTime(time);
                    this.sig.setValueCurveAtTime(curve, time, release, currentValue);
                }
            }
        }
        return this;
    }

    public getValueAtTime(time) {
        return this.sig.getValueAtTime(time);
    }

    public triggerAttackRelease(duration, time?, velocity?) {
        time = this.toSeconds(time);
        this.triggerAttack(time, velocity);
        this.triggerRelease(time + this.toSeconds(duration));
        return this;
    }

    public cancel(after) {
        this.sig.cancelScheduledValues(after);
        return this;
    }
}

(function _createCurves() {
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

    if (!Envelope.Type) {
        Envelope.Type = {
            linear,
            exponential,
            bounce : {
                In : invertCurve(bounceCurve),
                Out : bounceCurve
            },
            cosine : {
                In : cosineCurve,
                Out : reverseCurve(cosineCurve)
            },
            step : {
                In : stairsCurve,
                Out : invertCurve(stairsCurve)
            },
            ripple : {
                In : rippleCurve,
                Out : invertCurve(rippleCurve)
            },
            sine : {
                In : sineCurve,
                Out : invertCurve(sineCurve)
            }
        }
    }

})();

Vox.Envelope = Envelope;