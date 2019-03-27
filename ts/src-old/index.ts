import { Track } from "./track";

export class AudioController {
  private _counter = 1000;
  private _html5AudioPool = [];
  
  // Internal properties.
  private _codecs = {};
  private _tracks:Track[] = [];
  private _muted = false;
  private _volume = 1;
  private _canPlayEvent = 'canplaythrough';

  private _audioUnlocked;

  public html5PoolSize = 10;
  public masterGain:GainNode;
  public noAudio = false;
  public usingWebAudio = true;
  public autoSuspend = true;
  public ctx:AudioContext = null;

  public scratchBuffer:AudioBuffer;

  public state:string;
  // Set to false to disable the auto audio unlocker.
  public autoUnlock = true;

  public setupAudioContext() {
    if (!this.usingWebAudio) {
      return;
    }
    try {
      if (typeof AudioContext !== 'undefined') {
        this.ctx = new AudioContext();
      } else if (typeof ((window as any).webkitAudioContext) !== 'undefined') {
        this.ctx = new (window as any).webkitAudioContext();
      } else {
        this.usingWebAudio = false;
      }
    } catch(e) {
      this.usingWebAudio = false;
    }

    if (!this.ctx) {
      this.usingWebAudio = false;
    }

    const iOS = (/iP(hone|od|ad)/.test(navigator && navigator.platform));
    const appVersion = navigator && navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
    const version = appVersion ? parseInt(appVersion[1], 10) : null;
    if (iOS && version && version < 9) {
      const safari = /safari/.test(navigator && navigator.userAgent.toLowerCase());
      if (navigator && !safari) {
        this.usingWebAudio = false;
      }
    }

    if (this.usingWebAudio) {
      this.masterGain = (typeof this.ctx.createGain === 'undefined') ? (this.ctx as any).createGainNode() : this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this._muted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    this._setup();
  }

  constructor() {
    this.setupAudioContext();
  }

  private _setup() {
    this.state = this.ctx ? this.ctx.state || 'suspended' : 'suspended';
    this._autoSuspend();
    if (!this.usingWebAudio) {
      if (typeof Audio !== 'undefined') {
        try {
          var test = new Audio();
          
          if (typeof test.oncanplaythrough === 'undefined') {
            this._canPlayEvent = 'canplay';
          }
        } catch(e) {
          this.noAudio = true;
        }
      } else {
        this.noAudio= true;
      }
    }
    if (!this.noAudio) {
      this._setupCodecs();
    }
  }

  private _setupCodecs() {
    let audioTest = null;
    try {
      audioTest = (typeof Audio !== 'undefined') ? new Audio() : null;
    } catch (err) {
      return this;
    }
    if (!audioTest || typeof audioTest.canPlayType !== 'function') {
      return this;
    }
    let mpegTest = audioTest.canPlayType('audio/mpeg;').replace(/^no$/, '');
    // Opera version <33 has mixed MP3 support, so we need to check for and block it.
    let checkOpera = navigator && navigator.userAgent.match(/OPR\/([0-6].)/g);
    var isOldOpera = (checkOpera && parseInt(checkOpera[0].split('/')[1], 10) < 33);
    this._codecs = {
      mp3: !!(!isOldOpera && (mpegTest || audioTest.canPlayType('audio/mp3;').replace(/^no$/, ''))),
      mpeg: !!mpegTest,
      opus: !!audioTest.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ''),
      ogg: !!audioTest.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
      oga: !!audioTest.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
      wav: !!audioTest.canPlayType('audio/wav; codecs="1"').replace(/^no$/, ''),
      aac: !!audioTest.canPlayType('audio/aac;').replace(/^no$/, ''),
      caf: !!audioTest.canPlayType('audio/x-caf;').replace(/^no$/, ''),
      m4a: !!(audioTest.canPlayType('audio/x-m4a;') || audioTest.canPlayType('audio/m4a;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
      mp4: !!(audioTest.canPlayType('audio/x-mp4;') || audioTest.canPlayType('audio/mp4;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
      weba: !!audioTest.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, ''),
      webm: !!audioTest.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, ''),
      dolby: !!audioTest.canPlayType('audio/mp4; codecs="ec-3"').replace(/^no$/, ''),
      flac: !!(audioTest.canPlayType('audio/x-flac;') || audioTest.canPlayType('audio/flac;')).replace(/^no$/, '')
    };
    return this;
  }

  private _autoSuspend() {
    if (!this.autoSuspend || !this.ctx || typeof this.ctx.suspend === 'undefined' || !this.usingWebAudio) {
      return;
    }
  }

  public unlockAudio() {
    const shouldUnlock = /iPhone|iPad|iPod|Android|BlackBerry|BB10|Silk|Mobi|Chrome|Safari/i.test(navigator && navigator.userAgent);
    if (this._audioUnlocked || !this.ctx || !shouldUnlock) {
      return;
    }

    this._audioUnlocked = false;
    this.autoUnlock = false;

    this.scratchBuffer = this.ctx.createBuffer(1, 1, 22050);
    const self = this;
    function unlock(e) {
      for (let i = 0; i < self.html5PoolSize; i++) {
        const audioNode = new Audio();
        (audioNode as any)._unlocked = true;
        self.releaseHtml5Audio(audioNode);
      }

      for (let i = 0; i < self._tracks.length; i++) {
        if (!self._tracks[i].webAudio) {
          const ids = self._tracks[i].getSoundIds();

          for (let j = 0; j < ids.length; j++) {
            let sound = self._tracks[i].soundById(ids[j]);
            if (sound && sound._node && !sound._node._unlocked) {
              sound._node._unlocked = true;
              sound._node.load();
            }
          }
        }
      }

      // self.autoResume();

      let source:AudioBufferSourceNode = self.ctx.createBufferSource();
      source.buffer = self.scratchBuffer;
      source.connect(self.ctx.destination);

      if (typeof source.start === 'undefined') {
        (source as any).noteOn(0);
      } else {
        source.start(0);
      }

      
    }
  }

  public releaseHtml5Audio(audio) {
    if (audio._unlocked) {
      this._html5AudioPool.push(audio);
    }
    return this;
  }
}

const AudioCtrl = new AudioController();