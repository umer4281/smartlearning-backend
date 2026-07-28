import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getCachedPageData } from '../utils/quranApi';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { spokenContainsWord } from '../utils/fuzzyMatch';

/**
 * Generates a short error beep sound using the Web Audio API.
 */
const playErrorBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
    oscillator.type = 'sawtooth';
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    // Silently fail if audio not available
  }
};

/**
 * Convert Western numbers to Arabic-Indic numerals
 */
const getArabicNumber = (num) => {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num)
    .split('')
    .map((d) => arabicDigits[parseInt(d, 10)] || d)
    .join('');
};

const QuranReader = () => {
  const [verses, setVerses] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wrongWords, setWrongWords] = useState(new Set());
  const [recording, setRecording] = useState(false);

  const {
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    isSupported,
  } = useSpeechRecognition();

  const versesRef = useRef(verses);
  const currentWordIndexRef = useRef(currentWordIndex);
  const recordingRef = useRef(recording);
  const wrongWordsRef = useRef(wrongWords);
  const transcriptRef = useRef(transcript);

  // Keep refs in sync with state
  useEffect(() => { currentWordIndexRef.current = currentWordIndex; }, [currentWordIndex]);
  useEffect(() => { recordingRef.current = recording; }, [recording]);
  useEffect(() => { wrongWordsRef.current = wrongWords; }, [wrongWords]);
  useEffect(() => { versesRef.current = verses; }, [verses]);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  // Build flat word list from verses
  const allWords = verses.flatMap((verse) =>
    verse.words
      .filter((w) => w.charType === 'word')
      .map((w) => ({
        text: w.text,
        verseNumber: verse.verseNumber,
      }))
  );

  const totalWords = allWords.length;

  // Fetch page data
  const loadPage = useCallback(async (page) => {
    setLoading(true);
    setError(null);
    setCurrentWordIndex(0);
    setWrongWords(new Set());
    setRecording(false);
    stopListening();

    try {
      const data = await getCachedPageData(page);
      if (data && data.length > 0) {
        setVerses(data);
      } else {
        setError('No verses found for this page from the API.');
      }
    } catch (err) {
      console.error('QuranReader loadPage error:', err);
      setError(err.message || 'Failed to load page. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  }, [stopListening]);

  useEffect(() => {
    loadPage(pageNumber);
  }, [pageNumber, loadPage]);

  // Start/stop recitation
  const toggleRecording = useCallback(() => {
    if (recordingRef.current) {
      stopListening();
      setRecording(false);
    } else {
      const idx = currentWordIndexRef.current;
      const total = allWords.length;
      if (total === 0) return;
      if (idx >= total) return;
      startListening();
      setRecording(true);
    }
  }, [startListening, stopListening, allWords.length]);

  // Handle speech transcript matching
  useEffect(() => {
    if (!recording || !transcript || totalWords === 0) return;

    const idx = currentWordIndexRef.current;
    if (idx >= totalWords) {
      stopListening();
      setRecording(false);
      return;
    }

    const expectedWord = allWords[idx]?.text;
    if (!expectedWord) return;

    const isCorrect = spokenContainsWord(transcript, expectedWord);

    if (isCorrect) {
      const nextIdx = idx + 1;
      setCurrentWordIndex(nextIdx);
      // Clear wrong for this word if it was previously wrong
      if (wrongWordsRef.current.has(idx)) {
        setWrongWords((prev) => {
          const next = new Set(prev);
          next.delete(idx);
          return next;
        });
      }
      if (nextIdx >= totalWords) {
        stopListening();
        setRecording(false);
      }
    }
  }, [transcript, recording, allWords, totalWords, stopListening]);

  // Mark wrong when speech recognition ends without a match
  useEffect(() => {
    if (!isListening && recording && transcript && totalWords > 0) {
      const idx = currentWordIndexRef.current;
      if (idx < totalWords) {
        const expectedWord = allWords[idx]?.text;
        if (expectedWord && !spokenContainsWord(transcript, expectedWord)) {
          setWrongWords((prev) => {
            const next = new Set(prev);
            next.add(idx);
            return next;
          });
          playErrorBeep();
          // Auto-restart listening after a short delay
          setTimeout(() => {
            if (recordingRef.current) {
              startListening();
            }
          }, 600);
        }
      }
    }
  }, [isListening, recording, transcript, allWords, totalWords, startListening]);

  const goToNextPage = () => {
    if (pageNumber < 604) setPageNumber((prev) => prev + 1);
  };

  const goToPrevPage = () => {
    if (pageNumber > 1) setPageNumber((prev) => prev - 1);
  };

  const handlePageInput = (e) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 1 && value <= 604) setPageNumber(value);
  };

  const currentChapter = verses.length > 0 ? verses[0] : null;

  return (
    <div className="quran-reader">
      {/* Navigation Header */}
      <div className="quran-nav">
        <div className="quran-nav-left">
          <button className="quran-nav-btn" onClick={goToPrevPage} disabled={pageNumber <= 1 || loading}>
            ← Previous
          </button>
          <div className="quran-page-input">
            <span>Page</span>
            <input type="number" min="1" max="604" value={pageNumber} onChange={handlePageInput} />
            <span>/ 604</span>
          </div>
          <button className="quran-nav-btn" onClick={goToNextPage} disabled={pageNumber >= 604 || loading}>
            Next →
          </button>
        </div>
        {currentChapter && (
          <div className="quran-chapter-info">
            <span className="quran-chapter-name">{currentChapter.chapterName}</span>
            <span className="quran-verse-range">Page {pageNumber}</span>
          </div>
        )}
      </div>

      {/* Reading Area */}
      <div className="quran-reading-area">
        {loading ? (
          <div className="quran-loading">
            <div className="quran-spinner"></div>
            <p>Loading page {pageNumber}...</p>
          </div>
        ) : error ? (
          <div className="quran-error">
            <span className="quran-error-icon">⚠️</span>
            <p>{error}</p>
            <button className="quran-retry-btn" onClick={() => loadPage(pageNumber)}>Retry</button>
          </div>
        ) : verses.length === 0 ? (
          <div className="quran-empty">
            <p>No verses found for this page.</p>
          </div>
        ) : (
          <div className="quran-text-container">
            {verses[0]?.chapterId !== 9 && <div className="bismillah">﷽</div>}
            {verses.map((verse) => (
              <div key={verse.verseId} className="quran-verse">
                <span className="verse-number">{getArabicNumber(verse.verseNumber)}</span>
                <span className="verse-words">
                  {verse.words
                    .filter((w) => w.charType === 'word')
                    .map((word, wordIdx) => {
                      const globalIdx = verses
                        .slice(0, verses.indexOf(verse))
                        .reduce((acc, v) => acc + v.words.filter((w) => w.charType === 'word').length, 0) + wordIdx;

                      const isCurrentWord = globalIdx === currentWordIndex;
                      const isWrong = wrongWords.has(globalIdx);
                      const isPast = globalIdx < currentWordIndex;

                      return (
                        <span
                          key={word.id}
                          className={`quran-word${isCurrentWord ? ' current' : ''}${isWrong ? ' wrong' : ''}${isPast ? ' recited' : ''}`}
                        >
                          {word.text}
                        </span>
                      );
                    })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="quran-controls">
        <div className="quran-controls-left">
          <div className="quran-word-counter">
            <span className="counter-label">Word Progress</span>
            <span className="counter-value">{currentWordIndex} / {totalWords}</span>
            <div className="counter-bar">
              <div className="counter-fill" style={{ width: totalWords > 0 ? `${(currentWordIndex / totalWords) * 100}%` : '0%' }}></div>
            </div>
          </div>
        </div>
        <div className="quran-controls-right">
          {!isSupported ? (
            <div className="quran-speech-warning">⚠️ Speech recognition requires Chrome</div>
          ) : (
            <button
              className={`quran-record-btn${recording ? ' recording' : ''}`}
              onClick={toggleRecording}
              disabled={totalWords === 0 || (currentWordIndex >= totalWords && totalWords > 0)}
            >
              <span className="record-icon">{recording ? '🔴' : '🎤'}</span>
              <span className="record-text">
                {recording ? 'Stop Recording' : currentWordIndex >= totalWords && totalWords > 0 ? 'Page Complete ✓' : 'Start Reciting'}
              </span>
            </button>
          )}
          {currentWordIndex >= totalWords && totalWords > 0 && (
            <button className="quran-complete-btn" onClick={goToNextPage}>Next Page →</button>
          )}
        </div>
        {speechError && <div className="quran-speech-error">{speechError}</div>}
      </div>
    </div>
  );
};

export default QuranReader;