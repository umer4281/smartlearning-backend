import React, { useState, useEffect, useCallback } from 'react';

const namesOfAllah = [
  { arabic: "الله", amharic: "አላህ" },
  { arabic: "الرَّحْمَنُ", amharic: "እጅግ በጣም ሩህሩሁ" },
  { arabic: "الرَّحِيمُ", amharic: "እጅግ በጣም አዛኙ" },
  { arabic: "المَلِكُ", amharic: "ንጉሱ" },
  { arabic: "القُدُّوسُ", amharic: "ከጉድለት የጠራው" },
  { arabic: "السَّلَامُ", amharic: "የሰላም ባለቤቱ" },
  { arabic: "المُؤْمِنُ", amharic: "ሰላም አድራጊው" },
  { arabic: "الْمُهَيْمِنُ", amharic: "ሁሉን ጠባቂው" },
  { arabic: "العزيز", amharic: "አሸናፊው" },
  { arabic: "الجبَّارُ", amharic: "ጠጋኙ" },
  { arabic: "المُتَكَبِّرُ", amharic: "ኩሩው" },
  { arabic: "الخَالِقُ", amharic: "ፈጣሪው" },
  { arabic: "البَارِئُ", amharic: "ከምንም አስገኚው" },
  { arabic: "الْمُصَوِّرُ", amharic: "ቅርፅን አሳማሪው" },
  { arabic: "الغَفَّارُ", amharic: "መሀሪው" },
  { arabic: "القَهَّارُ", amharic: "አሸናፊው" },
  { arabic: "الوَهَّابُ", amharic: "ለጋሱ" },
  { arabic: "الرَزَّاقُ", amharic: "ሲሳይን ሰጪው" },
  { arabic: "الفَتَّاحُ", amharic: "ከፋፋቹ" },
  { arabic: "العَلِيمُ", amharic: "አዋቂው" },
  { arabic: "القَابِضُ", amharic: "ሲሳይን ጨባጩ" },
  { arabic: "البَاسِطُ", amharic: "ሲሳይን ዘርጊው" },
  { arabic: "الخَافِضُ", amharic: "ዝቅ አድራጊው" },
  { arabic: "الرَّافِعُ", amharic: "ከፍ አድራጊው" },
  { arabic: "المُعِزُّ", amharic: "ልቅና ሰጪው" },
  { arabic: "المُذِلُّ", amharic: "ጠላትን አዋራጁ" },
  { arabic: "السَّمِيعُ", amharic: "ሰሚው" },
  { arabic: "البَصِيرُ", amharic: "ተመልካቹ" },
  { arabic: "الحَكَمُ", amharic: "ዳኛው" },
  { arabic: "العَدْلُ", amharic: "ፍትሀዊው" },
  { arabic: "اللَّطِيفُ", amharic: "ረቂቁ" },
  { arabic: "الخَبِيرُ", amharic: "ውስጥ አዋቂው" },
  { arabic: "الحَلِيمُ", amharic: "ቻዩ" },
  { arabic: "العَظِيمُ", amharic: "ታላቁ" },
  { arabic: "الغَفُورُ", amharic: "መሀሪው" },
  { arabic: "الشَّكُورُ", amharic: "አመስጋኙ" },
  { arabic: "الْعَلِيُّ", amharic: "የሁሉ የበላዩ" },
  { arabic: "الْكَبِيرُ", amharic: "ታላቁ" },
  { arabic: "الحفِيظٌ", amharic: "ጠባቂው" },
  { arabic: "الْمُقِيتُ", amharic: "ቀላቢው" },
  { arabic: "الحسيب", amharic: "ለሁሉም በቂው" },
  { arabic: "الجليل", amharic: "ምሉኡ" },
  { arabic: "الْكَرِيمُ", amharic: "ቸሩ" },
  { arabic: "الرَّقِيبُ", amharic: "ተጠባባቂው" },
  { arabic: "الْمُجِيبُ", amharic: "ጥሪን ተቀባዩ" },
  { arabic: "الْوَاسِعُ", amharic: "ሰፊው" },
  { arabic: "الْحَكِيمُ", amharic: "ጥበበኛው" },
  { arabic: "الْوَدُودُ", amharic: "ወዳዱ" },
  { arabic: "الْمَجِيدُ", amharic: "የላቀው" },
  { arabic: "الْبَاعِثُ", amharic: "ሙታንን ቀስቃሹ" },
];

// Shuffle array helper
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const MemoryGame = () => {
  const [level, setLevel] = useState('easy'); // easy=6, medium=10, hard=15
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('');

  const getPairCount = useCallback((lvl) => {
    switch (lvl) {
      case 'easy': return 6;
      case 'medium': return 10;
      case 'hard': return 15;
      default: return 6;
    }
  }, []);

  const initGame = useCallback((lvl) => {
    const pairCount = getPairCount(lvl);
    const selectedNames = shuffle(namesOfAllah).slice(0, pairCount);

    // Create pairs: one Arabic card + one Amharic card per name
    const gameCards = [];
    selectedNames.forEach((name, idx) => {
      gameCards.push({
        id: idx * 2,
        pairId: idx,
        text: name.arabic,
        lang: 'arabic',
        amharic: name.amharic,
        flipped: false,
      });
      gameCards.push({
        id: idx * 2 + 1,
        pairId: idx,
        text: name.amharic,
        lang: 'amharic',
        arabic: name.arabic,
        flipped: false,
      });
    });

    setCards(shuffle(gameCards));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setMatchCount(0);
    setGameComplete(false);
    setGameStarted(true);
    setSelectedLevel(lvl);
    setLevel(lvl);
  }, [getPairCount]);

  const handleCardClick = (id) => {
    if (!gameStarted || gameComplete) return;
    if (flipped.length === 2) return;
    if (matched.includes(id)) return;
    if (flipped.includes(id)) return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      const [first, second] = newFlipped;
      const card1 = cards.find((c) => c.id === first);
      const card2 = cards.find((c) => c.id === second);

      // Match if same pairId (Arabic matches its Amharic translation)
      if (card1 && card2 && card1.pairId === card2.pairId) {
        // Found a match!
        setTimeout(() => {
          setMatched((prev) => [...prev, first, second]);
          setMatchCount((prev) => prev + 1);
          setFlipped([]);

          // Check if game is complete
          setCards((prevCards) => {
            const totalPairs = getPairCount(level);
            if (matchCount + 1 >= totalPairs) {
              setTimeout(() => setGameComplete(true), 300);
            }
            return prevCards;
          });
        }, 400);
      } else {
        // No match - flip back
        setTimeout(() => setFlipped([]), 900);
      }
    }
  };

  const totalPairs = getPairCount(level);

  // Level selector screen
  if (!gameStarted) {
    return (
      <div className="games-page">
        <div className="container py-4">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="text-center mb-5">
                <h1 className="games-title">
                  <span className="games-title-icon">🕌</span>
                  <span className="games-title-text">Names of Allah</span>
                </h1>
                <p className="games-subtitle">Match each Arabic name with its Amharic meaning</p>
              </div>

              <div className="row g-4 justify-content-center">
                {[
                  { level: 'easy', label: 'Easy', pairs: 6, emoji: '🌱', desc: '6 pairs', color: '#10b981' },
                  { level: 'medium', label: 'Medium', pairs: 10, emoji: '🌿', desc: '10 pairs', color: '#f59e0b' },
                  { level: 'hard', label: 'Hard', pairs: 15, emoji: '🌳', desc: '15 pairs', color: '#ef4444' },
                ].map((option) => (
                  <div className="col-md-4" key={option.level}>
                    <button
                      className="level-card"
                      onClick={() => initGame(option.level)}
                      style={{ '--accent': option.color }}
                    >
                      <span className="level-emoji">{option.emoji}</span>
                      <span className="level-label">{option.label}</span>
                      <span className="level-desc">{option.desc}</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="text-center mt-5">
                <p className="games-hint">
                  Learn the beautiful names of Allah (ﷻ) by matching Arabic to Amharic
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="games-page">
      <div className="container py-4">
        {/* Header */}
        <div className="game-header">
          <div className="game-header-left">
            <button className="btn btn-back" onClick={() => setGameStarted(false)}>
              ← Back
            </button>
            <div>
              <h2 className="game-title">🕌 Names of Allah</h2>
              <p className="game-level-badge">
                {level === 'easy' ? '🌱 Easy' : level === 'medium' ? '🌿 Medium' : '🌳 Hard'}
              </p>
            </div>
          </div>
          <div className="game-header-right">
            <div className="game-stat">
              <span className="game-stat-label">Moves</span>
              <span className="game-stat-value">{moves}</span>
            </div>
            <div className="game-stat">
              <span className="game-stat-label">Matched</span>
              <span className="game-stat-value">{matchCount}/{totalPairs}</span>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className={`cards-grid ${level}`}>
          {cards.map((card) => {
            const isFlipped = flipped.includes(card.id);
            const isMatched = matched.includes(card.id);

            return (
              <button
                key={card.id}
                className={`game-card ${isFlipped || isMatched ? 'flipped' : ''} ${isMatched ? 'matched' : ''} ${card.lang}`}
                onClick={() => handleCardClick(card.id)}
                disabled={isMatched}
              >
                <div className="game-card-inner">
                  <div className="game-card-front">
                    <span className="card-question">❓</span>
                  </div>
                  <div className={`game-card-back ${card.lang}`}>
                    <span className="card-lang-badge">
                      {card.lang === 'arabic' ? 'العربية' : 'አማርኛ'}
                    </span>
                    <span className={`card-text ${card.lang}`}>
                      {card.text}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="game-progress">
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${(matchCount / totalPairs) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Complete Modal */}
        {gameComplete && (
          <div className="game-complete-overlay">
            <div className="game-complete-modal">
              <div className="complete-icon">🎉</div>
              <h3 className="complete-title">Masha'Allah! 🎊</h3>
              <p className="complete-desc">
                You matched all {totalPairs} names of Allah!
              </p>
              <div className="complete-stats">
                <div className="complete-stat">
                  <span className="cs-value">{moves}</span>
                  <span className="cs-label">Total Moves</span>
                </div>
                <div className="complete-stat">
                  <span className="cs-value">{Math.round((totalPairs / moves) * 100)}%</span>
                  <span className="cs-label">Accuracy</span>
                </div>
              </div>
              <div className="complete-actions">
                <button className="btn btn-replay" onClick={() => initGame(level)}>
                  🔄 Play Again
                </button>
                <button className="btn btn-change-level" onClick={() => setGameStarted(false)}>
                  📋 Change Level
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Games = () => {
  return <MemoryGame />;
};

export default Games;