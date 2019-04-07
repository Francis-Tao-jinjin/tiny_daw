import { VoxContext } from './Context';
import { VoxAudioNode } from './AudioNode';
import { VoxBuffer } from './Buffer';
import { VoxGain } from './Gain';
import { Timeline } from './Timeline';
import { TimelineState } from './TimelineState';
import { VoxAudioParam } from './AudioParam'; 
import { VoxMaster } from './Master';
import { Volume } from '../components/Volume';

import { VoxSource } from '../audioSource/Source';
import { VoxBufferSource } from '../audioSource/BufferSource';
import { VoxOscillatorNode } from '../audioSource/OscillatorNode';

// import { TimeBase } from './TimeBase';
// import { Time } from './Time';
// import { Frequency } from './Frequency';
// import { Ticks } from './Ticks';
// import { TransportTime } from './TransportTime';
// import { TimeBase } from './TimeBase';
import { Time } from '../Time/Time';
import { Frequency } from '../Time/Frequency';
import { Ticks } from '../Time/Ticks';
import { TransportTime } from '../Time/TransportTime';

import { Player } from '../audioSource/Player';
import { Signal } from '../signal/Signal';
import { TickSignal } from '../signal/TickSignal';
import { TransportCtrl } from './TransportCtrl';
import { Clock } from './Clock';
import { TickSource } from '../audioSource/TickSource';

import { Envelope } from '../components/Envelope';
import { AmplitudeEnvelope } from '../components/AmplitudeEnvelope';
import { Instrument } from '../instrument/Instrument';
import { Oscillator } from '../audioSource/Oscillator';
import { Synth } from '../instrument/Synth';
import { Monophonic } from '../instrument/Monophonic';
import { isNumber, isUndefined, isObject } from 'util';
import { TransportEvent } from './TransportEvent';

export class Vox {
  public static VoxContext:typeof VoxContext;
  public static VoxAudioNode:typeof VoxAudioNode;
  public static VoxBuffer:typeof VoxBuffer;
  public static VoxSource:typeof VoxSource;
  public static VoxBufferSource:typeof VoxBufferSource;
  public static TickSource:typeof TickSource;
  public static VoxOscillatorNode:typeof VoxOscillatorNode;
  public static Player:typeof Player;
  public static Oscillator:typeof Oscillator;


  public static Signal:typeof Signal;
  public static TickSignal:typeof TickSignal;

  public static Envelope:typeof Envelope;
  public static AmplitudeEnvelope:typeof AmplitudeEnvelope;

  public static Instrument:typeof Instrument;
  public static Monophonic:typeof Monophonic;
  public static Synth:typeof Synth;

  public static VoxGain:typeof VoxGain;
  // public static TimeBase:typeof TimeBase;
  public static Time:typeof Time;
  public static Frequency:typeof Frequency;
  public static Ticks:typeof Ticks;

  public static Timeline:typeof Timeline;
  public static TimelineState:typeof TimelineState;
  public static VoxAudioParam:typeof VoxAudioParam;
  
  public static Volume:typeof Volume;
  
  public static Clock:typeof Clock;
  public static context:VoxContext;// = new VoxContext(new AudioContext());
  public static VoxMaster:VoxMaster;
  public static VoxTransportCtrl:TransportCtrl;
  public static TransportEvent:typeof TransportEvent;
  public static TransportTime:typeof TransportTime;

  public name = 'vox';

  private _events:{[key:string]:any[]} = {};

  constructor () { 
  }

  public toString(){

  }

  public toSeconds(time?) {
    if (Vox.isNumber(time)) {
      return time;
    } else if (Vox.isUndef(time)) {
      return this.now();
    } else if (Vox.isString(time)) {
      return (new Vox.Time(time)).toSeconds();
    }
  }

  public toFrequency(freq) {
    console.log('in toFrequency', freq);
    if (isNumber(freq)) {
      return freq;
    } else if (Vox.isString(freq) || isUndefined(freq)) {
      return (new Vox.Frequency(freq)).valueOf();
    } else if (freq.TimeObject === true) {
      return freq.toFrequency();
    }
  }

  public toTicks(time?) {
    if (Vox.isNumber(time) || Vox.isString(time)) {
      return;
    } else if (Vox.isUndef(time)) {
      return Vox.VoxTransportCtrl.ticks;
    } else if (time.TimeObject === true) {
      return time.toTicks();
    }
  }

  public now() {
    return Vox.context.now();
  }

  get sampleTime() {
    return 1 / Vox.context._ctx.sampleRate;
  }

  public static connect(srcNode:AudioNode|VoxAudioNode, dstNode:AudioNode|VoxAudioNode, outputNumber?:number, inputNumber?:number) {
    
    outputNumber = (outputNumber === undefined ? 0 : outputNumber);
    inputNumber = (inputNumber === undefined ? 0 : inputNumber);
    while (Vox.isDefined((dstNode as VoxAudioNode).input)) {
      if (Array.isArray((dstNode as VoxAudioNode).input)) {
        dstNode = (dstNode as VoxAudioNode).input[inputNumber];
        inputNumber = 0;
      } else if ((dstNode as VoxAudioNode).input) {
        dstNode = ((dstNode as VoxAudioNode).input as GainNode);
      }
    }

    if (dstNode instanceof AudioParam) {
      (srcNode as AudioNode).connect((dstNode as AudioParam), outputNumber);
    } else if (dstNode instanceof AudioNode) {
      (srcNode as AudioNode).connect((dstNode as AudioNode), outputNumber, inputNumber);
    }
    return Vox;
  }

  public static disconnect(srcNode:AudioNode|VoxAudioNode, dstNode?:AudioNode|VoxAudioNode, outputNumber?:number, inputNumber?:number) {
    if (dstNode) {
      if (Vox.isDefined((dstNode as VoxAudioNode).input) && (dstNode instanceof VoxAudioNode)) {
        if (Array.isArray(dstNode.input)) {
          if (Vox.isDefined(inputNumber)) {
            Vox.disconnect(srcNode, dstNode.input[inputNumber], outputNumber);
          } else {
            dstNode.input.forEach(function(dstNode){
              Vox.disconnect(srcNode, dstNode, outputNumber);
            });
          }
        } else if (dstNode.input) {
          dstNode = dstNode.input;
        }
      }

      if (dstNode instanceof AudioParam) {
        (srcNode as VoxAudioNode).disconnect(dstNode, outputNumber, inputNumber);
      } else if (dstNode instanceof AudioNode) {
        (srcNode as VoxAudioNode).disconnect(dstNode, outputNumber, inputNumber);
      }
    } else {
      srcNode.disconnect();
    }
    return Vox;
  }

  public static isUndef(val) {
    return typeof val === "undefined";
  }

  public static isDefined(val) {
    return !Vox.isUndef(val);
  }

  public static isFunction(val) {
    return typeof val === "function";
  }

  public static isNumber(arg) {
    return (typeof arg === "number");
  }

  public static isString(arg) {
    return (typeof arg === 'string');
  }

  public static isNote(arg) {
    return Vox.isString(arg) && /^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i.test(arg);
  };

  public gainToDb(value) {
    return 20 * (Math.log(value) / Math.LN10);
  }

  public dbToGain(db) {
    return Math.pow(10, db / 20);
  }

  public on(event:string, callback:Function) {
    if (!this._events.hasOwnProperty(event)) {
      this._events[event] = [];
    }
    this._events[event].push(callback);
    return this;
  }

  public once(event:string, callback:() => void) {
    const  self = this;
    function onceWrapper() {
      callback.apply(self, arguments);
      self.off(event, onceWrapper);
    }
    this.on(event, onceWrapper);
    return this;
  }

  public off(event:string, callback:() => void) {
    if (this._events.hasOwnProperty(event)) {
      if (Vox.isUndef(callback)) {
        this._events[event] = [];
      } else {
        const listeners:any[] = this._events[event];
        if (listeners) {
          for (let i = 0; i < listeners.length; i++) {
            if (callback === listeners[i]) {
              listeners.splice(i, 1);
            }
          }
        }
      }
    }
    return this;
  }

  protected emit(params:any[]) {
    const event = params[0];

    if(this._events) {
      const args = Array.apply(null, params).slice(1);
      if (this._events.hasOwnProperty(event)) {
        const eventList = this._events[event].slice(0);
        for (let i = 0, len = eventList.length; i < len; i++) {
          eventList[i].apply(this, args);
        }
      }
    }
    return this;
  }
}

