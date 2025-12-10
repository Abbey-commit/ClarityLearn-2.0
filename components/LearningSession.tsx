// -----------------------------
// FILE NAME: LearningSession.tsx
// Location: ClarityLearn-2.0/components/LearningSession.tsx
// Purpose: Quiz interface for learning terms
// -----------------------------

'use client';

import { useState } from 'react';
import { Term } from '@/lib/clarity-dictionary';
import { useLearningProgress } from '@/hooks/useLearningProgress';
import { markTermLearned } from '@/lib/contract-calls';
import { useWallet } from '@/hooks/useWallet';

interface LearningSessionProps {
  term: Term;
  onClose: () => void;
  onComplete: () => void;
}

export default function LearningSession({ term, onClose, onComplete }: LearningSessionProps) {
  const { address } = useWallet();
  const { markTermLearned: markLocal, isTermLearned } = useLearningProgress();
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const alreadyLearned = isTermLearned(term.id);

  // Simple quiz questions (in real app, these would be from smart contract)
  const quizQuestions = [
    {
      question: `What is the main purpose of ${term.term}?`,
      options: [
        term.definition,
        "A type of cryptocurrency token",
        "A blockchain mining algorithm",
        "A wallet security feature"
      ],
      correctAnswer: 0
    }
  ];

  const currentQuestion = quizQuestions[0];

  const handleStartQuiz = () => {
    setShowQuiz(true);
  };

  const handleSelectAnswer = (index: number) => {
    setSelectedAnswer(index);
  };

  const handleSubmitQuiz = async () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    if (isCorrect) {
      setIsSubmitting(true);
      
      // Mark locally
      markLocal(term.id);
      
      // In a real scenario, you'd call the smart contract here
      // For now, we'll just simulate it
      try {
        // await markTermLearned(stakeId, term.id, address);
        console.log('Term marked as learned:', term.id);
      } catch (error) {
        console.error('Error marking term:', error);
      }
      
      setQuizComplete(true);
      setIsSubmitting(false);
      
      setTimeout(() => {
        onComplete();
      }, 2000);
    } else {
      alert('Incorrect answer. Please try again!');
      setSelectedAnswer(null);
    }
  };

  if (quizComplete) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Well Done!</h2>
          <p className="text-gray-600">You've successfully learned this term</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{term.term}</h2>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
              {term.category}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!showQuiz ? (
          <>
            {/* Definition */}
            <div className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Definition</h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                {term.definition}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                <span>{term.votes} votes</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>By {term.contributor.slice(0, 8)}...</span>
              </div>
            </div>

            {/* Action Buttons */}
            {alreadyLearned ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-green-700 font-semibold">✓ You've already learned this term</p>
              </div>
            ) : (
              <button
                onClick={handleStartQuiz}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-bold text-lg hover:shadow-xl transition-all"
              >
                Take Quiz to Mark as Learned
              </button>
            )}
          </>
        ) : (
          <>
            {/* Quiz */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800">Quick Quiz</h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700 font-medium">{currentQuestion.question}</p>
              </div>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      selectedAnswer === index
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedAnswer === index
                          ? 'border-purple-600 bg-purple-600'
                          : 'border-gray-300'
                      }`}>
                        {selectedAnswer === index && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-gray-700">{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleSubmitQuiz}
                disabled={selectedAnswer === null || isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}