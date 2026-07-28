/**
 * Strips Arabic diacritics (tashkeel) from a string for fuzzy comparison.
 * The Web Speech API often cannot detect exact tajweed, so we compare
 * the consonant skeleton only.
 */
const TASHKEEL_REGEX = /[\u064B-\u0652\u0670]/g;

// Common Arabic normalization: map variant letters to their base form
const NORMALIZE_MAP = {
  // Alif variants → plain alif
  '\u0622': '\u0627', // آ → ا
  '\u0623': '\u0627', // أ → ا
  '\u0625': '\u0627', // إ → ا
  // Teh marbuta → heh
  '\u0629': '\u0647', // ة → ه
  // Alif maksura → yeh
  '\u0649': '\u064A', // ى → ي
};

/**
 * Normalize Arabic text by removing diacritics and normalizing variant letters.
 */
export const normalizeArabic = (text) => {
  if (!text) return '';

  // Remove tashkeel (fatha, damma, kasra, sukun, shadda, etc.)
  let normalized = text.replace(TASHKEEL_REGEX, '');

  // Normalize variant letters
  normalized = normalized
    .split('')
    .map((char) => NORMALIZE_MAP[char] || char)
    .join('');

  return normalized.trim();
};

/**
 * Fuzzy match two Arabic strings by comparing their normalized forms.
 * Returns true if they match after stripping diacritics and normalizing.
 */
export const fuzzyMatchArabic = (spoken, expected) => {
  const normSpoken = normalizeArabic(spoken);
  const normExpected = normalizeArabic(expected);
  return normSpoken === normExpected;
};

/**
 * Check if the spoken transcript contains the expected word.
 * The Web Speech API may return partial or extra words, so we check
 * if the normalized expected word exists within the normalized spoken text.
 */
export const spokenContainsWord = (spokenTranscript, expectedWord) => {
  const normExpected = normalizeArabic(expectedWord);
  if (!normExpected) return false;

  const normSpoken = normalizeArabic(spokenTranscript);

  // Check exact match after normalization
  if (normSpoken === normExpected) return true;

  // Check if the expected word is contained within the spoken text
  // (handles cases where the API returns a phrase)
  const spokenWords = normSpoken.split(/\s+/);
  return spokenWords.some((w) => w === normExpected);
};

export default { normalizeArabic, fuzzyMatchArabic, spokenContainsWord };