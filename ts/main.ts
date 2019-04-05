import { Vox } from './src/index';

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
