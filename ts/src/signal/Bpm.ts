import { Vox } from '../core/Vox';
import { VoxType } from '../type';
import { VoxAudioParam } from '../core/AudioParam';

export class Bpm extends Vox.VoxAudioParam {
    constructor(value?) {
        value = value === undefined ? 1 : value;
        super({value:value, units: VoxType.BPM});

        this._timelineEv.memory = Infinity;
        this.cancelScheduledValues(0);
        this._timelineEv.add({
            type: Vox.VoxAudioParam.ActionType.SetValue,
            time: 0,
            value: value,
        });
    }

    public setValueAtTime(value, time) {
        time = this.toSeconds(time);
        value = this._fromUnits(value);
        this._timelineEv.add({
            time,
            value,
            type: VoxAudioParam.ActionType.SetValue,
        });
        this._param.setValueAtTime(value, time);
        const event = this._timelineEv.getMostRecent(time);
        const previousEvent = this._timelineEv.previousEvent(event);
        const ticksTillTime = this._getTicksSinceEvent(previousEvent, time);
        event.ticks = Math.max(ticksTillTime, 0);
        return this;
    }

    public _fromUnits(bpm) {
        return 1 / (60 / bpm / Vox.VoxTransportCtrl.PPQ); 
    }

    public _toUnits(freq) {
        return (freq / Vox.VoxTransportCtrl.PPQ) * 60;
    }

    public _getTicksSinceEvent(event?, time?:number) {
        const val0 = this.getValueAtTime(event.time);
        let val1 = this.getValueAtTime(time);

        if (this._timelineEv.getMostRecent(time).time === time &&
            this._timelineEv.getMostRecent(time).type === Vox.VoxAudioParam.ActionType.SetValue) {
            val1 = this.getValueAtTime(time - this.sampleTime);
        }
        return 0.5 * (time - event.time) * (val0 + val1) + event.ticks;
    }


}