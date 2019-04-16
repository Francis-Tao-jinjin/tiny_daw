import { Vox } from './src/index';
import { OscilType } from './src/type';

const player = new Vox.Player({
  src: './audio/Jeff Beal - Rome Main Title Theme.mp3',
  onload:() => {
    console.log('loaded');
  }
});
player.toMaster();

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