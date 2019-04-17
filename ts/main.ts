import { Vox } from './src/index';
import { OscilType } from './src/type';

const player = new Vox.Player({
  src: './audio/Jeff Beal - Rome Main Title Theme.mp3',
  onload:() => {
    console.log('loaded');
  }
});
player.toMaster();

const ana = Vox.context._ctx.createAnalyser();
Vox.connect(Vox.context.master.output,ana);

(window as any).player = player;
(window as any).Vox = Vox;

window.onload = () => {

  let playBtn = document.getElementById('playBtn');
  playBtn.onclick = () => {
    player.start();
  }
  let stopBtn = document.getElementById('stopBtn');
  stopBtn.onclick = () => {
    player.stop();
  }

  const canvas = <HTMLCanvasElement>(document.getElementById('waveform'));
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


var s = (new Vox.Synth()).toMaster();
s.oscillator.type = OscilType.square;
var seq = new Vox.Sequence(function(time, note){
  // console.log(note);
  if (note) {
    s.triggerAttackRelease(note, '4n');	
  }
}, [
	["e4", "d#4"], ["e4", "d#4"], ["e4", "b3"], ["d4", 'c4'], "a3", ['', 'c3'], ['e3', 'a3'], 'b3', ['', 'e3'], ['g#3', 'b3'],
	'c4', ['', 'e3'], ["e4", "d#4"], ["e4", "d#4"], ["e4", "b3"], ["d4", 'c4'], "a3", ['', 'c3'], ['e3', 'a3'], 'b3', ['', 'e3'], ['c4', 'b3'],
	'a3', ['', '']
]);
seq.loop = -1;