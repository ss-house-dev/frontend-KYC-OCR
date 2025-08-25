import { CONFIG } from '../../configs/constant';
import { EMA, EMAVec } from '../mathUtils';

export class EMAManager {
  boxEma = new EMAVec(CONFIG.SMOOTHING.BOX_EMA_ALPHA);
  yawEma = new EMA(CONFIG.SMOOTHING.YAW_EMA_ALPHA);
  yawZero = new EMA(0.1);
  pitchEma = new EMA(CONFIG.SMOOTHING.PITCH_EMA_ALPHA);
  pitchZero = new EMA(0.1);
  earBase = new EMA(CONFIG.SMOOTHING.BLINK_BASE_EMA_ALPHA);
  marBase = new EMA(CONFIG.SMOOTHING.MOUTH_BASE_EMA_ALPHA);

  reset() {
    this.yawEma.reset();
    this.yawZero.reset();
    this.pitchEma.reset();
    this.pitchZero.reset();
    this.earBase.reset();
    this.marBase.reset();
  }
}