import { AudioController } from './';

export class Track {
  public audioCtrl:AudioController;

  private _autoplay:boolean;
  private _format;
  private _html5;
  private _mute;
  private _loop;
  private _pool;
  private _preload;
  private _rate;
  private _sprite;
  private _src;
  private _volume;
  private _xhrWithCredentials;

  private _duration = 0;
  private _state = 'unloaded';
  private _sounds = [];
  private _endTimers = {};
  private _queue = [];
  private _playLock = false;
  
  private _onend:any[];
  private _onfade:any[];
  private _onload:any[];
  private _onloaderror:any[];
  private _onplayerror:any[];
  private _onpause:any[];
  private _onplay:any[];
  private _onstop:any[];
  private _onmute:any[];
  private _onvolume:any[];
  private _onrate:any[];
  private _onseek:any[];
  private _onunlock:any[];
  private _onresume:any[] = [];
  
  public webAudio;

  constructor(audioCtrl, opt) {
    this.audioCtrl = audioCtrl;
    if (!opt.src || opt.src.length === 0) {
      console.error('An array of source files must be passed with any new Track.');
      return;
    }
    this.init(opt);
  }

  public init(opt) {
    this._autoplay = opt.autoplay || false;
    this._format = (typeof opt.format !== 'string') ? opt.format : [opt.format];
    this._html5 = opt.html5 || false;
    this._mute = opt.mute || false;
    this._loop = opt.loop || false;
    this._pool = opt.pool || 5;
    this._preload = (typeof opt.preload === 'boolean') ? opt.preload : true;
    this._rate = opt.rate || 1;
    this._sprite = opt.sprite || {};
    this._src = (typeof opt.src !== 'string') ? opt.src : [opt.src];
    this._volume = opt.volume !== undefined ? opt.volume : 1;
    this._xhrWithCredentials = opt.xhrWithCredentials || false;

    this._onend = opt.onend ? [{fn: opt.onend}] : [];
    this._onfade = opt.onfade ? [{fn: opt.onfade}] : [];
    this._onload = opt.onload ? [{fn: opt.onload}] : [];
    this._onloaderror = opt.onloaderror ? [{fn: opt.onloaderror}] : [];
    this._onplayerror = opt.onplayerror ? [{fn: opt.onplayerror}] : [];
    this._onpause = opt.onpause ? [{fn: opt.onpause}] : [];
    this._onplay = opt.onplay ? [{fn: opt.onplay}] : [];
    this._onstop = opt.onstop ? [{fn: opt.onstop}] : [];
    this._onmute = opt.onmute ? [{fn: opt.onmute}] : [];
    this._onvolume = opt.onvolume ? [{fn: opt.onvolume}] : [];
    this._onrate = opt.onrate ? [{fn: opt.onrate}] : [];
    this._onseek = opt.onseek ? [{fn: opt.onseek}] : [];
    this._onunlock = opt.onunlock ? [{fn: opt.onunlock}] : [];
    this._onresume = [];

    this.webAudio = this.audioCtrl.usingWebAudio && !this._html5;

    if (typeof this.audioCtrl.ctx !== 'undefined' && this.audioCtrl.ctx && this.audioCtrl.autoUnlock) {
      // this.audioCtrl._unlockAudio();
    }
  }

  public getSoundIds(id?) {
    if (typeof id === 'undefined') {
      const ids = [];
      for (let i = 0; i < this._sounds.length; i++) {
        ids.push(this._sounds[i].id);
      }
      return ids;
    } else {
      return [id];
    }
  }

  public soundById(id) {
    for (let i = 0; i < this._sounds.length; i++) {
      if (id === this._sounds[i].id) {
        return this._sounds[i];
      }
    }

    return null;
  }
}