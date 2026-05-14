import { useState, useCallback, useRef } from 'react';
import type { MascotState } from '../components/Mascot/NongJodHai';
import { useAppStore } from '../store/useAppStore';

export function useNongJodHaiEmotion() {
  const dashboard = useAppStore((s) => s.dashboard);
  const [localState, setLocalState] = useState<MascotState>('idle');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived state from budget
  const budgetState: MascotState =
    (dashboard?.budgetUsedPercent ?? 0) >= 80 ? 'warning' : 'idle';

  // Override with temporary local state (writing/success), fallback to budget state
  const state: MascotState = localState !== 'idle' ? localState : budgetState;

  const triggerWriting = useCallback(() => {
    setLocalState('writing');
  }, []);

  const stopWriting = useCallback(() => {
    setLocalState('idle');
  }, []);

  const triggerSuccess = useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setLocalState('success');
    resetTimer.current = setTimeout(() => setLocalState('idle'), 2800);
  }, []);

  const triggerWarning = useCallback(() => {
    setLocalState('warning');
  }, []);

  return { state, triggerWriting, stopWriting, triggerSuccess, triggerWarning };
}
