// -----------------------------
// FILE NAME: TermBrowser.tsx
// Location: ClarityLearn-2.0/components/TermBrowser.tsx
// Purpose: Browse and search crypto terms
// -----------------------------

'use client';

import { useState } from 'react';
import { FALLBACK_TERMS, Term } from '@/lib/clarity-dictionary';
import { CATEGORIES } from '@/lib/constants';

interface TermBrowserProps {
  onSelectTerm: (term: Term) => void;
}

export default function TermBrowser({ onSelectTerm }: TermBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [terms] = useState<Term[]>(FALLBACK_TERMS);

  // Filter terms
  const filteredTerms = terms.filter(term => {
    const matchesSearch = term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         term.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || term.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search terms or definitions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
        />
        <svg 
          className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedCategory === 'All'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {CATEGORIES.filter(c => c !== 'Other').map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-600">
        {filteredTerms.length} {filteredTerms.length === 1 ? 'term' : 'terms'} found
      </p>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTerms.map(term => (
          <div
            key={term.id}
            onClick={() => onSelectTerm(term)}
            className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-600 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-bold text-gray-800">{term.term}</h3>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                {term.category}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {term.definition}
            </p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                {term.votes}
              </span>
              <span className="text-xs">
                Click to learn →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTerms.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No terms found</h3>
          <p className="text-gray-500">Try a different search or category</p>
        </div>
      )}
    </div>
  );
}
