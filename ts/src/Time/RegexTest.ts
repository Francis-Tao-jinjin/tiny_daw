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
  default: {
    regexp: /^(\d+(?:\.\d+))$/,
  }
}