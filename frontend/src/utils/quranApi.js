/**
 * Fetches Quran page data from the free Quran.com API v4.
 * Uses text_uthmani for proper Arabic text rendering.
 */

const QURAN_API_BASE = 'https://api.quran.com/api/v4';

/**
 * Fetch the full page data including all verses and words for a given page number.
 * @param {number} pageNumber - 1 to 604
 * @returns {Array} - Array of verses, each containing words with positions and text
 */
export const fetchPageData = async (pageNumber) => {
  try {
    const versesRes = await fetch(
      `${QURAN_API_BASE}/verses/by_page/${pageNumber}?words=true&word_fields=text_uthmani,char_type_name,position&per_page=50`
    );
    const versesData = await versesRes.json();

    if (!versesData.verses) {
      throw new Error('No verses found for this page');
    }

    const verses = versesData.verses.map((verse) => {
      const words = verse.words
        ? verse.words.map((word) => ({
            id: word.id,
            position: word.position,
            // Use text_uthmani (proper Arabic script) - NOT code_v1 which uses presentation forms
            text: word.text_uthmani || '',
            charType: word.char_type_name || 'word',
          }))
        : [];

      return {
        verseId: verse.id,
        verseNumber: verse.verse_number,
        chapterId: verse.chapter_id,
        chapterName: getChapterName(verse.chapter_id),
        words,
      };
    });

    return verses;
  } catch (error) {
    console.error('Error fetching Quran page:', error);
    throw error;
  }
};

/**
 * Simple cache for fetched pages to avoid repeated API calls
 */
const pageCache = {};

export const getCachedPageData = async (pageNumber) => {
  if (pageCache[pageNumber]) {
    return pageCache[pageNumber];
  }
  const data = await fetchPageData(pageNumber);
  pageCache[pageNumber] = data;
  return data;
};

export const clearPageCache = () => {
  Object.keys(pageCache).forEach((key) => delete pageCache[key]);
};

/**
 * Chapter names in Arabic (first 114 surahs)
 */
const CHAPTER_NAMES = {
  1: 'الفاتحة', 2: 'البقرة', 3: 'آل عمران', 4: 'النساء', 5: 'المائدة',
  6: 'الأنعام', 7: 'الأعراف', 8: 'الأنفال', 9: 'التوبة', 10: 'يونس',
  11: 'هود', 12: 'يوسف', 13: 'الرعد', 14: 'إبراهيم', 15: 'الحجر',
  16: 'النحل', 17: 'الإسراء', 18: 'الكهف', 19: 'مريم', 20: 'طه',
  21: 'الأنبياء', 22: 'الحج', 23: 'المؤمنون', 24: 'النور', 25: 'الفرقان',
  26: 'الشعراء', 27: 'النمل', 28: 'القصص', 29: 'العنكبوت', 30: 'الروم',
  31: 'لقمان', 32: 'السجدة', 33: 'الأحزاب', 34: 'سبإ', 35: 'فاطر',
  36: 'يس', 37: 'الصافات', 38: 'ص', 39: 'الزمر', 40: 'غافر',
  41: 'فصلت', 42: 'الشورى', 43: 'الزخرف', 44: 'الدخان', 45: 'الجاثية',
  46: 'الأحقاف', 47: 'محمد', 48: 'الفتح', 49: 'الحجرات', 50: 'ق',
  51: 'الذاريات', 52: 'الطور', 53: 'النجم', 54: 'القمر', 55: 'الرحمن',
  56: 'الواقعة', 57: 'الحديد', 58: 'المجادلة', 59: 'الحشر', 60: 'الممتحنة',
  61: 'الصف', 62: 'الجمعة', 63: 'المنافقون', 64: 'التغابن', 65: 'الطلاق',
  66: 'التحريم', 67: 'الملك', 68: 'القلم', 69: 'الحاقة', 70: 'المعارج',
  71: 'نوح', 72: 'الجن', 73: 'المزمل', 74: 'المدثر', 75: 'القيامة',
  76: 'الإنسان', 77: 'المرسلات', 78: 'النبإ', 79: 'النازعات', 80: 'عبس',
  81: 'التكوير', 82: 'الإنفطار', 83: 'المطففين', 84: 'الإنشقاق', 85: 'البروج',
  86: 'الطارق', 87: 'الأعلى', 88: 'الغاشية', 89: 'الفجر', 90: 'البلد',
  91: 'الشمس', 92: 'الليل', 93: 'الضحى', 94: 'الشرح', 95: 'التين',
  96: 'العلق', 97: 'القدر', 98: 'البينة', 99: 'الزلزلة', 100: 'العاديات',
  101: 'القارعة', 102: 'التكاثر', 103: 'العصر', 104: 'الهمزة', 105: 'الفيل',
  106: 'قريش', 107: 'الماعون', 108: 'الكوثر', 109: 'الكافرون', 110: 'النصر',
  111: 'المسد', 112: 'الإخلاص', 113: 'الفلق', 114: 'الناس',
};

const getChapterName = (id) => CHAPTER_NAMES[id] || '';

export default { fetchPageData, getCachedPageData, clearPageCache };