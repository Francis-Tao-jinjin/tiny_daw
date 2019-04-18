import { Vox } from "../core/Vox";
import { Oscillator } from "./Oscillator";
import { Signal } from "../signal/Signal";
import { VoxGain } from "../core/Gain";
import { VoxType } from "../type";

//https://www.electronics-notes.com/articles/radio/modulation/fm-frequency-modulation-index-deviation-ratio.php
// dsp graph is bellow
//http://ecelabs.njit.edu/ece489v2/lab2.php

// ***** https://zhuanlan.zhihu.com/p/49945974
export class FMOscillator extends Vox.VoxSource {
    
    private _carrier:Oscillator;
    private _modulator:Oscillator;
    
    public frequency:Signal;
    public detune:Signal;
    
    // harmonicity is to control Modulator Frequency(m), when
    // m get close to carrier frequency, it create a lot of harmonic
    public harmonicity:Signal;
    public modulation_index:Signal;

    private multiply_1:VoxGain;
    private multiply_2:VoxGain;
    private multiply_3:VoxGain;
    private add:VoxGain;

    constructor(opt:{[key:string]:any} = {}){
      super();
      opt = {
        frequency: 440,
        carrierType: 'sine',
        modulationType : 'square',
        modulation_index: 1,
        harmonicity: 1,
        deutne: 0,
        phase: 0,
        ...opt
      };

      this._carrier = new Vox.Oscillator();
      this._modulator = new Vox.Oscillator();

      this._carrier.frequency.value = 0;
      this._modulator.frequency.value = 0;

      this.frequency = new Vox.Signal({value:opt.frequency, units:VoxType.Frequency});
      this.detune = this._carrier.detune;
      this.detune.value = opt.detune;

      this.modulation_index = new Vox.Signal({value:opt.modulation_index});
      this.harmonicity = new Vox.Signal({value:opt.harmonicity});

      this.multiply_1 = new Vox.VoxGain(0);
      this.multiply_2 = new Vox.VoxGain(0);
      this.multiply_3 = new Vox.VoxGain(0);
      this.add = new Vox.VoxGain(1);
    }
}

/*
var audioContext = new(window.AudioContext || window.webkitAudioContext);

var frequency = audioContext.createConstantSource();
var harmonic = audioContext.createConstantSource();
var modulation_index = audioContext.createConstantSource();

var multiply = audioContext.createGain();
var multiply_2 = audioContext.createGain();
var multiply_3 = audioContext.createGain();
var add = audioContext.createGain();

var modulator = audioContext.createOscillator();
var carrier = audioContext.createOscillator();

frequency.connect(multiply);
harmonic.connect(multiply.gain);
frequency.connect(multiply_3);
modulation_index.connect(multiply_3.gain);
multiply_3.connect(multiply_2.gain);
multiply.connect(modulator.frequency);
modulator.connect(multiply_2);
frequency.connect(add);
multiply_2.connect(add);
add.connect(carrier.frequency);
carrier.connect(audioContext.destination);

multiply.gain.value = 0;
add.gain.value = 1;
multiply_2.gain.value = 0;
multiply_3.gain.value = 0;
modulator.frequency.value = 0;
carrier.frequency.value = 0;
frequency.offset.value = 220;
harmonic.offset.value = 1;
modulation_index.offset.value = 0.5;

const ana = audioContext.createAnalyser();
carrier.connect(ana);

function start() {
	frequency.start(0);
	modulation_index.start(0);
	harmonic.start(0);
	modulator.start(0);
	carrier.start(0);
}


window.onload = () => {
  const canvas = (document.getElementById('waveform'));
  const capturebuf = new Float32Array(512);
  const canvasctx = canvas.getContext('2d');
  function DrawGraph() {
    ana.getFloatTimeDomainData(capturebuf);
    canvasctx.fillStyle = "#222222";
    canvasctx.fillRect(0, 0, 512, 512);
    canvasctx.fillStyle = "#00ff44";
    canvasctx.fillRect(0, 128, 512, 1);
    for(let i = 0; i < 512; ++i) {
        const v = 128 - capturebuf[i] * 128;
        canvasctx.fillRect(i, v, 1, 128 - v);
    }
  }
  setInterval(DrawGraph, 50);
}
*/