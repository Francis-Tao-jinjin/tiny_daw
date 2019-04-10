import { Vox } from '../core/Vox';

export const expressions = {
  n: {  //音符
    regexp: /^(\d+)n(\.?)$/i,
    method: function (value, dot){
      value = parseInt(value);
      const scalar = dot === '.' ? 1.5 : 1;
      if (value === 1) {
        return this.beatsToUnits(this.getTimeSignature()) * scalar;
      } else {
        return this.beatsToUnits(4 / value) * scalar;
      }
    }
  },
  t: {  //3连音
    regexp: /^(\d+)t$/i,
    method: function(value) {
      value = parseInt(value);
      return this.beatsToUnits(8 / (parseInt(value) * 3));
    }
  },
  i: {  //tick
    regexp: /^(\d+)i$/i,
    method: function(value) {
      return this.ticksToUnits(parseInt(value));
    }
  },
  hz: {
    regexp: /^(\d+(?:\.\d+)?)hz$/i,
    method: function(value) {
      return this.freqcyToUnits(parseFloat(value));
    }
  },
  s: {
    regexp: /^(\d+(?:\.\d+)?)s$/,
    method: function(value) {
      return this.secondsToUnits(parseFloat(value));
    }
  },
  sample: {
    regexp: /^(\d+)samples$/,
    method: function(value) {
      return parseInt(value) / this.sampleRate;
    }
  },
  now : {
		regexp : /^\+(.+)/,
		method : function(capture){
			return this.now() + (new this.constructor(capture)).valueOf();
		}
  },
  note: {
    regexp: /^([a-g]{1}(?:b|#)?)([0-9]+)/i,
    method: function(pitch, octave) {
      var index = noteToScaleIndex[pitch.toLowerCase()];
			var noteNumber = index + (parseInt(octave) + 1) * 12;
			if (this._defaultUnits === "midi"){
				return noteNumber;
			} else {
				return Vox.Frequency.mtof(noteNumber);
			}
    }
  },
  default: {
    regexp: /^(\d+(?:\.\d+))$/,
    method : function(value){
			return expressions[this._defaultUnits].method.call(this, value);
		}
  }
}

const noteToScaleIndex = {
  cb: -1, c: 0, 'c#': 1,
  db:  1, d: 2, 'd#': 3,
  eb:  3, e: 4, 'e#': 5,
  fb:  4, f: 5, 'f#': 6,
  gb:  6, g: 7, 'g#': 8,
  ab:  8, a: 9, 'a#': 10,
  bb: 10, b: 11, 'b#': 12,
}