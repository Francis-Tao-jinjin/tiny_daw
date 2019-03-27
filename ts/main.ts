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
  let btn = document.getElementById('playBtn');
  btn.onclick = () => {
    player.start();
  }
}
