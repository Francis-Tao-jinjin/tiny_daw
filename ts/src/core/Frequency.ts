
import { Vox } from './Vox';

export class Frequency extends Vox.TimeBase {

    protected _defaultUnits = 'hz';

    constructor(val, units?) {
        super(val, units);

        const expressions = {
            ...this.expressions,
            midi: {
                regexp: /^(\d+(?:\.\d+)?midi)/,
                method: (value) => {
                    if (this._defaultUnits === 'midi') {
                        return value;
                    } else {
                        return Vox.Frequency.mtof(value);
                    }
                }
            },
            note: {
                regexp: /^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i,
                method: function(pitch, octave) {
                    const index = noteToScaleIndex[pitch.toLowerCase()];
                    const noteNumber = index + (parseInt(octave) + 1) * 12;
                    if (this._defaultUnits === 'midi') {
                        return noteNumber;
                    } else {
                        console.log('>>noteNumber', noteNumber);
                        return Vox.Frequency.mtof(noteNumber);
                    }
                }
            }

        }
    this.expressions = expressions;
    }

    public secondsToUnits(seconds) {
        return 1 / seconds;
    }

    public beatsToUnits(beats) {
        return 1 / Vox.TimeBase.prototype.beatsToUnits.call(this, beats);
    }

    public ticksToUnits(ticks) {
        return 1 / ((ticks * 60) / (Vox.VoxTransportCtrl.bpm.value * Vox.VoxTransportCtrl.PPQ));
    }
''
    public freqcyToUnits(freq) {
        return freq;
    }

    public toTicks() {
        const quarterTime = this.beatsToUnits(1);
        const quarters = this.valueOf() / quarterTime;
        return Math.floor(quarters * Vox.VoxTransportCtrl.PPQ);
    }

    public toFrequency() {
        return Vox.TimeBase.prototype.toFrequency.call(this);
    }

    public toSeconds() {
        return 1 / Vox.TimeBase.prototype.toSeconds.call(this);
    }

    public toNote() {
        const freq = this.toFrequency();
        const log = (Math as any).log2(freq / Vox.Frequency.A4);
        let noteNumber = Math.round(12 * log) + 57;
        const octave = Math.floor(noteNumber / 12);
        if (octave < 0) {
            noteNumber += -12 * octave;
        }
        const noteName = scaleIndexToNote[noteNumber % 12];
        return noteName + octave.toString;
    }
    
    public static A4 = 440;
    public static mtof(midi) {
        return Vox.Frequency.A4 * Math.pow(2, (midi - 69) / 12);
    }

    public static ftom(freq) {
        return 69 + Math.round(12 * (Math as any).log2(freq / Vox.Frequency.A4));

    }
}

const scaleIndexToNote = [
    'C', 'C#', 'D', 'D#', 'E',
    'F', 'F#', 'G', 'G#', 'A',
    'A#', 'B'];

const noteToScaleIndex = {
    cb: -1, c: 0, 'c#': 1,
    db:  1, d: 2, 'd#': 3,
    eb:  3, e: 4, 'e#': 5,
    fb:  4, f: 5, 'f#': 6,
    gb:  6, g: 7, 'g#': 8,
    ab:  8, a: 9, 'a#': 10,
    bb: 10, b: 11, 'b#': 12,
}


Vox.Frequency = Frequency;