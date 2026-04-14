import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { RoughCutSegment } from "~/common/types/studio.types";

interface UseTimelineOptions {
  initialSegments: RoughCutSegment[];
  initialMeta: { zoomScale: number; playheadPosition: number };
}

export function useTimeline({ initialSegments, initialMeta }: UseTimelineOptions) {
  const [segments, setSegments] = useState<RoughCutSegment[]>(initialSegments);
  const [playheadPosition, setPlayheadPosition] = useState(initialMeta.playheadPosition);
  const [zoomScale, setZoomScale] = useState(initialMeta.zoomScale);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  const videoSegments = useMemo(
    () => segments.filter((s) => s.trackId === "V1").sort((a, b) => a.startTime - b.startTime),
    [segments],
  );

  const totalDuration = useMemo(() => {
    if (videoSegments.length === 0) return 0;
    const last = videoSegments[videoSegments.length - 1];
    return last.startTime + last.duration;
  }, [videoSegments]);

  const pixelsPerSecond = zoomScale;

  // --- Recalculate start times (magnetic timeline) ---
  function recalculateStartTimes(segs: RoughCutSegment[]): RoughCutSegment[] {
    const v1 = segs
      .filter((s) => s.trackId === "V1")
      .sort((a, b) => a.startTime - b.startTime);
    const others = segs.filter((s) => s.trackId !== "V1");

    let cursor = 0;
    const recalculated = v1.map((seg) => {
      const updated = { ...seg, startTime: cursor };
      cursor += seg.duration;
      return updated;
    });

    return [...recalculated, ...others];
  }

  // --- Actions ---

  const markDirty = useCallback(() => setIsDirty(true), []);

  const addClip = useCallback(
    (clip: {
      resourceId: string;
      resourceType: RoughCutSegment["resourceType"];
      publicUrl?: string;
      thumbnailUrl?: string;
      duration: number;
      label?: string;
    }) => {
      const newSeg: RoughCutSegment = {
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        trackId: "V1",
        type: "video",
        resourceType: clip.resourceType,
        resourceId: clip.resourceId,
        startTime: 0, // will be recalculated
        duration: clip.duration,
        trimStart: 0,
        trimEnd: null,
        playbackSpeed: 1,
        volume: 1,
        zIndex: 0,
        publicUrl: clip.publicUrl,
        thumbnailUrl: clip.thumbnailUrl,
        label: clip.label,
      };

      setSegments((prev) => {
        const all = [...prev, newSeg];
        return recalculateStartTimes(all);
      });
      markDirty();
    },
    [markDirty],
  );

  const removeClip = useCallback(
    (segmentId: string) => {
      setSegments((prev) => {
        const filtered = prev.filter((s) => s.id !== segmentId);
        return recalculateStartTimes(filtered);
      });
      setSelectedSegmentId((prev) => (prev === segmentId ? null : prev));
      markDirty();
    },
    [markDirty],
  );

  const reorderClips = useCallback(
    (fromIndex: number, toIndex: number) => {
      setSegments((prev) => {
        const v1 = prev
          .filter((s) => s.trackId === "V1")
          .sort((a, b) => a.startTime - b.startTime);
        const others = prev.filter((s) => s.trackId !== "V1");

        if (fromIndex < 0 || fromIndex >= v1.length || toIndex < 0 || toIndex >= v1.length) {
          return prev;
        }

        const [moved] = v1.splice(fromIndex, 1);
        v1.splice(toIndex, 0, moved);

        return recalculateStartTimes([...v1, ...others]);
      });
      markDirty();
    },
    [markDirty],
  );

  const splitClip = useCallback(
    (segmentId: string, globalSplitTime: number) => {
      setSegments((prev) => {
        const idx = prev.findIndex((s) => s.id === segmentId);
        if (idx === -1) return prev;
        const seg = prev[idx];

        const localSplitTime = globalSplitTime - seg.startTime;
        if (localSplitTime <= 0.1 || localSplitTime >= seg.duration - 0.1) return prev;

        const firstHalf: RoughCutSegment = {
          ...seg,
          id: `temp-${Date.now()}-a`,
          duration: localSplitTime,
        };

        const secondHalf: RoughCutSegment = {
          ...seg,
          id: `temp-${Date.now()}-b`,
          trimStart: seg.trimStart + localSplitTime,
          duration: seg.duration - localSplitTime,
        };

        const updated = [...prev];
        updated.splice(idx, 1, firstHalf, secondHalf);
        return recalculateStartTimes(updated);
      });
      markDirty();
    },
    [markDirty],
  );

  const trimClip = useCallback(
    (segmentId: string, side: "start" | "end", deltaSeconds: number) => {
      setSegments((prev) => {
        const idx = prev.findIndex((s) => s.id === segmentId);
        if (idx === -1) return prev;
        const seg = prev[idx];

        let newTrimStart = seg.trimStart;
        let newDuration = seg.duration;

        if (side === "start") {
          const maxTrim = seg.duration - 0.1;
          const delta = Math.min(Math.max(deltaSeconds, -seg.trimStart), maxTrim);
          newTrimStart = seg.trimStart + delta;
          newDuration = seg.duration - delta;
        } else {
          newDuration = Math.max(0.1, seg.duration + deltaSeconds);
        }

        const updated = [...prev];
        updated[idx] = { ...seg, trimStart: newTrimStart, duration: newDuration };
        return recalculateStartTimes(updated);
      });
      markDirty();
    },
    [markDirty],
  );

  const autoAssemble = useCallback(
    (scenes: Array<{
      sceneId: string;
      sceneNumber: number;
      duration: number;
      videoUrl?: string;
      thumbnailUrl: string;
      description: string;
    }>) => {
      const newSegments: RoughCutSegment[] = [];
      let cursor = 0;

      for (const scene of scenes) {
        newSegments.push({
          id: `temp-${Date.now()}-${scene.sceneId}`,
          trackId: "V1",
          type: "video",
          resourceType: "scene",
          resourceId: scene.sceneId,
          startTime: cursor,
          duration: scene.duration,
          trimStart: 0,
          trimEnd: null,
          playbackSpeed: 1,
          volume: 1,
          zIndex: 0,
          publicUrl: scene.videoUrl,
          thumbnailUrl: scene.thumbnailUrl,
          label: `씬 ${scene.sceneNumber}`,
        });
        cursor += scene.duration;
      }

      setSegments(newSegments);
      setPlayheadPosition(0);
      markDirty();
    },
    [markDirty],
  );

  // --- Playback ---

  const getActiveClipAtTime = useCallback(
    (time: number): RoughCutSegment | null => {
      return (
        videoSegments.find(
          (s) => time >= s.startTime && time < s.startTime + s.duration,
        ) ?? null
      );
    },
    [videoSegments],
  );

  const play = useCallback(() => {
    if (totalDuration <= 0) return;
    setIsPlaying(true);
    lastFrameTimeRef.current = performance.now();
  }, [totalDuration]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    setPlayheadPosition(Math.max(0, time));
  }, []);

  // Animation frame loop for playback
  useEffect(() => {
    if (!isPlaying) return;

    const tick = (now: number) => {
      const delta = (now - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = now;

      setPlayheadPosition((prev) => {
        const next = prev + delta;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }
        return next;
      });

      animationRef.current = requestAnimationFrame(tick);
    };

    lastFrameTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, totalDuration]);

  // --- Save payload ---

  const toSavePayload = useCallback(() => {
    return segments.map((s) => ({
      trackId: s.trackId,
      type: s.type,
      resourceType: s.resourceType,
      resourceId: s.resourceId,
      startTime: s.startTime,
      duration: s.duration,
      trimStart: s.trimStart,
      trimEnd: s.trimEnd ?? undefined,
      playbackSpeed: s.playbackSpeed,
      volume: s.volume,
      zIndex: s.zIndex,
    }));
  }, [segments]);

  const resetDirty = useCallback(() => setIsDirty(false), []);

  return {
    segments,
    videoSegments,
    playheadPosition,
    zoomScale,
    selectedSegmentId,
    isPlaying,
    isDirty,
    totalDuration,
    pixelsPerSecond,
    addClip,
    removeClip,
    reorderClips,
    splitClip,
    trimClip,
    autoAssemble,
    play,
    pause,
    seekTo,
    setZoomScale,
    setSelectedSegmentId,
    setPlayheadPosition,
    getActiveClipAtTime,
    toSavePayload,
    resetDirty,
  };
}
