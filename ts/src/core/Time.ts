import { Vox } from './Vox';
export class Time extends Vox.TimeBase {

  constructor(val, units?) {

    super(val, units);
    const expressions = {
      ...this.expressions,
      'quantize': {
        regexp: /^@(.+)/,
        method: (capture) => {
          if (Vox.VoxTransportCtrl) {

          } else {

          }
        }
      },
      'now': {
        regexp: /^\+(.+)/,
        method: (capture) => {
          return this.now() + (new Time(capture)).valueOf();
        }
      }
    }
  }

  public quantize(subdiv, percent) {
    percent = (percent === undefined) ? 1 : percent;
    const subdivision = (new Time(subdiv)).valueOf();
    const value = this.valueOf();
    const multiple = Math.round(value / subdivision);
    const ideal = multiple * subdivision;
    const diff = ideal - value;
    return value + diff * percent;
  }

  // 寻找和当前时间最接近的音符
  public toNotation() {
    const time = this.toSeconds();
    const testNotations = ['1m'];
    for (let power = 1; power < 8; power++) {
      const subdiv = Math.pow(2, power);
      testNotations.push(subdiv + 'n.');
      testNotations.push(subdiv + 'n');
      testNotations.push(subdiv + 't');
    }
    testNotations.push('0');
    
    let closest = testNotations[0];
    let closestSeconds = (new Vox.Time(testNotations[0])).toSeconds();
    testNotations.forEach((notation) => {
      const notationSeconds = (new Vox.Time(notation)).toSeconds();
      if (Math.abs(notationSeconds - time) < Math.abs(closestSeconds - time)) {
        closest = notation;
        closestSeconds = notationSeconds;
      }
    });
    return closest;
  }

  public toTicks() {
    const quarterTime = this.beatsToUnits(1);
    const quarters = this.valueOf() / quarterTime;
    return Math.round(quarters * this.getPPQ());
  }

  public toSeconds() {
    return this.valueOf();
  }
  
}

Vox.Time = Time;