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

// Function words that are naturally unstressed in spoken English (weak forms)
const WEAK_FUNCTION_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'to', 'of', 'in', 'on', 'at', 'for', 'from',
  'with', 'as', 'by', 'that', 'this', 'is', 'am', 'are', 'was', 'were', 'be', 'been',
  'do', 'does', 'did', 'have', 'has', 'had', 'can', 'could', 'would', 'should',
  'it', 'its', 'us', 'them', 'him', 'her', 'your', 'my', 'his', 'our'
]);

// Vowel starting sounds (including silent-h or vowel phonemes)
function startsWithVowelSound(word) {
  if (!word) return false;
  const w = word.toLowerCase();
  return /^[aeiou]/i.test(w) || w === 'hour' || w === 'honest';
}

// Consonant ending sounds (accounting for silent-e where final consonant sound is pronounced)
function getEndingConsonantSound(word) {
  if (!word) return null;
  const w = word.toLowerCase().replace(/[^a-z']/g, '');
  if (!w) return null;

  // Common silent-e words where consonant is pronounced: make->k, take->k, have->v, love->v, come->m
  if (w.endsWith('e') && !w.endsWith('ee') && w.length > 2) {
    const root = w.slice(0, -1);
    if (/[bcdfghjklmnpqrstvwxyz]$/i.test(root)) {
      return root[root.length - 1];
    }
  }

  const lastChar = w[w.length - 1];
  if (/[bcdfghjklmnpqrstvwxyz]/i.test(lastChar)) {
    return lastChar;
  }
  return null;
}

/**
 * 🎓 Zero-Token Didactic Connected Speech Analyzer
 * Breaks down real conversational English into intuitive, linked speech blocks.
 * 
 * Identifies:
 * 1. Linking (Consonant to Vowel — Liaison)
 * 2. Flap T / Flap D (American Intervocalic T/D becoming tap /ɾ/ like 'cara')
 * 3. Assimilation / Palatalization (T/D + Y -> 'tch' or 'dj')
 * 4. Elision (dropped consonants in clusters or weak pronoun /h/)
 * 5. Reductions & Weak Forms (gonna, wanna, kinda, schwa /ə/)
 * 6. Stress rhythm (Content words vs Weak function words)
 */
export function analyzeConnectedSpeech(phrase) {
  if (!phrase || typeof phrase !== 'string') {
    return {
      linkedHtml: '',
      soundGuide: [],
      hasConnections: false
    };
  }

  const cleanPhrase = phrase.trim();
  const rawWords = cleanPhrase.split(/\s+/).filter(Boolean);
  if (rawWords.length === 0) {
    return { linkedHtml: '', soundGuide: [], hasConnections: false };
  }

  const soundGuide = [];

  for (let i = 0; i < rawWords.length; i++) {
    const cur = rawWords[i];
    const next = i < rawWords.length - 1 ? rawWords[i + 1] : null;

    // Check if current word ends in punctuation (punctuation prevents linking)
    const hasPunctuation = /[.,!?;:]$/.test(cur);
    const curClean = cur.toLowerCase().replace(/[^a-z']/g, '');
    const nextClean = next ? next.toLowerCase().replace(/[^a-z']/g, '') : '';

    if (!hasPunctuation && nextClean) {
      // --- RULE 1: Reductions & Slang (gonna, wanna, gotta, kinda, outta) ---
      if (curClean === 'going' && nextClean === 'to') {
        soundGuide.push({
          words: 'going to',
          sound: 'gôna',
          detail: 'Redução natural na fala rápida (gonna)'
        });
      } else if (curClean === 'want' && nextClean === 'to') {
        soundGuide.push({
          words: 'want to',
          sound: 'uôna',
          detail: 'Redução natural na fala rápida (wanna)'
        });
      } else if (curClean === 'got' && nextClean === 'to') {
        soundGuide.push({
          words: 'got to',
          sound: 'góra',
          detail: 'Redução com som de R brando (gotta)'
        });
      } else if (curClean === 'kind' && nextClean === 'of') {
        soundGuide.push({
          words: 'kind of',
          sound: 'káinda',
          detail: 'Redução natural na fala rápida (kinda)'
        });
      } else if (curClean === 'out' && nextClean === 'of') {
        soundGuide.push({
          words: 'out of',
          sound: 'áura',
          detail: 'Redução com Flap T (outta)'
        });
      }

      const endConsonant = getEndingConsonantSound(curClean);
      const nextStartsVowel = startsWithVowelSound(nextClean);
      const isYou = nextClean === 'you' || nextClean === 'your' || nextClean === "you're" || nextClean === "y'all";

      // --- RULE 2: Palatalization (T/D + Y -> 'tch' / 'dj') ---
      if ((curClean.endsWith('t') || curClean.endsWith('d')) && isYou) {
        const isT = curClean.endsWith('t');
        const sound = isT ? 'tch' : 'dj';
        soundGuide.push({
          words: `${curClean} ${nextClean}`,
          sound: isT ? `${curClean.replace(/t$/, '')}-tchu` : `${curClean.replace(/d$/, '')}-dju`,
          detail: `O som final se funde com "you" virando som de "${sound}"`
        });
        continue;
      }

      // Consonant clusters that prevent Flap T/D (nasals, liquids, fricatives)
      const isBlockedCluster = curClean.endsWith('nd') || curClean.endsWith('nt') ||
                               curClean.endsWith('st') || curClean.endsWith('ct') ||
                               curClean.endsWith('lt') || curClean.endsWith('pt') ||
                               curClean.endsWith('rt') || curClean.endsWith('ld') ||
                               curClean.endsWith('rd');

      // --- RULE 3: Flap T / Flap D (REAL intervocalic between vowels -> som de R brando de "caro") ---
      const hasVowelBeforeLast = curClean.endsWith('te')
        ? /[aeiou]/i.test(curClean.slice(-3, -2))
        : /[aeiou]/i.test(curClean.slice(-2, -1));

      const isFlapEligible = (
        (curClean.endsWith('t') || curClean.endsWith('te') || curClean.endsWith('d')) &&
        hasVowelBeforeLast &&
        !isBlockedCluster &&
        nextStartsVowel
      );

      if (isFlapEligible) {
        const { br: curBr } = wordToPhonetic(curClean);
        const { br: nextBr } = wordToPhonetic(nextClean);
        const root = (curBr || curClean).replace(/[td]$/i, '').replace(/t[eéê]$/i, '');
        soundGuide.push({
          words: `${curClean} ${nextClean}`,
          sound: `${root}-r${nextBr || nextClean}`,
          detail: `O "T/D" entre vogais vira som de "R" brando (como em "caro")`
        });
        continue;
      }

      // --- RULE 4: Pronoun H-Dropping (tell him -> té-lim) ---
      if (['him', 'her', 'his'].includes(nextClean) && endConsonant) {
        const { br: curBr } = wordToPhonetic(curClean);
        soundGuide.push({
          words: `${curClean} ${nextClean}`,
          sound: `${curBr || curClean}-${nextClean.slice(1)}`,
          detail: `O "H" de "${nextClean}" é omitido e a consoante anterior gruda direto`
        });
        continue;
      }

      // --- RULE 5: Standard Consonant + Vowel Linking (Liaison / Conexão Natural) ---
      if (endConsonant && nextStartsVowel) {
        const { br: curBr } = wordToPhonetic(curClean);
        const { br: nextBr } = wordToPhonetic(nextClean);
        soundGuide.push({
          words: `${curClean} ${nextClean}`,
          sound: `${curBr || curClean}-${nextBr || nextClean}`,
          detail: `A consoante final gruda diretamente na vogal seguinte`
        });
        continue;
      }
    }
  }

  // Deduplicate and prioritize top 3 key sound transformations to avoid visual clutter
  const uniqueGuide = [];
  const seenWords = new Set();
  for (const item of soundGuide) {
    if (!seenWords.has(item.words)) {
      seenWords.add(item.words);
      uniqueGuide.push(item);
    }
    if (uniqueGuide.length >= 3) break;
  }

  return {
    linkedHtml: escapeHtml(phrase),
    soundGuide: uniqueGuide,
    hasConnections: uniqueGuide.length > 0
  };
}

/**
 * Get permanent phonetic transcription for a full phrase (0 tokens, 100% offline)
 * Returns standard IPA, word-by-word Brazilian respelling, and Connected Speech flow.
 * @param {string} phrase
 * @returns {{ ipa: string, br: string, connectedBr: string }}
 */
export function getPhrasePhonetics(phrase) {
  if (!phrase || typeof phrase !== 'string') {
    return { ipa: '', br: '', connectedBr: '' };
  }

  const cleanPhrase = phrase.trim();
  const cacheKey = `phonetic_v4_${cleanPhrase.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  // 1. Check localStorage permanent cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.br && parsed.connectedBr) return parsed;
    }
  } catch (e) {}

  // 2. Compute instant offline phonetic respelling
  const rawWords = cleanPhrase.split(/\s+/).filter(Boolean);
  const ipaTokens = [];
  const brTokens = [];

  for (const rawWord of rawWords) {
    const cleanWord = rawWord.toLowerCase().replace(/[^a-z']/g, '');
    if (!cleanWord) continue;
    const { ipa, br } = wordToPhonetic(cleanWord);
    if (ipa) ipaTokens.push(ipa);
    if (br) brTokens.push(br);
  }

  // 3. Build Connected Speech transcription flow (connecting linked syllables with hyphen)
  const connectedTokens = [];
  for (let i = 0; i < rawWords.length; i++) {
    const curRaw = rawWords[i];
    const curClean = curRaw.toLowerCase().replace(/[^a-z']/g, '');
    const nextRaw = i < rawWords.length - 1 ? rawWords[i + 1] : null;
    const nextClean = nextRaw ? nextRaw.toLowerCase().replace(/[^a-z']/g, '') : '';
    const hasPunctuation = /[.,!?;:]$/.test(curRaw);

    const { br: curBr } = wordToPhonetic(curClean);
    if (!curBr) continue;

    if (!hasPunctuation && nextClean) {
      const { br: nextBr } = wordToPhonetic(nextClean);
      const isYou = nextClean === 'you' || nextClean === 'your' || nextClean === "you're";
      const nextStartsVowel = startsWithVowelSound(nextClean);
      const isBlockedCluster = curClean.endsWith('nd') || curClean.endsWith('nt') ||
                               curClean.endsWith('st') || curClean.endsWith('ct') ||
                               curClean.endsWith('lt') || curClean.endsWith('pt') ||
                               curClean.endsWith('rt') || curClean.endsWith('ld') ||
                               curClean.endsWith('rd');

      const hasVowelBeforeLast = curClean.endsWith('te')
        ? /[aeiou]/i.test(curClean.slice(-3, -2))
        : /[aeiou]/i.test(curClean.slice(-2, -1));

      // 1. Palatalization (T/D + you -> tch/dj)
      if ((curClean.endsWith('t') || curClean.endsWith('d')) && isYou) {
        const isT = curClean.endsWith('t');
        const prefix = curBr.replace(/[td]$/i, '');
        connectedTokens.push(isT ? `${prefix}-tchu` : `${prefix}-dju`);
        i++;
        continue;
      }

      // 2. Flap T (real intervocalic tap R: lot of -> ló-rov, get it -> gué-rit, what is -> uó-riz)
      const isFlapEligible = (
        (curClean.endsWith('t') || curClean.endsWith('te')) &&
        hasVowelBeforeLast &&
        !isBlockedCluster &&
        nextStartsVowel
      );

      if (isFlapEligible) {
        const rootBr = curBr.replace(/[td]$/i, '').replace(/t[eéê]$/i, '');
        connectedTokens.push(`${rootBr}-r${nextBr}`);
        i++;
        continue;
      }

      // 3. Regular Consonant + Vowel linking (e.g. have a -> ré-va, and I -> end-ái, lots of -> lót-sov)
      const endConsonant = getEndingConsonantSound(curClean);
      if (endConsonant && nextStartsVowel) {
        connectedTokens.push(`${curBr}-${nextBr}`);
        i++;
        continue;
      }
    }

    connectedTokens.push(curBr);
  }

  const result = {
    ipa: ipaTokens.length > 0 ? `/${ipaTokens.join(' ')}/` : '',
    br: brTokens.length > 0 ? `[${brTokens.join(' ')}]` : '',
    connectedBr: connectedTokens.length > 0 ? `[${connectedTokens.join(' ')}]` : (brTokens.length > 0 ? `[${brTokens.join(' ')}]` : '')
  };

  // 4. Store permanently in localStorage
  try {
    localStorage.setItem(cacheKey, JSON.stringify(result));
  } catch (e) {}

  return result;
}

/**
 * Batch enrich a list of clips with phonetics & connected speech (Zero API tokens)
 * @param {Array} clips
 * @returns {Array} clips with fonetica_ipa, fonetica_br, and connected_speech
 */
export function enrichClipsWithPhonetics(clips) {
  if (!Array.isArray(clips)) return [];
  return clips.map(clip => {
    const phrase = clip.nome || clip.title || '';
    const { ipa, br, connectedBr } = getPhrasePhonetics(phrase);
    const cs = analyzeConnectedSpeech(phrase);
    return {
      ...clip,
      fonetica_ipa: clip.fonetica_ipa || ipa,
      fonetica_br: clip.fonetica_br || br,
      fonetica_connected: clip.fonetica_connected || connectedBr,
      connected_speech: clip.connected_speech || cs
    };
  });
}

/**
 * Deep AI Connected Speech Synchronizer (Syncs directly to Supabase cloud)
 * Calls Gemini for deep linguistic breakdowns and saves to Supabase DB.
 * @param {object} clip - The clip object from DB
 * @param {function} updateClipFn - Database update function
 */
export async function syncDeepConnectedSpeechToDB(clip, updateClipFn) {
  if (!clip || !clip.nome) return null;
  const phrase = clip.nome.trim();

  // Instant offline analysis first
  const localAnalysis = analyzeConnectedSpeech(phrase);

  try {
    // Import Gemini caller dynamically
    const { callGemini } = await import('../ai.js');
    const prompt = `You are a world-class English pronunciation coach specialized in Connected Speech for Brazilian Portuguese speakers.
Analyze this spoken English sentence: "${phrase}"

Extract up to 3 most important word connections (linking, flap T, palatalization, reductions).
For each, explain what words connect, what sound they make in Brazilian phonetics, and why.

Return STRICT JSON only, no markdown:
{
  "soundGuide": [
    {
      "words": "about it all",
      "sound": "abáur-ir-ól",
      "detail": "O T vira som de R suave e emenda direto"
    }
  ]
}`;

    const rawResponse = await callGemini(prompt);
    let aiData = null;
    try {
      const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      aiData = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.warn('AI JSON parse fallback to local rules:', parseErr);
    }

    const guide = (aiData?.soundGuide && Array.isArray(aiData.soundGuide) && aiData.soundGuide.length > 0)
      ? aiData.soundGuide
      : localAnalysis.soundGuide;

    const merged = {
      ...localAnalysis,
      ai_enriched: true,
      soundGuide: guide,
      hasConnections: guide.length > 0
    };

    // Save directly to the clip object
    clip.connected_speech = merged;

    if (typeof updateClipFn === 'function') {
      await updateClipFn(clip);
    }

    return merged;
  } catch (err) {
    console.error('Deep Connected Speech error, using local analysis:', err);
    clip.connected_speech = localAnalysis;
    if (typeof updateClipFn === 'function') {
      try { await updateClipFn(clip); } catch (e) {}
    }
    return localAnalysis;
  }
}


