import { Vox } from './Vox';

export class Frequency extends Vox.TimeBase {

    private defaultUnits = 'hz';

    constructor(val, units?) {
        super(val, units);

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
        
    }
}