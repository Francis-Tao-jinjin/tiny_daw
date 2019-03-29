
import { Vox } from './Vox';

export class Frequency extends Vox.TimeBase {

    private defaultUnits = 'hz';

    constructor(val, units?) {
        super(val, units);

        const expressions = {
            ...this.expressions,
            'midi': {
                regex: /^(\d+(?:\.\d+)?midi)/,
                method: () => {

                }
            },

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

    }

    public static ftom(Frequency) {

    }
}

const scaleIndexToNote = [
    'C', 'C#', 'D', 'D#', 'E',
    'F', 'F#', 'G', 'G#', 'A',
    'A#', 'B'];

const noteToScaleIndex = {

}


Vox.Frequency = Frequency;