import { Vox } from '../core/Vox';
import { PlayState } from '../type';

export class Loop extends Vox {
    private _loop = 0;
    private _playbackRate = 1;
    private _loopStart = 0;
    private _loopEnd = this.toTicks('1m');
    private _state = new Vox.TimelineState(PlayState.Stopped);
    private data:any;
    private callback:(time:number, data:any) => void;
    
    public startOffset = 0;

    constructor(callback, data?) {
        super();

        this.callback = callback;
        this.data = data;
    }

    private _rescheduleEvents(time?) {
        time = time === undefined ? -1 : time;
        this._state.forEachFrom(time, (event) => {
            if (event.state === PlayState.Started) {
                if (event.id !== undefined) {
                    Vox.VoxTransportCtrl.clear(event.id);
                }
                const startTick = event.time + Math.round(this.startOffset / this._playbackRate);
                // loop >= 0 代表有循环
                if (this._loop >= 0) {
                    let duration:any = Infinity;
                    // loop = 0 代表无限循环，为正代表循环间隔
                    if (this._loop > 0) {
                        duration = this._loop * this._getLoopDuration();
                    }
                    if (duration !== Infinity) {
                        this._state.setStateAtTime(PlayState.Stopped, startTick + duration + 1);
                        duration = new Vox.Ticks(duration);
                    }
                    const interval = new Vox.Ticks(this._getLoopDuration());
                    event.id = Vox.VoxTransportCtrl.scheduleRepeat(this._tick.bind(this), interval, new Vox.Ticks(startTick), duration);
                } else {
                    event.id = Vox.VoxTransportCtrl.schedule(this._tick.bind(this), new Vox.Ticks(startTick));
                }
            }
        });
        return this;
    }

    private _tick(time) {
        const ticks = Vox.VoxTransportCtrl.getTicksAtTime(time);
        if (this._state.getRecentValueAtTime(ticks) === PlayState.Started) {
            this.callback(time, this.data);
        }
    }

    public start(time?) {
        time = this.toTicks(time);
        if (this._state.getRecentValueAtTime(time) === PlayState.Stopped) {
            this._state.add({
                state: PlayState.Started,
                time: time,
                id: undefined,
            });
            this._rescheduleEvents(time);
        }
        return this;
    }

    public stop(time?) {
        this.cancelAfter(time);
        time = this.toTicks(time);
        if (this._state.getRecentValueAtTime(time) === PlayState.Started) {
            this._state.setStateAtTime(PlayState.Stopped, time);
        }
    }

    public cancelAfter(time?) {
        time = time === undefined ? -1 : time;
        time = this.toTicks(time);
        this._state.forEachFrom(time, (event) => {
            Vox.VoxTransportCtrl.clear(event.id);
            console.log('Clear ID', event.id);
        });
        this._state.cancelAfter(time);
        return this;
    }

    get loop() {
        return this._loop;
    }

    set loop(value) {
        this._loop = value;
        this._rescheduleEvents();
    }

    get loopEnd() {
        return new Vox.Ticks(this._loopEnd).toSeconds();
    }

    set loopEnd(value:any) {
        this._loopEnd = this.toTicks(value);
		if (this._loop){
			this._rescheduleEvents();
		}
    }

    get loopStart() {
        return new Vox.Ticks(this._loopStart).toSeconds();
    }

    set loopStart(value:any) {
        this._loopStart = this.toTicks(value);
		if (this._loop){
			this._rescheduleEvents();
		}
    }

    get playbackRate() {
        return this._playbackRate;
    }

    set playbackRate(value) {
        this._playbackRate = value;
        this._rescheduleEvents();
    }

    // 获取离当前时刻最近的一个状态
    get state() {
        return this._state.getRecentValueAtTime(Vox.VoxTransportCtrl.ticks);
    }

    private _getLoopDuration() {
        return Math.round((this._loopEnd - this._loopStart) / this._playbackRate);
    }

    public dispose(){
        this.cancelAfter();
        // this._state.dispose();
        this._state = null;
        this.callback = null;
        this.data = null;
    }
}

Vox.Loop = Loop;