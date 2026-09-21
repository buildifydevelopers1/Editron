import { useRef, useState, useCallback } from 'react';
import {
  AspectRatio,
  ColorGradingSettings,
  SubtitleStyle,
  SubtitleWord,
  TransformSettings,
  VideoClip,
  VideoEffect,
  VideoTransition,
} from '../types';

export interface TimelineSnapshot {
  clips: VideoClip[];
  transitions: VideoTransition[];
  subtitles: SubtitleWord[];
  subtitleStyle: SubtitleStyle;
  colorGrading: ColorGradingSettings;
  effects: VideoEffect[];
  aspectRatio: AspectRatio;
  transform: TransformSettings;
  reelAudioUrl?: string;
  duration: number;
  userPhotos?: any[];
}

const MAX_HISTORY_STEPS = 35;

export function useTimelineHistory(initialSnapshot: TimelineSnapshot) {
  const [past, setPast] = useState<TimelineSnapshot[]>([]);
  const [future, setFuture] = useState<TimelineSnapshot[]>([]);
  const currentSnapshotRef = useRef<TimelineSnapshot>(initialSnapshot);

  // Deep clone helper to ensure snapshots are immutable
  const cloneSnapshot = (s: TimelineSnapshot): TimelineSnapshot => ({
    clips: JSON.parse(JSON.stringify(s.clips || [])),
    transitions: JSON.parse(JSON.stringify(s.transitions || [])),
    subtitles: JSON.parse(JSON.stringify(s.subtitles || [])),
    subtitleStyle: { ...s.subtitleStyle },
    colorGrading: JSON.parse(JSON.stringify(s.colorGrading || {})),
    effects: JSON.parse(JSON.stringify(s.effects || [])),
    aspectRatio: s.aspectRatio,
    transform: { ...s.transform },
    reelAudioUrl: s.reelAudioUrl,
    duration: s.duration,
    userPhotos: s.userPhotos ? [...s.userPhotos] : [],
  });

  /**
   * Record a new snapshot into history
   */
  const recordSnapshot = useCallback((newSnapshot: TimelineSnapshot) => {
    // Avoid duplicate snapshots
    const current = currentSnapshotRef.current;
    if (
      JSON.stringify(current.clips) === JSON.stringify(newSnapshot.clips) &&
      JSON.stringify(current.transitions) === JSON.stringify(newSnapshot.transitions) &&
      current.aspectRatio === newSnapshot.aspectRatio &&
      current.reelAudioUrl === newSnapshot.reelAudioUrl &&
      current.subtitleStyle?.preset === newSnapshot.subtitleStyle?.preset &&
      JSON.stringify(current.colorGrading) === JSON.stringify(newSnapshot.colorGrading) &&
      JSON.stringify(current.effects) === JSON.stringify(newSnapshot.effects)
    ) {
      return;
    }

    setPast((prev) => {
      const updated = [...prev, cloneSnapshot(currentSnapshotRef.current)];
      if (updated.length > MAX_HISTORY_STEPS) {
        return updated.slice(updated.length - MAX_HISTORY_STEPS);
      }
      return updated;
    });

    // Clear redo history when a new action is performed
    setFuture([]);
    currentSnapshotRef.current = cloneSnapshot(newSnapshot);
  }, []);

  /**
   * Undo to the previous timeline state
   */
  const undo = useCallback(
    (applySnapshot: (snapshot: TimelineSnapshot) => void) => {
      if (past.length === 0) return;

      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);

      setFuture((prev) => [cloneSnapshot(currentSnapshotRef.current), ...prev]);
      setPast(newPast);

      currentSnapshotRef.current = cloneSnapshot(previous);
      applySnapshot(previous);
    },
    [past]
  );

  /**
   * Redo to the next timeline state
   */
  const redo = useCallback(
    (applySnapshot: (snapshot: TimelineSnapshot) => void) => {
      if (future.length === 0) return;

      const next = future[0];
      const newFuture = future.slice(1);

      setPast((prev) => [...prev, cloneSnapshot(currentSnapshotRef.current)]);
      setFuture(newFuture);

      currentSnapshotRef.current = cloneSnapshot(next);
      applySnapshot(next);
    },
    [future]
  );

  return {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    historyCount: past.length,
    recordSnapshot,
    undo,
    redo,
    currentSnapshotRef,
  };
}
