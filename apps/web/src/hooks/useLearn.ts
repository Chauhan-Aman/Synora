import { useState } from 'react';

export function useLearn() {
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoadingLearn, setIsLoadingLearn] = useState(false);

  return {
    flashcards, setFlashcards,
    currentCardIndex, setCurrentCardIndex,
    isFlipped, setIsFlipped,
    isLoadingLearn, setIsLoadingLearn
  };
}
