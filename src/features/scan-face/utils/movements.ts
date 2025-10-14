export type Phase =
  | "yaw_left" | "yaw_right"
  | "pitch_up" | "pitch_down"
  | "blink" | "mouth";

export type MovementGroup = "yaw" | "pitch" | "blink" | "mouth";

export const MOVEMENT_TO_PHASES: Record<MovementGroup, Phase[]> = {
  yaw: ["yaw_left", "yaw_right"],
  pitch: ["pitch_up", "pitch_down"],
  blink: ["blink"],
  mouth: ["mouth"],
};

export function groupOfPhase(phase: Phase): MovementGroup {
  if (phase.startsWith("yaw")) return "yaw";
  if (phase.startsWith("pitch")) return "pitch";
  if (phase === "blink") return "blink";
  return "mouth";
}

export function randomTwoGroups(): MovementGroup[] {
  const all: MovementGroup[] = ["yaw", "blink", "mouth"]; // เอาการสุ่ม "pitch" ออก
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, 2);
}

export function firstPhaseOf(group: MovementGroup): Phase {
  return MOVEMENT_TO_PHASES[group][0];
}

export function nextAllowedPhase(
  seq: Phase[],
  current: Phase | "-",
): Phase | null {
  if (current === "-") return seq[0] ?? null;
  const idx = seq.indexOf(current);
  if (idx < 0) return seq[0] ?? null;
  return seq[idx + 1] ?? null;
}
