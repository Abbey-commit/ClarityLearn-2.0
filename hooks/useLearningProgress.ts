// -----------------------------
// FILE NAME: useLearningProgress.ts
// Location: ClarityLearn-2.0/hooks/useLearningProgress.ts
// Purpose: Track learning progress and term completion
// -----------------------------

import { useState, useEffect } from 'react';

interface LearningProgress {
  learnedTerms: number[];
  currentStakeId: number | null;
  termsCompleted: number;
  termsRequired: number;
}

export const useLearningProgress = () => {
  const [progress, setProgress] = useState<LearningProgress>({
    learnedTerms: [],
    currentStakeId: null,
    termsCompleted: 0,
    termsRequired: 0,
  });

  // Load progress from localStorage (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('learningProgress');
      if (saved) {
        setProgress(JSON.parse(saved));
      }
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = (newProgress: Partial<LearningProgress>) => {
    const updated = { ...progress, ...newProgress };
    setProgress(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('learningProgress', JSON.stringify(updated));
    }
  };

  // Mark a term as learned
  const markTermLearned = (termId: number) => {
    if (!progress.learnedTerms.includes(termId)) {
      const newLearned = [...progress.learnedTerms, termId];
      saveProgress({
        learnedTerms: newLearned,
        termsCompleted: newLearned.length,
      });
    }
  };

  // Check if term is learned
  const isTermLearned = (termId: number) => {
    return progress.learnedTerms.includes(termId);
  };

  // Reset progress
  const resetProgress = () => {
    const fresh = {
      learnedTerms: [],
      currentStakeId: null,
      termsCompleted: 0,
      termsRequired: 0,
    };
    setProgress(fresh);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('learningProgress');
    }
  };

  return {
    ...progress,
    markTermLearned,
    isTermLearned,
    resetProgress,
    saveProgress,
  };
};