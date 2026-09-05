/**
 * LexoRank Fractional Indexing Engine for O(1) Reordering
 * Generates mid-point lexicographical rank strings so inserting between two items
 * never requires re-indexing adjacent database rows.
 * Format: [bucket]|[alphabet_string]: (e.g. "0|hzzzzz:", "0|i00000:")
 */

const BASE36 = '0123456789abcdefghijklmnopqrstuvwxyz';
const MIN_CHAR = '0';
const MAX_CHAR = 'z';
const MID_CHAR = 'i';
const DEFAULT_SPACING = '00000';

class LexoRank {
  /**
   * Generates a middle rank string between two existing ranks in the same bucket
   * @param {string|null} prevRank - Preceding rank or null if inserting at top
   * @param {string|null} nextRank - Succeeding rank or null if inserting at bottom
   * @param {number} bucket - Bucket identifier (0, 1, or 2)
   * @returns {string} New rank string
   */
  static getBetween(prevRank, nextRank, bucket = 0) {
    const bucketPrefix = `${bucket}|`;

    // Case 1: Empty list (first item)
    if (!prevRank && !nextRank) {
      return `${bucketPrefix}${MID_CHAR}${DEFAULT_SPACING}:`;
    }

    // Clean prefixes if provided with bucket
    const prev = prevRank ? (prevRank.includes('|') ? prevRank.split('|')[1].replace(':', '') : prevRank.replace(':', '')) : '';
    const next = nextRank ? (nextRank.includes('|') ? nextRank.split('|')[1].replace(':', '') : nextRank.replace(':', '')) : '';

    // Case 2: Inserting at the very top (before prevRank)
    if (!prev && next) {
      const mid = this._getMidString('', next);
      return `${bucketPrefix}${mid}:`;
    }

    // Case 3: Inserting at the very bottom (after nextRank)
    if (prev && !next) {
      const mid = this._getMidString(prev, '');
      return `${bucketPrefix}${mid}:`;
    }

    // Case 4: Inserting between prev and next
    const mid = this._getMidString(prev, next);
    return `${bucketPrefix}${mid}:`;
  }

  /**
   * Generates initial spaced rank strings for an array of items
   * @param {number} count Number of ranks to generate
   * @param {number} bucket Bucket index
   * @returns {string[]} Array of rank strings
   */
  static generateInitialRanks(count, bucket = 0) {
    const ranks = [];
    let current = null;
    for (let i = 0; i < count; i++) {
      current = this.getBetween(current, null, bucket);
      ranks.push(current);
    }
    return ranks;
  }

  /**
   * Core midpoint calculation between two base-36 strings
   * @private
   */
  static _getMidString(prev, next) {
    let p = prev || '';
    let n = next || '';

    let i = 0;
    let result = '';

    while (true) {
      const pChar = p[i] || MIN_CHAR;
      const nChar = n ? (n[i] || MAX_CHAR) : MAX_CHAR;

      const pVal = BASE36.indexOf(pChar);
      const nVal = BASE36.indexOf(nChar);

      if (pVal === nVal) {
        result += pChar;
        i++;
        continue;
      }

      if (nVal - pVal > 1) {
        const midVal = Math.floor((pVal + nVal) / 2);
        result += BASE36[midVal];
        break;
      } else {
        // Difference is 1, append pChar and look ahead for mid
        result += pChar;
        const subMid = this._getMidString(p.slice(i + 1), n ? n.slice(i + 1) : '');
        result += subMid;
        break;
      }
    }

    return result;
  }

  /**
   * Compares two rank strings
   * @param {string} rankA 
   * @param {string} rankB 
   * @returns {number} -1 if rankA < rankB, 1 if rankA > rankB, 0 if equal
   */
  static compare(rankA, rankB) {
    if (!rankA && !rankB) return 0;
    if (!rankA) return -1;
    if (!rankB) return 1;
    return rankA.localeCompare(rankB);
  }
}

LexoRank.LexoRank = LexoRank;
module.exports = LexoRank;
module.exports.LexoRank = LexoRank;
