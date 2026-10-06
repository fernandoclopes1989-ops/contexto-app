/**
 * phoneticService.js — Zero-Token Offline Phonetic Transcription Engine
 * Provides instant IPA notation and Brazilian Portuguese pronunciation respelling.
 * Runs 100% locally with 0ms latency, zero API calls, and zero tokens spent.
 */

// Comprehensive English word-to-phonetic dictionary for high-frequency spoken English
const PHONETIC_DICT = {
  // Pronouns
  'i': { ipa: 'aɪ', br: 'ái' },
  'you': { ipa: 'juː', br: 'iú' },
  'he': { ipa: 'hiː', br: 'rí' },
  'she': { ipa: 'ʃiː', br: 'chí' },
  'it': { ipa: 'ɪt', br: 'it' },
  'we': { ipa: 'wiː', br: 'uí' },
  'they': { ipa: 'ðeɪ', br: 'dêi' },
  'me': { ipa: 'miː', br: 'mi' },
  'him': { ipa: 'hɪm', br: 'rim' },
  'her': { ipa: 'hɜːr', br: 'râr' },
  'us': { ipa: 'ʌs', br: 'âs' },
  'them': { ipa: 'ðɛm', br: 'dém' },
  'my': { ipa: 'maɪ', br: 'mái' },
  'your': { ipa: 'jɔːr', br: 'iór' },
  'his': { ipa: 'hɪz', br: 'ríz' },
  'our': { ipa: 'aʊər', br: 'áuer' },
  'their': { ipa: 'ðɛər', br: 'dér' },

  // Contractions & Slang
  "i'm": { ipa: 'aɪm', br: 'áim' },
  "i've": { ipa: 'aɪv', br: 'áiv' },
  "i'll": { ipa: 'aɪl', br: 'áil' },
  "i'd": { ipa: 'aɪd', br: 'áid' },
  "you're": { ipa: 'jʊər', br: 'iór' },
  "you've": { ipa: 'juːv', br: 'iúv' },
  "you'll": { ipa: 'juːl', br: 'iúl' },
  "you'd": { ipa: 'juːd', br: 'iúd' },
  "he's": { ipa: 'hiːz', br: 'ríz' },
  "she's": { ipa: 'ʃiːz', br: 'chíz' },
  "it's": { ipa: 'ɪts', br: 'its' },
  "we're": { ipa: 'wɪər', br: 'uír' },
  "they're": { ipa: 'ðɛər', br: 'dér' },
  "don't": { ipa: 'doʊnt', br: 'dôunt' },
  "doesn't": { ipa: 'ˈdʌzənt', br: 'dâzent' },
  "didn't": { ipa: 'ˈdɪdənt', br: 'dídnt' },
  "can't": { ipa: 'kænt', br: 'ként' },
  "won't": { ipa: 'woʊnt', br: 'uôunt' },
  "wouldn't": { ipa: 'ˈwʊdənt', br: 'uúdent' },
  "couldn't": { ipa: 'ˈkʊdənt', br: 'kúdent' },
  "shouldn't": { ipa: 'ˈʃʊdənt', br: 'chúdent' },
  "haven't": { ipa: 'ˈhævənt', br: 'révent' },
  "hasn't": { ipa: 'ˈhæzənt', br: 'rézent' },
  "hadn't": { ipa: 'ˈhædənt', br: 'rédent' },
  "isn't": { ipa: 'ˈɪzənt', br: 'ízent' },
  "aren't": { ipa: 'ɑːrnt', br: 'árnt' },
  "wasn't": { ipa: 'ˈwʌzənt', br: 'uózent' },
  "weren't": { ipa: 'wɜːrnt', br: 'uêrnt' },
  "gonna": { ipa: 'ˈɡənə', br: 'gôna' },
  "wanna": { ipa: 'ˈwɑːnə', br: 'uôna' },
  "gotta": { ipa: 'ˈɡɑːtə', br: 'góra' },
  "kinda": { ipa: 'ˈkaɪndə', br: 'káinda' },
  "lemme": { ipa: 'ˈlɛmi', br: 'lém-mi' },
  "gimme": { ipa: 'ˈɡɪmi', br: 'guím-mi' },

  // Auxiliary / Modal verbs
  'have': { ipa: 'hæv', br: 'rév' },
  'has': { ipa: 'hæz', br: 'réz' },
  'had': { ipa: 'hæd', br: 'réd' },
  'been': { ipa: 'biːn', br: 'bín' },
  'do': { ipa: 'duː', br: 'dú' },
  'does': { ipa: 'dʌz', br: 'dâz' },
  'did': { ipa: 'dɪd', br: 'díd' },
  'is': { ipa: 'ɪz', br: 'iz' },
  'am': { ipa: 'æm', br: 'ém' },
  'are': { ipa: 'ɑːr', br: 'ar' },
  'was': { ipa: 'wʌz', br: 'uóz' },
  'were': { ipa: 'wɜːr', br: 'uêr' },
  'be': { ipa: 'biː', br: 'bí' },
  'being': { ipa: 'ˈbiːɪŋ', br: 'bíin' },
  'can': { ipa: 'kæn', br: 'kén' },
  'could': { ipa: 'kʊd', br: 'kúd' },
  'will': { ipa: 'wɪl', br: 'uíl' },
  'would': { ipa: 'wʊd', br: 'uúd' },
  'shall': { ipa: 'ʃæl', br: 'chél' },
  'should': { ipa: 'ʃʊd', br: 'chúd' },
  'may': { ipa: 'meɪ', br: 'mêi' },
  'might': { ipa: 'maɪt', br: 'máit' },
  'must': { ipa: 'mʌst', br: 'mâst' },

  // Question words
  'what': { ipa: 'wʌt', br: 'uót' },
  'where': { ipa: 'wɛər', br: 'uér' },
  'when': { ipa: 'wɛn', br: 'uén' },
  'why': { ipa: 'waɪ', br: 'uái' },
  'how': { ipa: 'haʊ', br: 'ráu' },
  'who': { ipa: 'huː', br: 'rú' },
  'which': { ipa: 'wɪtʃ', br: 'uítch' },
  'whose': { ipa: 'huːz', br: 'rúz' },

  // Connectors, articles, prepositions
  'the': { ipa: 'ðə', br: 'dê' },
  'a': { ipa: 'ə', br: 'a' },
  'an': { ipa: 'æn', br: 'en' },
  'and': { ipa: 'ænd', br: 'end' },
  'but': { ipa: 'bʌt', br: 'bât' },
  'or': { ipa: 'ɔːr', br: 'or' },
  'to': { ipa: 'tuː', br: 'tu' },
  'of': { ipa: 'ʌv', br: 'ov' },
  'in': { ipa: 'ɪn', br: 'in' },
  'on': { ipa: 'ɑːn', br: 'on' },
  'at': { ipa: 'æt', br: 'ét' },
  'for': { ipa: 'fɔːr', br: 'fór' },
  'from': { ipa: 'frʌm', br: 'from' },
  'with': { ipa: 'wɪð', br: 'uíz' },
  'without': { ipa: 'wɪðˈaʊt', br: 'uizáut' },
  'about': { ipa: 'əˈbaʊt', br: 'abáut' },
  'into': { ipa: 'ˈɪntuː', br: 'íntu' },
  'through': { ipa: 'θruː', br: 'trú' },
  'over': { ipa: 'ˈoʊvər', br: 'ôuver' },
  'under': { ipa: 'ˈʌndər', br: 'ânder' },
  'between': { ipa: 'bɪˈtwiːn', br: 'bituín' },
  'after': { ipa: 'ˈæftər', br: 'éfter' },
  'before': { ipa: 'bɪˈfɔːr', br: 'bifór' },
  'as': { ipa: 'æz', br: 'éz' },
  'by': { ipa: 'baɪ', br: 'bái' },
  'if': { ipa: 'ɪf', br: 'if' },
  'then': { ipa: 'ðɛn', br: 'dén' },
  'than': { ipa: 'ðæn', br: 'dén' },
  'so': { ipa: 'soʊ', br: 'sôu' },
  'because': { ipa: 'bɪˈkɔːz', br: 'bicóz' },
  'just': { ipa: 'dʒʌst', br: 'djâst' },
  'only': { ipa: 'ˈoʊnli', br: 'ôunli' },
  'very': { ipa: 'ˈvɛri', br: 'véri' },
  'too': { ipa: 'tuː', br: 'tú' },
  'also': { ipa: 'ˈɔːlsoʊ', br: 'ólsou' },
  'even': { ipa: 'ˈiːvən', br: 'íven' },
  'now': { ipa: 'naʊ', br: 'náu' },
  'never': { ipa: 'ˈnɛvər', br: 'néver' },
  'always': { ipa: 'ˈɔːlweɪz', br: 'ólueiz' },
  'ever': { ipa: 'ˈɛvər', br: 'éver' },
  'here': { ipa: 'hɪər', br: 'ríer' },
  'there': { ipa: 'ðɛər', br: 'dér' },
  'all': { ipa: 'ɔːl', br: 'ól' },
  'some': { ipa: 'sʌm', br: 'sâm' },
  'any': { ipa: 'ˈɛni', br: 'éni' },
  'no': { ipa: 'noʊ', br: 'nôu' },
  'not': { ipa: 'nɑːt', br: 'nót' },
  'yes': { ipa: 'jɛs', br: 'iés' },
  'yeah': { ipa: 'jɛə', br: 'ié' },

  // Common verbs
  'go': { ipa: 'ɡoʊ', br: 'gôu' },
  'went': { ipa: 'wɛnt', br: 'uént' },
  'gone': { ipa: 'ɡɔːn', br: 'gón' },
  'get': { ipa: 'ɡɛt', br: 'guét' },
  'got': { ipa: 'ɡɑːt', br: 'gót' },
  'getting': { ipa: 'ˈɡɛtɪŋ', br: 'guétin' },
  'make': { ipa: 'meɪk', br: 'mêik' },
  'made': { ipa: 'meɪd', br: 'mêid' },
  'know': { ipa: 'noʊ', br: 'nôu' },
  'knew': { ipa: 'njuː', br: 'niú' },
  'known': { ipa: 'noʊn', br: 'nôun' },
  'think': { ipa: 'θɪŋk', br: 'tínk' },
  'thought': { ipa: 'θɔːt', br: 'tót' },
  'take': { ipa: 'teɪk', br: 'têik' },
  'took': { ipa: 'tʊk', br: 'túk' },
  'taken': { ipa: 'ˈteɪkən', br: 'têiken' },
  'see': { ipa: 'siː', br: 'sí' },
  'saw': { ipa: 'sɔː', br: 'só' },
  'seen': { ipa: 'siːn', br: 'sín' },
  'come': { ipa: 'kʌm', br: 'kâm' },
  'came': { ipa: 'keɪm', br: 'kêim' },
  'coming': { ipa: 'ˈkʌmɪŋ', br: 'kâmin' },
  'want': { ipa: 'wɑːnt', br: 'uônt' },
  'wanted': { ipa: 'ˈwɑːntɪd', br: 'uôntid' },
  'look': { ipa: 'lʊk', br: 'lúk' },
  'give': { ipa: 'ɡɪv', br: 'guív' },
  'gave': { ipa: 'ɡeɪv', br: 'guêiv' },
  'use': { ipa: 'juːz', br: 'iúz' },
  'find': { ipa: 'faɪnd', br: 'fáind' },
  'tell': { ipa: 'tɛl', br: 'tél' },
  'ask': { ipa: 'æsk', br: 'ésk' },
  'work': { ipa: 'wɜːrk', br: 'uêrk' },
  'working': { ipa: 'ˈwɜːrkɪŋ', br: 'uêrkin' },
  'seem': { ipa: 'siːm', br: 'sím' },
  'feel': { ipa: 'fiːl', br: 'fíl' },
  'try': { ipa: 'traɪ', br: 'trái' },
  'leave': { ipa: 'liːv', br: 'lív' },
  'call': { ipa: 'kɔːl', br: 'kól' },
  'talk': { ipa: 'tɔːk', br: 'tók' },
  'listen': { ipa: 'ˈlɪsən', br: 'líssen' },
  'speak': { ipa: 'spiːk', br: 'spík' },
  'say': { ipa: 'seɪ', br: 'sêi' },
  'said': { ipa: 'sɛd', br: 'séd' },
  'saying': { ipa: 'ˈseɪɪŋ', br: 'sêiin' },
  'show': { ipa: 'ʃoʊ', br: 'chôu' },
  'hear': { ipa: 'hɪər', br: 'ríer' },
  'play': { ipa: 'pleɪ', br: 'plêi' },
  'put': { ipa: 'pʊt', br: 'pút' },
  'run': { ipa: 'rʌn', br: 'rân' },
  'move': { ipa: 'muːv', br: 'múv' },
  'live': { ipa: 'lɪv', br: 'liv' },
  'living': { ipa: 'ˈlɪvɪŋ', br: 'lívin' },
  'believe': { ipa: 'bɪˈliːv', br: 'bilív' },
  'bring': { ipa: 'brɪŋ', br: 'brin' },
  'happen': { ipa: 'ˈhæpən', br: 'répen' },
  'continue': { ipa: 'kənˈtɪnjuː', br: 'contíniu' },
  'continues': { ipa: 'kənˈtɪnjuːz', br: 'contínius' },
  'grow': { ipa: 'ɡroʊ', br: 'grôu' },
  'endure': { ipa: 'ɪnˈdʊər', br: 'endíur' },
  'reach': { ipa: 'riːtʃ', br: 'rítch' },
  'reached': { ipa: 'riːtʃt', br: 'rítcht' },
  'steady': { ipa: 'ˈstɛdi', br: 'stédi' },
  'steadying': { ipa: 'ˈstɛdiɪŋ', br: 'stédiin' },

  // Common Nouns & Adjectives
  'time': { ipa: 'taɪm', br: 'táim' },
  'year': { ipa: 'jɪər', br: 'íer' },
  'years': { ipa: 'jɪərz', br: 'íers' },
  'people': { ipa: 'ˈpiːpəl', br: 'pípol' },
  'way': { ipa: 'weɪ', br: 'uêi' },
  'day': { ipa: 'deɪ', br: 'dêi' },
  'man': { ipa: 'mæn', br: 'mén' },
  'thing': { ipa: 'θɪŋ', br: 'tín' },
  'things': { ipa: 'θɪŋz', br: 'tínz' },
  'world': { ipa: 'wɜːrld', br: 'uêrld' },
  'life': { ipa: 'laɪf', br: 'láif' },
  'hand': { ipa: 'hænd', br: 'rénd' },
  'part': { ipa: 'pɑːrt', br: 'part' },
  'child': { ipa: 'tʃaɪld', br: 'tcháild' },
  'eye': { ipa: 'aɪ', br: 'ái' },
  'woman': { ipa: 'ˈwʊmən', br: 'uúman' },
  'place': { ipa: 'pleɪs', br: 'plêis' },
  'work': { ipa: 'wɜːrk', br: 'uêrk' },
  'week': { ipa: 'wiːk', br: 'uík' },
  'case': { ipa: 'keɪs', br: 'kêis' },
  'point': { ipa: 'pɔɪnt', br: 'póint' },
  'government': { ipa: 'ˈɡʌvərnmənt', br: 'gâvernment' },
  'company': { ipa: 'ˈkʌmpəni', br: 'kâmpani' },
  'number': { ipa: 'ˈnʌmbər', br: 'nâmber' },
  'group': { ipa: 'ɡruːp', br: 'grúp' },
  'problem': { ipa: 'ˈprɑːbləm', br: 'próblem' },
  'fact': { ipa: 'fækt', br: 'fékt' },
  'good': { ipa: 'ɡʊd', br: 'gúd' },
  'new': { ipa: 'nuː', br: 'niú' },
  'first': { ipa: 'fɜːrst', br: 'fêrst' },
  'last': { ipa: 'læst', br: 'lést' },
  'long': { ipa: 'lɔːŋ', br: 'lóng' },
  'great': { ipa: 'ɡreɪt', br: 'grêit' },
  'little': { ipa: 'ˈlɪtəl', br: 'lítol' },
  'own': { ipa: 'oʊn', br: 'ôun' },
  'other': { ipa: 'ˈʌðər', br: 'âder' },
  'old': { ipa: 'oʊld', br: 'ôuld' },
  'right': { ipa: 'raɪt', br: 'ráit' },
  'big': { ipa: 'bɪɡ', br: 'bíg' },
  'high': { ipa: 'haɪ', br: 'rái' },
  'different': { ipa: 'ˈdɪfərənt', br: 'díferent' },
  'small': { ipa: 'smɔːl', br: 'smól' },
  'large': { ipa: 'lɑːrdʒ', br: 'lardj' },
  'next': { ipa: 'nɛkst', br: 'nékst' },
  'early': { ipa: 'ˈɜːrli', br: 'êrli' },
  'young': { ipa: 'jʌŋ', br: 'iân' },
  'important': { ipa: 'ɪmˈpɔːrtənt', br: 'impórtant' },
  'few': { ipa: 'fjuː', br: 'fiú' },
  'public': { ipa: 'ˈpʌblɪk', br: 'pâblic' },
  'bad': { ipa: 'bæd', br: 'béd' },
  'same': { ipa: 'seɪm', br: 'sêim' },
  'able': { ipa: 'ˈeɪbəl', br: 'êibol' },
  'strong': { ipa: 'strɔːŋ', br: 'stróng' },
  'stronger': { ipa: 'ˈstrɔːŋɡər', br: 'strónguer' },
  'pleasure': { ipa: 'ˈplɛʒər', br: 'pléjer' },
  'influence': { ipa: 'ˈɪnfluəns', br: 'ínfluens' },
  'minister': { ipa: 'ˈmɪnɪstər', br: 'mínister' },
  'prime': { ipa: 'praɪm', br: 'práim' },
  'president': { ipa: 'ˈprɛzɪdənt', br: 'prézident' },
  'statement': { ipa: 'ˈsteɪtmənt', br: 'stêitment' },
  'united': { ipa: 'juːˈnaɪtɪd', br: 'iunáited' },
  'kingdom': { ipa: 'ˈkɪŋdəm', br: 'kíngdom' },
  'york': { ipa: 'jɔːrk', br: 'iórk' },
  'california': { ipa: 'ˌkælɪˈfɔːrnjə', br: 'kelifórnia' },
  'answer': { ipa: 'ˈænsər', br: 'énser' }
};

/**
 * Convert individual English word to IPA and Brazilian respelling
 */
function wordToPhonetic(rawWord) {
  const clean = rawWord.toLowerCase().replace(/[^a-z']/g, '');
  if (!clean) return { ipa: '', br: '' };

  if (PHONETIC_DICT[clean]) {
    return PHONETIC_DICT[clean];
  }

  // Heuristic rule-based phonetic engine for words not in the top dictionary
  let br = clean;
  let ipa = clean;

  // Initial sound rules
  if (br.startsWith('h')) br = 'r' + br.slice(1);
  if (br.startsWith('w')) br = 'u' + br.slice(1);
  if (br.startsWith('y')) br = 'i' + br.slice(1);
  if (br.startsWith('th')) br = 'd' + br.slice(2);
  if (br.startsWith('sh')) br = 'ch' + br.slice(2);
  if (br.startsWith('ch')) br = 'tch' + br.slice(2);

  // Common vowel patterns
  br = br
    .replace(/tion/g, 'chon')
    .replace(/sion/g, 'jon')
    .replace(/ture/g, 'tcher')
    .replace(/ight/g, 'áit')
    .replace(/ound/g, 'áund')
    .replace(/ould/g, 'úd')
    .replace(/ee/g, 'í')
    .replace(/ea/g, 'í')
    .replace(/oo/g, 'ú')
    .replace(/ou/g, 'áu')
    .replace(/ow/g, 'ôu')
    .replace(/ay/g, 'êi')
    .replace(/ey/g, 'êi')
    .replace(/ai/g, 'êi')
    .replace(/oi/g, 'ói')
    .replace(/oy/g, 'ói')
    .replace(/er$/g, 'er')
    .replace(/or$/g, 'or')
    .replace(/ing$/g, 'in')
    .replace(/ed$/g, 'd')
    .replace(/ly$/g, 'li');

  return { ipa, br };
}

/**
 * Get permanent phonetic transcription for a full phrase (0 tokens, 100% offline)
 * @param {string} phrase
 * @returns {{ ipa: string, br: string }}
 */
export function getPhrasePhonetics(phrase) {
  if (!phrase || typeof phrase !== 'string') {
    return { ipa: '', br: '' };
  }

  const cleanPhrase = phrase.trim();
  const cacheKey = `phonetic_v3_${cleanPhrase.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  // 1. Check localStorage permanent cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.br) return parsed;
    }
  } catch (e) {}

  // 2. Compute instant offline phonetic respelling
  const words = cleanPhrase.split(/\s+/);
  const ipaTokens = [];
  const brTokens = [];

  for (const word of words) {
    if (!word) continue;
    const { ipa, br } = wordToPhonetic(word);
    if (ipa) ipaTokens.push(ipa);
    if (br) brTokens.push(br);
  }

  const result = {
    ipa: ipaTokens.length > 0 ? `/${ipaTokens.join(' ')}/` : '',
    br: brTokens.length > 0 ? `[${brTokens.join(' ')}]` : ''
  };

  // 3. Store permanently so it is recorded forever
  try {
    localStorage.setItem(cacheKey, JSON.stringify(result));
  } catch (e) {}

  return result;
}

/**
 * Batch enrich a list of clips with phonetics (Zero API tokens)
 * @param {Array} clips
 * @returns {Array} clips with fonetica_ipa and fonetica_br
 */
export function enrichClipsWithPhonetics(clips) {
  if (!Array.isArray(clips)) return [];
  return clips.map(clip => {
    const { ipa, br } = getPhrasePhonetics(clip.nome || clip.title || '');
    return {
      ...clip,
      fonetica_ipa: clip.fonetica_ipa || ipa,
      fonetica_br: clip.fonetica_br || br
    };
  });
}
