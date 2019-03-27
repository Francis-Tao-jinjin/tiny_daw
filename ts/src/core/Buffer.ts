import { Vox }  from './Vox';
import Promise from "ts-promise";

interface XHRObject extends XMLHttpRequest {
  progress: number;
}

export class VoxBuffer extends Vox {
  public _buffer:AudioBuffer = null;
  public _xhr:XHRObject;
  public _reversed:boolean = false;
  public onload:((param:any)=>void) = () => {};

  public name = 'VoxBuffer';
  constructor(opt?:{src?:string|AudioBuffer|VoxBuffer, onload?, onerror?}) {
    super();
    opt = opt === undefined ? {} : opt;
    opt.onload = (opt.onload === undefined) ? (() => {}) : opt.onload;
    opt.onerror = (opt.onerror === undefined) ? (() => {}) : opt.onerror;
    if (opt.src) {
      if (opt.src instanceof AudioBuffer || opt.src instanceof VoxBuffer) {
        this.set(opt.src);
        if (!this.loaded) {
          this.onload = opt.onload;
        }
      } else if (Vox.isString(opt.src)) {
        this.load(opt.src).then(opt.onload).catch(opt.onerror);
      }
    }
  }

  public set(buffer:AudioBuffer|VoxBuffer) {
    if (buffer instanceof VoxBuffer) {
      if (buffer.loaded) {
        this._buffer = buffer.get();
      } else {
        buffer.onload = () => {
          this.set(buffer);
          this.onload(this);
        };
      }
    } else {
      this._buffer = buffer;
    }
    return this;
  }

  public get() {
    return this._buffer;
  }

  public load(url, onload?, onerror?) {
    onload = onload === undefined ? () => {} : onload;
    onerror = onerror === undefined ? () => {} : onerror;
    const promise = new Promise((resolve, reject) => {
      this._xhr = VoxBuffer.load(
        url,
        (buffer) => {
          this._xhr = null;
          this.set(buffer);
          resolve(this);
          this.onload(this);
          if (onload) {
            onload(this);
          }
          console.log('buffer', buffer);
        },
        (err) => {
          this._xhr = null;
          console.log('err:', err);
          reject(err);
          if (onerror) {
            onerror(err);
          }
        }
      );
    });
    return promise;
  }

  get duration() {
    if (this._buffer) {
      return this._buffer.duration;
    } else {
      return 0;
    }
  }

  get length() {
    if (this._buffer) {
      return this._buffer.length;
    } else {
      return 0;
    }
  }

  get loaded() {
    return this.length > 0;
  }

  public static _downloadQueue:XHRObject[] = [];

  public static load(url, onload, onerror) {
    function onError(e) {
      VoxBuffer._removeFromDownloadQueue(request);
      if (onerror) {
        onerror(e);
      } else {
        throw e;
      }
    }

    function onProgress() {
      let totalProgress = 0;
      for (let i = 0; i < VoxBuffer._downloadQueue.length; i++) {
        totalProgress += VoxBuffer._downloadQueue[i].progress;
      }
      console.log('progress:', totalProgress / VoxBuffer._downloadQueue.length);
    }

    const request = (new XMLHttpRequest() as XHRObject);
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.progress = 0;

    VoxBuffer._downloadQueue.push(request);
    request.addEventListener('load', function() {
      if (request.status === 200) {
        console.log('request.response', request.response);
        Vox.context._ctx.decodeAudioData(request.response).then((buffer) => {
          request.progress = 1;
          onProgress();
          onload(buffer);
          VoxBuffer._removeFromDownloadQueue(request);
          if (VoxBuffer._downloadQueue.length === 0) {
            console.log('all loaded');
          }
        }).catch(() => {
          VoxBuffer._removeFromDownloadQueue(request);
          onError('VoxBuffer: could not decode audio data: ' + url);
        });
      } else {
        onError('VoxBuffer: could not locate file: ' + url);
      }
    });
    request.addEventListener('error', onError);
    request.addEventListener('progress', function(event) {
      if (event.lengthComputable) {
        // downloading only go to 95%, the last 5% is when the audio is decoding
        request.progress = (event.loaded / event.total) * 0.95;
        onProgress();
      }
    });
    request.send();
    return request;
  }

  public static _removeFromDownloadQueue(request) {
    const index = VoxBuffer._downloadQueue.indexOf(request);
    if (index !== -1) {
      VoxBuffer._downloadQueue.splice(index, 1);
    }
  }

  public static cancelDownloads() {
    VoxBuffer._downloadQueue.slice().forEach(function(request) {
      VoxBuffer._removeFromDownloadQueue(request);
      request.abort();
    });
    return VoxBuffer;
  }
}

Vox.VoxBuffer = VoxBuffer;