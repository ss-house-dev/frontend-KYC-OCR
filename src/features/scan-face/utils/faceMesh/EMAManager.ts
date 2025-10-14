import { CONFIG } from '../../configs/constant';
import { EMA, EMAVec, StableEMA } from '../mathUtils';

export class EMAManager {
  boxEma = new EMAVec(CONFIG.SMOOTHING.BOX_EMA_ALPHA);
  yawEma = new EMA(CONFIG.SMOOTHING.YAW_EMA_ALPHA);
  pitchEma = new EMA(CONFIG.SMOOTHING.PITCH_EMA_ALPHA);
  
  // EMA คู่สำหรับ momentum (แยกเร็ว/ช้า)
  yawFast = new EMA((CONFIG.SMOOTHING as any).YAW_FAST_ALPHA ?? 0.5);
  yawSlow = new EMA((CONFIG.SMOOTHING as any).YAW_SLOW_ALPHA ?? 0.1);
  pitchFast = new EMA((CONFIG.SMOOTHING as any).PITCH_FAST_ALPHA ?? 0.5);
  pitchSlow = new EMA((CONFIG.SMOOTHING as any).PITCH_SLOW_ALPHA ?? 0.1);
  
  // แยก EMA สำหรับ zero position ให้ stable กว่า
  yawZero = new StableEMA(CONFIG.SMOOTHING.ZERO_EMA_ALPHA);
  pitchZero = new StableEMA(CONFIG.SMOOTHING.ZERO_EMA_ALPHA);
  
  earBase = new EMA(CONFIG.SMOOTHING.BLINK_BASE_EMA_ALPHA);
  marBase = new EMA(CONFIG.SMOOTHING.MOUTH_BASE_EMA_ALPHA);

  reset() {
    // reset เฉพาะ movement EMAs, เก็บ zero position ไว้
    this.yawEma.reset();
    this.pitchEma.reset();
    this.yawFast.reset();
    this.yawSlow.reset();
    this.pitchFast.reset();
    this.pitchSlow.reset();
    this.earBase.reset();
    this.marBase.reset();
  }

  resetAll() {
    // reset ทั้งหมดรวมถึง zero position
    this.boxEma.reset();
    this.yawEma.reset();
    this.pitchEma.reset();
    this.yawFast.reset();
    this.yawSlow.reset();
    this.pitchFast.reset();
    this.pitchSlow.reset();
    this.yawZero.reset();
    this.pitchZero.reset();
    this.earBase.reset();
    this.marBase.reset();
  }
}