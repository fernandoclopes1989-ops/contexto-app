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
  'today': { ipa: 'təˈdeɪ', br: 'tudêi' },
  'much': { ipa: 'mʌtʃ', br: 'mâtch' },
  'uh': { ipa: 'ə', br: 'â' },
  'um': { ipa: 'əm', br: 'âm' },

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
  'love': { ipa: 'lʌv', br: 'lâv' },
  'loved': { ipa: 'lʌvd', br: 'lâvd' },
  'loving': { ipa: 'ˈlʌvɪŋ', br: 'lâvin' },
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
      // 1. ELISION (Some o 'd' ou 't')
      if (curClean === 'and' && nextClean === 'i') {
        soundGuide.push({
          words: 'and I',
          sound: 'eNAI',
          detail: 'Elision: some o "d" e emenda direto'
        });
        continue;
      } else if (curClean === 'just' && (nextClean === 'as' || nextClean === 'a')) {
        soundGuide.push({
          words: `${curClean} ${nextClean}`,
          sound: nextClean === 'as' ? 'DJÂSaz' : 'DJÂSa',
          detail: 'Elision: some o "t" e emenda na vogal'
        });
        continue;
      }

      // 2. ASSIMILATION (Sons que se fundem com you/your)
      if (curClean === 'did' && nextClean === 'you') {
        soundGuide.push({
          words: 'did you',
          sound: 'DIdju',
          detail: 'Assimilation: o "d" se funde com "you" em som de "dj"'
        });
        continue;
      } else if (curClean === 'not' && nextClean === 'you') {
        soundGuide.push({
          words: 'not you',
          sound: 'NÁtchu',
          detail: 'Assimilation: o "t" se funde com "you" em som de "tch"'
        });
        continue;
      }

      // 3. INTRUSION (Som extra 'w' ou 'y' entre vogais)
      if (curClean === 'go' && nextClean === 'out') {
        soundGuide.push({
          words: 'go out',
          sound: 'gouWAUT',
          detail: 'Intrusion: inserção suave de "w" entre as vogais'
        });
        continue;
      }

      // 4. FLAP T (Inglês americano entre vogais)
      if (curClean === 'about' && nextClean === 'it') {
        soundGuide.push({
          words: 'about it',
          sound: 'aBAUrit',
          detail: 'Flap T: o "t" entre vogais soa como "r" brando'
        });
        continue;
      } else if (curClean === 'it' && nextClean === 'all') {
        soundGuide.push({
          words: 'it all',
          sound: 'iRÓL',
          detail: 'Flap T: o "t" entre vogais soa como "r" brando'
        });
        continue;
      }

      // 5. LINKING (Consoante + Vogal)
      if (curClean === 'lots' && nextClean === 'of') {
        soundGuide.push({
          words: 'lots of',
          sound: 'LÓTsov',
          detail: 'Linking: a consoante "s" gruda na vogal'
        });
        continue;
      } else if (curClean === 'videos' && nextClean === 'on') {
        soundGuide.push({
          words: 'videos on',
          sound: 'VÍdiouzon',
          detail: 'Linking: a consoante "s" com som de "z" gruda na vogal'
        });
        continue;
      } else if (curClean === 'love' && nextClean === 'it') {
        soundGuide.push({
          words: 'love it',
          sound: 'LÂvit',
          detail: 'Linking: o som de "v" gruda direto no "it"'
        });
        continue;
      } else if (curClean === 'did' && nextClean === 'on') {
        soundGuide.push({
          words: 'did on',
          sound: 'DIdon',
          detail: 'Linking: o som de "d" gruda na vogal "on"'
        });
        continue;
      } else if (curClean === 'much' && nextClean === 'as') {
        soundGuide.push({
          words: 'much as',
          sound: 'MÂTCHaz',
          detail: 'Linking: o som de "ch" gruda na vogal "as"'
        });
        continue;
      }

      // Generic Flap T (intervocalic)
      const hasVowelBeforeLast = curClean.endsWith('te')
        ? /[aeiou]/i.test(curClean.slice(-3, -2))
        : /[aeiou]/i.test(curClean.slice(-2, -1));

      const isBlockedCluster = curClean.endsWith('nd') || curClean.endsWith('nt') || curClean.endsWith('st');
      const isFlapEligible = (
        (curClean.endsWith('t') || curClean.endsWith('te')) &&
        hasVowelBeforeLast &&
        !isBlockedCluster &&
        startsWithVowelSound(nextClean)
      );

      if (isFlapEligible) {
        const { br: curBr } = wordToPhonetic(curClean);
        const { br: nextBr } = wordToPhonetic(nextClean);
        const root = (curBr || curClean).replace(/[td]$/i, '').replace(/t[eéê]$/i, '');
        soundGuide.push({
          words: `${curClean} ${nextClean}`,
          sound: `${root.toUpperCase()}r${nextBr.toLowerCase()}`,
          detail: 'Flap T: o som de "t" entre vogais soa como "r" brando'
        });
        continue;
      }

      // Generic Consonant + Vowel linking
      const endConsonant = getEndingConsonantSound(curClean);
      if (endConsonant && startsWithVowelSound(nextClean)) {
        const { br: curBr } = wordToPhonetic(curClean);
        const { br: nextBr } = wordToPhonetic(nextClean);
        const root = (curBr || curClean).toUpperCase();
        soundGuide.push({
          words: `${curClean} ${nextClean}`,
          sound: `${root}${nextBr.toLowerCase()}`,
          detail: 'Linking: a consoante final gruda diretamente na vogal seguinte'
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
    linkedHtml: phrase,
    soundGuide: uniqueGuide,
    hasConnections: uniqueGuide.length > 0
  };
}

/**
 * Helper to uppercase the stressed (tonic) syllable or word
 */
function formatTonicStress(brWord) {
  if (!brWord) return '';
  const clean = brWord.replace(/[^a-záéíóúâêôãõç]/gi, '');
  if (clean.startsWith('tu') && clean.length > 3) return 'tu' + clean.slice(2).toUpperCase();
  if (clean.startsWith('a') && clean.length > 4) return 'a' + clean.slice(1).toUpperCase();
  if (clean.startsWith('bi') && clean.length > 4) return 'bi' + clean.slice(2).toUpperCase();
  return clean.toUpperCase();
}

/**
 * Merge two words into a single fluid connected speech block (Zero hyphens, uppercase stress)
 */
function getMergedConnectedToken(curClean, nextClean, curBr, nextBr) {
  // 1. ELISION
  if (curClean === 'and' && nextClean === 'i') return 'eNAI';
  if (curClean === 'and' && nextClean === 'a') return 'eNA';
  if (curClean === 'and' && nextClean === 'all') return 'eNÓL';
  if (curClean === 'and' && (nextClean === 'then' || nextClean === 'the')) return 'enDEN';
  if (curClean === 'just' && nextClean === 'as') return 'DJÂSaz';
  if (curClean === 'just' && nextClean === 'a') return 'DJÂSa';

  // 2. LINKING (C-V)
  if (curClean === 'lots' && nextClean === 'of') return 'LÓTsov';
  if (curClean === 'videos' && nextClean === 'on') return 'VÍdiouzon';
  if (curClean === 'love' && nextClean === 'it') return 'LÂvit';
  if (curClean === 'did' && nextClean === 'on') return 'DIdon';
  if (curClean === 'much' && nextClean === 'as') return 'MÂTCHaz';
  if (curClean === 'have' && (nextClean === 'a' || nextClean === 'an')) return 'REva';
  if (curClean === 'tell' && nextClean === 'him') return 'TElim';

  // 3. ASSIMILATION
  if (curClean === 'did' && nextClean === 'you') return 'DIdju';
  if (curClean === 'not' && nextClean === 'you') return 'NÁtchu';
  if (curClean === 'want' && nextClean === 'you') return 'uonTCHU';
  if (curClean === 'would' && nextClean === 'you') return 'uúDJU';
  if (curClean === 'could' && nextClean === 'you') return 'kúDJU';
  if ((curClean.endsWith('t') || curClean.endsWith('d')) && nextClean === 'you') {
    const isT = curClean.endsWith('t');
    const root = (curBr || curClean).replace(/[td]$/i, '');
    return isT ? `${root.toUpperCase()}tchu` : `${root.toUpperCase()}dju`;
  }

  // 4. INTRUSION
  if (curClean === 'go' && nextClean === 'out') return 'gouWAUT';
  if (curClean === 'do' && nextClean === 'it') return 'duWIT';
  if (curClean === 'i' && nextClean === 'am') return 'aiYEM';

  // 5. FLAP T (intervocalic)
  if (curClean === 'about' && nextClean === 'it') return 'aBAUrit';
  if (curClean === 'it' && nextClean === 'all') return 'iRÓL';
  if (curClean === 'what' && nextClean === 'is') return 'uóRIZ';
  if (curClean === 'get' && nextClean === 'it') return 'guéRIT';

  const isVowelBeforeLast = /[aeiou]/i.test(curClean.slice(-2, -1));
  const isBlockedCluster = curClean.endsWith('nd') || curClean.endsWith('nt') || curClean.endsWith('st');
  if (curClean.endsWith('t') && isVowelBeforeLast && !isBlockedCluster && startsWithVowelSound(nextClean)) {
    const root = (curBr || curClean).replace(/t$/i, '');
    return `${root.toUpperCase()}r${nextBr.toLowerCase()}`;
  }

  const endConsonant = getEndingConsonantSound(curClean);
  if (endConsonant && startsWithVowelSound(nextClean)) {
    return `${formatTonicStress(curBr)}${nextBr.toLowerCase()}`;
  }

  return null;
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
  const cacheKey = `phonetic_v5_${cleanPhrase.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

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

  // 3. Build Connected Speech transcription flow (Golden Rule: Single fused block, UPPERCASE stress, NO hyphens)
  const connectedTokens = [];
  for (let i = 0; i < rawWords.length; i++) {
    const curRaw = rawWords[i];
    const curClean = curRaw.toLowerCase().replace(/[^a-z']/g, '');
    const nextRaw = i < rawWords.length - 1 ? rawWords[i + 1] : null;
    const nextClean = nextRaw ? nextRaw.toLowerCase().replace(/[^a-z']/g, '') : '';
    const punctuationMatch = curRaw.match(/[.,!?;:]+$/);
    const punct = punctuationMatch ? punctuationMatch[0] : '';
    const hasPunctuation = !!punct;

    const { br: curBr } = wordToPhonetic(curClean);
    if (!curBr) continue;

    let merged = null;
    if (!hasPunctuation && nextClean) {
      const { br: nextBr } = wordToPhonetic(nextClean);
      merged = getMergedConnectedToken(curClean, nextClean, curBr, nextBr);
    }

    if (merged) {
      const nextPunctMatch = nextRaw ? nextRaw.match(/[.,!?;:]+$/) : null;
      const nextPunct = nextPunctMatch ? nextPunctMatch[0] : '';
      connectedTokens.push(merged + nextPunct);
      i++; // skip next since it merged
      continue;
    }

    const isWeak = WEAK_FUNCTION_WORDS.has(curClean);
    const tokenDisplay = isWeak ? curBr.toLowerCase() : formatTonicStress(curBr);
    connectedTokens.push(tokenDisplay + punct);
  }

  const result = {
    ipa: ipaTokens.length > 0 ? `/${ipaTokens.join(' ')}/` : '',
    br: brTokens.length > 0 ? `[${brTokens.join(' ')}]` : '',
    connectedBr: connectedTokens.length > 0 ? connectedTokens.join(' ') : (brTokens.length > 0 ? brTokens.join(' ') : '')
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

GOLDEN RULE (Zero Cognitive Load):
STRICTLY FORBIDDEN to use hyphens (-) between connected words.
Join connected words into a single fluid word block and use UPPERCASE letters on the stressed syllable (tonic stress) to guide the rhythm of reading.

Practical Rules:
1. Linking (C-V): "lots of" -> "LÓTsov", "videos on" -> "VÍdiouzon", "love it" -> "LÂvit", "did on" -> "DIdon"
2. Elision: "and I" -> "eNAI", "just as" -> "DJÂSaz", "and then" -> "enDEN"
3. Assimilation: "did you" -> "DIdju", "not you" -> "NÁtchu"
4. Intrusion: "go out" -> "gouWAUT"
5. Flap T: "about it" -> "aBAUrit", "it all" -> "iRÓL"

Return STRICT JSON only, no markdown:
{
  "connected_speech": "full sentence with fused word blocks and UPPERCASE stress, NO hyphens",
  "soundGuide": [
    {
      "words": "about it",
      "sound": "aBAUrit",
      "detail": "Flap T: o som de 't' entre vogais soa como 'r' brando"
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


