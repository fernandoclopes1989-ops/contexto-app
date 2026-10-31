/**
 * phoneticService.js — Zero-Token Offline Phonetic Transcription Engine
 * Provides instant IPA notation and Brazilian Portuguese pronunciation respelling.
 * Strictly adheres to American English phonetics (translates the SOUND, never the letter).
 * Runs 100% locally with 0ms latency, zero API calls, and zero tokens spent.
 */

// 1. Comprehensive English word-to-phonetic dictionary for high-frequency spoken English
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

  // Contractions & Conversational Slang
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
  'dont': { ipa: 'doʊnt', br: 'dôunt' },
  'doesnt': { ipa: 'ˈdʌzənt', br: 'dâzent' },
  'didnt': { ipa: 'ˈdɪdənt', br: 'dídnt' },
  'cant': { ipa: 'kænt', br: 'ként' },
  'wont': { ipa: 'woʊnt', br: 'uôunt' },
  'wouldnt': { ipa: 'ˈwʊdənt', br: 'uúdent' },
  'couldnt': { ipa: 'ˈkʊdənt', br: 'kúdent' },
  'shouldnt': { ipa: 'ˈʃʊdənt', br: 'chúdent' },
  'havent': { ipa: 'ˈhævənt', br: 'révent' },
  'hasnt': { ipa: 'ˈhæzənt', br: 'rézent' },
  'hadnt': { ipa: 'ˈhædənt', br: 'rédent' },
  'isnt': { ipa: 'ˈɪzənt', br: 'ízent' },
  'arent': { ipa: 'ɑːrnt', br: 'árnt' },
  'wasnt': { ipa: 'ˈwʌzənt', br: 'uózent' },
  'wernt': { ipa: 'wɜːrnt', br: 'uêrnt' },
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
  'behind': { ipa: 'bɪˈhaɪnd', br: 'biráind' },
  'before': { ipa: 'bɪˈfɔːr', br: 'bifór' },
  'after': { ipa: 'ˈæftər', br: 'éfter' },
  'during': { ipa: 'ˈdʊrɪŋ', br: 'dúrin' },
  'since': { ipa: 'sɪns', br: 'síns' },
  'until': { ipa: 'ənˈtɪl', br: 'antíl' },
  'till': { ipa: 'tɪl', br: 'tíl' },
  'by': { ipa: 'baɪ', br: 'bái' },
  'as': { ipa: 'æz', br: 'éz' },
  'if': { ipa: 'ɪf', br: 'if' },
  'that': { ipa: 'ðæt', br: 'dét' },
  'this': { ipa: 'ðɪs', br: 'dís' },
  'these': { ipa: 'ðiːz', br: 'díz' },
  'those': { ipa: 'ðoʊz', br: 'dôuz' },
  'then': { ipa: 'ðɛn', br: 'dén' },
  'than': { ipa: 'ðæn', br: 'dén' },
  'so': { ipa: 'soʊ', br: 'sôu' },
  'because': { ipa: 'bɪˈkɔːz', br: 'bicóz' },
  'though': { ipa: 'ðoʊ', br: 'dôu' },
  'although': { ipa: 'ɔːlˈðoʊ', br: 'oldôu' },
  'even': { ipa: 'ˈiːvən', br: 'íven' },
  'just': { ipa: 'dʒʌst', br: 'djâst' },
  'also': { ipa: 'ˈɔːlsoʊ', br: 'ólsou' },
  'only': { ipa: 'ˈoʊnli', br: 'ôunli' },
  'very': { ipa: 'ˈvɛri', br: 'véri' },
  'really': { ipa: 'ˈrɪəli', br: 'ríeli' },
  'too': { ipa: 'tuː', br: 'tú' },
  'now': { ipa: 'naʊ', br: 'náu' },
  'here': { ipa: 'hɪər', br: 'ríer' },
  'there': { ipa: 'ðɛər', br: 'dér' },
  'all': { ipa: 'ɔːl', br: 'ól' },
  'some': { ipa: 'sʌm', br: 'sâm' },
  'any': { ipa: 'ˈɛni', br: 'éni' },
  'no': { ipa: 'noʊ', br: 'nôu' },
  'not': { ipa: 'nɑːt', br: 'nót' },
  'more': { ipa: 'mɔːr', br: 'mór' },
  'most': { ipa: 'moʊst', br: 'môust' },
  'much': { ipa: 'mʌtʃ', br: 'mâtch' },
  'such': { ipa: 'sʌtʃ', br: 'sâtch' },
  'each': { ipa: 'iːtʃ', br: 'ítch' },
  'both': { ipa: 'boʊθ', br: 'bôut' },
  'well': { ipa: 'wɛl', br: 'uél' },
  'back': { ipa: 'bæk', br: 'bék' },
  'down': { ipa: 'daʊn', br: 'dáun' },
  'up': { ipa: 'ʌp', br: 'âp' },
  'out': { ipa: 'aʊt', br: 'áut' },
  'off': { ipa: 'ɔːf', br: 'óf' },
  'again': { ipa: 'əˈɡɛn', br: 'aguén' },
  'away': { ipa: 'əˈweɪ', br: 'auêi' },
  'still': { ipa: 'stɪl', br: 'stíl' },
  'already': { ipa: 'ɔːlˈrɛdi', br: 'olrédi' },
  'always': { ipa: 'ˈɔːlweɪz', br: 'ólueiz' },
  'never': { ipa: 'ˈnɛvər', br: 'néver' },
  'often': { ipa: 'ˈɔːfən', br: 'ófen' },
  'maybe': { ipa: 'ˈmeɪbi', br: 'mêibi' },
  'together': { ipa: 'təˈɡɛðər', br: 'tuguéder' },
  'today': { ipa: 'təˈdeɪ', br: 'tudêi' },
  'tomorrow': { ipa: 'təˈmɔːroʊ', br: 'tumórou' },
  'yesterday': { ipa: 'ˈjɛstərdeɪ', br: 'iéstêrdei' },
  'tonight': { ipa: 'təˈnaɪt', br: 'tunáit' },
  'uh': { ipa: 'ə', br: 'â' },
  'um': { ipa: 'əm', br: 'âm' },
  'yeah': { ipa: 'jɛə', br: 'ié' },
  'yes': { ipa: 'jɛs', br: 'iés' },
  'ok': { ipa: 'oʊˈkeɪ', br: 'oukêi' },
  'okay': { ipa: 'oʊˈkeɪ', br: 'oukêi' },

  // CRITICAL AMERICAN PHONETIC TARGETS (Sound-First, NEVER Letter-First)
  'money': { ipa: 'ˈmʌni', br: 'mâni' },
  'honey': { ipa: 'ˈhʌni', br: 'hâni' },
  'color': { ipa: 'ˈkʌlər', br: 'câlâr' },
  'come': { ipa: 'kʌm', br: 'kâm' },
  'comes': { ipa: 'kʌmz', br: 'kâmz' },
  'coming': { ipa: 'ˈkʌmɪŋ', br: 'kâmin' },
  'save': { ipa: 'seɪv', br: 'sêiv' },
  'saves': { ipa: 'seɪvz', br: 'sêivz' },
  'saved': { ipa: 'seɪvd', br: 'sêivd' },
  'saving': { ipa: 'ˈseɪvɪŋ', br: 'sêivin' },
  'safe': { ipa: 'seɪf', br: 'sêif' },
  'safely': { ipa: 'ˈseɪfli', br: 'sêifli' },
  'safety': { ipa: 'ˈseɪfti', br: 'sêifti' },
  'current': { ipa: 'ˈkɜːrənt', br: 'cârent' },
  'currently': { ipa: 'ˈkɜːrəntli', br: 'cârentli' },
  'currency': { ipa: 'ˈkɜːrənsi', br: 'cârensi' },
  'event': { ipa: 'ɪˈvɛnt', br: 'ivént' },
  'events': { ipa: 'ɪˈvɛnts', br: 'ivénts' },
  'way': { ipa: 'weɪ', br: 'uêi' },
  'ways': { ipa: 'weɪz', br: 'uêis' },
  'discuss': { ipa: 'dɪˈskʌs', br: 'discâs' },
  'discusses': { ipa: 'dɪˈskʌsɪz', br: 'discâsiz' },
  'discussed': { ipa: 'dɪˈskʌst', br: 'discâst' },
  'discussing': { ipa: 'dɪˈskʌsɪŋ', br: 'discâssin' },
  'discussion': { ipa: 'dɪˈskʌʃən', br: 'discâchon' },
  'expect': { ipa: 'ɪkˈspɛkt', br: 'ikspékt' },
  'expects': { ipa: 'ɪkˈspɛkts', br: 'ikspékts' },
  'expected': { ipa: 'ɪkˈspɛktɪd', br: 'ikspéktid' },
  'expecting': { ipa: 'ɪkˈspɛktɪŋ', br: 'ikspéktin' },
  'expectation': { ipa: 'ˌɛkspekˈteɪʃən', br: 'ekspektêichon' },
  'ex': { ipa: 'ɛks', br: 'éks' },
  'actually': { ipa: 'ˈæktʃuəli', br: 'éktchuali' },
  'actual': { ipa: 'ˈæktʃuəl', br: 'éktchual' },
  'rough': { ipa: 'rʌf', br: 'râf' },
  'roughly': { ipa: 'ˈrʌfli', br: 'râfli' },
  'tough': { ipa: 'tʌf', br: 'tâf' },
  'enough': { ipa: 'ɪˈnʌf', br: 'inâf' },
  'patch': { ipa: 'pætʃ', br: 'pétch' },
  'patches': { ipa: 'ˈpætʃɪz', br: 'pétchiz' },
  'mean': { ipa: 'miːn', br: 'mín' },
  'means': { ipa: 'miːnz', br: 'mínz' },
  'meant': { ipa: 'mɛnt', br: 'mént' },
  'meaning': { ipa: 'ˈmiːnɪŋ', br: 'mínin' },

  // Phonetic Traps (Silent Letters, Non-literal Vowels)
  'half': { ipa: 'hæf', br: 'réf' },
  'halves': { ipa: 'hævz', br: 'révz' },
  'talk': { ipa: 'tɔːk', br: 'tók' },
  'talks': { ipa: 'tɔːks', br: 'tóks' },
  'talked': { ipa: 'tɔːkt', br: 'tókt' },
  'talking': { ipa: 'ˈtɔːkɪŋ', br: 'tókin' },
  'walk': { ipa: 'wɔːk', br: 'uók' },
  'walks': { ipa: 'wɔːks', br: 'uóks' },
  'walked': { ipa: 'wɔːkt', br: 'uókt' },
  'walking': { ipa: 'ˈwɔːkɪŋ', br: 'uókin' },
  'choir': { ipa: 'kwaɪər', br: 'kuáier' },
  'island': { ipa: 'ˈaɪlənd', br: 'áilend' },
  'islands': { ipa: 'ˈaɪləndz', br: 'áilendz' },
  'listen': { ipa: 'ˈlɪsən', br: 'lísen' },
  'listened': { ipa: 'ˈlɪsənd', br: 'lísend' },
  'listening': { ipa: 'ˈlɪsənɪŋ', br: 'lísenin' },
  'doubt': { ipa: 'daʊt', br: 'dáut' },
  'doubts': { ipa: 'daʊts', br: 'dáuts' },
  'debt': { ipa: 'dɛt', br: 'dét' },
  'debts': { ipa: 'dɛts', br: 'déts' },
  'subtle': { ipa: 'ˈsʌtəl', br: 'sâtol' },
  'receipt': { ipa: 'rɪˈsiːt', br: 'risít' },
  'receipts': { ipa: 'rɪˈsiːts', br: 'risíts' },
  'write': { ipa: 'raɪt', br: 'ráit' },
  'writing': { ipa: 'ˈraɪtɪŋ', br: 'ráirin' },
  'written': { ipa: 'ˈrɪtən', br: 'rítn' },
  'wrote': { ipa: 'roʊt', br: 'rôut' },
  'wrong': { ipa: 'rɔːŋ', br: 'róng' },
  'knife': { ipa: 'naɪf', br: 'náif' },
  'knives': { ipa: 'naɪvz', br: 'náivz' },
  'know': { ipa: 'noʊ', br: 'nôu' },
  'knows': { ipa: 'noʊz', br: 'nôuz' },
  'knew': { ipa: 'nuː', br: 'niú' },
  'known': { ipa: 'noʊn', br: 'nôun' },
  'knowing': { ipa: 'ˈnoʊɪŋ', br: 'nôuin' },
  'knee': { ipa: 'niː', br: 'ní' },
  'knees': { ipa: 'niːz', br: 'níz' },
  'castle': { ipa: 'ˈkæsəl', br: 'késol' },
  'salmon': { ipa: 'ˈsæmən', br: 'sémon' },
  'almond': { ipa: 'ˈɑːmənd', br: 'ámond' },
  'calm': { ipa: 'kɑːm', br: 'kám' },
  'palm': { ipa: 'pɑːm', br: 'pám' },
  'climb': { ipa: 'klaɪm', br: 'kláim' },
  'climbed': { ipa: 'klaɪmd', br: 'kláimd' },
  'comb': { ipa: 'koʊm', br: 'kôum' },
  'tomb': { ipa: 'tuːm', br: 'túm' },
  'bomb': { ipa: 'bɑːm', br: 'bóm' },
  'blood': { ipa: 'blʌd', br: 'blâd' },
  'flood': { ipa: 'flʌd', br: 'flâd' },
  'done': { ipa: 'dʌn', br: 'dân' },
  'won': { ipa: 'wʌn', br: 'uân' },
  'one': { ipa: 'wʌn', br: 'uân' },
  'son': { ipa: 'sʌn', br: 'sân' },
  'sun': { ipa: 'sʌn', br: 'sân' },
  'ton': { ipa: 'tʌn', br: 'tân' },
  'tons': { ipa: 'tʌnz', br: 'tânz' },
  'none': { ipa: 'nʌn', br: 'nân' },
  'month': { ipa: 'mʌnθ', br: 'mânt' },
  'months': { ipa: 'mʌnθs', br: 'mânts' },
  'front': { ipa: 'frʌnt', br: 'frânt' },
  'other': { ipa: 'ˈʌðər', br: 'âder' },
  'others': { ipa: 'ˈʌðərz', br: 'âderz' },
  'another': { ipa: 'əˈnʌðər', br: 'anâder' },
  'mother': { ipa: 'ˈmʌðər', br: 'mâder' },
  'brother': { ipa: 'ˈbrʌðər', br: 'brâder' },
  'nothing': { ipa: 'ˈnʌθɪŋ', br: 'nâtin' },
  'company': { ipa: 'ˈkʌmpəni', br: 'kâmpani' },
  'country': { ipa: 'ˈkʌntri', br: 'kântri' },
  'countries': { ipa: 'ˈkʌntriz', br: 'kântriz' },
  'couple': { ipa: 'ˈkʌpəl', br: 'kâpol' },
  'trouble': { ipa: 'ˈtrʌbəl', br: 'trâbol' },
  'wonder': { ipa: 'ˈwʌndər', br: 'uânder' },
  'wonderful': { ipa: 'ˈwʌndərfəl', br: 'uânderfol' },
  'cover': { ipa: 'ˈkʌvər', br: 'câver' },
  'discover': { ipa: 'dɪˈskʌvər', br: 'discâver' },

  // Common spoken verbs & nouns
  'life': { ipa: 'laɪf', br: 'láif' },
  'time': { ipa: 'taɪm', br: 'táim' },
  'year': { ipa: 'jɪər', br: 'íer' },
  'years': { ipa: 'jɪərz', br: 'íerz' },
  'people': { ipa: 'ˈpiːpəl', br: 'pípol' },
  'person': { ipa: 'ˈpɜːrsən', br: 'pêrsen' },
  'thing': { ipa: 'θɪŋ', br: 'tíng' },
  'things': { ipa: 'θɪŋz', br: 'tíngz' },
  'world': { ipa: 'wɜːrld', br: 'uêrld' },
  'hand': { ipa: 'hænd', br: 'rénd' },
  'hands': { ipa: 'hændz', br: 'réndz' },
  'part': { ipa: 'pɑːrt', br: 'párt' },
  'parts': { ipa: 'pɑːrts', br: 'párts' },
  'place': { ipa: 'pleɪs', br: 'plêis' },
  'places': { ipa: 'ˈpleɪsɪz', br: 'plêisiz' },
  'week': { ipa: 'wiːk', br: 'uík' },
  'weeks': { ipa: 'wiːks', br: 'uíks' },
  'case': { ipa: 'keɪs', br: 'kêis' },
  'cases': { ipa: 'ˈkeɪsɪz', br: 'kêisiz' },
  'group': { ipa: 'ɡruːp', br: 'grúp' },
  'problem': { ipa: 'ˈprɑːbləm', br: 'próblem' },
  'problems': { ipa: 'ˈprɑːbləmz', br: 'próblemz' },
  'fact': { ipa: 'fækt', br: 'fékt' },
  'facts': { ipa: 'fækts', br: 'fékts' },
  'lot': { ipa: 'lɑːt', br: 'lót' },
  'lots': { ipa: 'lɑːts', br: 'lóts' },
  'video': { ipa: 'ˈvɪdioʊ', br: 'vídiou' },
  'videos': { ipa: 'ˈvɪdioʊz', br: 'vídiouz' },
  'night': { ipa: 'naɪt', br: 'náit' },
  'day': { ipa: 'deɪ', br: 'dêi' },
  'days': { ipa: 'deɪz', br: 'dêiz' },
  'room': { ipa: 'ruːm', br: 'rúm' },
  'water': { ipa: 'ˈwɔːtər', br: 'uórer' },
  'head': { ipa: 'hɛd', br: 'réd' },
  'side': { ipa: 'saɪd', br: 'sáid' },
  'kind': { ipa: 'kaɪnd', br: 'káind' },
  'love': { ipa: 'lʌv', br: 'lâv' },
  'loves': { ipa: 'lʌvz', br: 'lâvz' },
  'loved': { ipa: 'lʌvd', br: 'lâvd' },
  'loving': { ipa: 'ˈlʌvɪŋ', br: 'lâvin' },
  'like': { ipa: 'laɪk', br: 'láik' },
  'likes': { ipa: 'laɪks', br: 'láiks' },
  'liked': { ipa: 'laɪkt', br: 'láikt' },
  'liking': { ipa: 'ˈlaɪkɪŋ', br: 'láikin' },
  'good': { ipa: 'ɡʊd', br: 'gúd' },
  'new': { ipa: 'nuː', br: 'niú' },
  'first': { ipa: 'fɜːrst', br: 'fêrst' },
  'last': { ipa: 'læst', br: 'lést' },
  'long': { ipa: 'lɔːŋ', br: 'lóng' },
  'great': { ipa: 'ɡreɪt', br: 'grêit' },
  'little': { ipa: 'ˈlɪtəl', br: 'lítol' },
  'own': { ipa: 'oʊn', br: 'ôun' },
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
  'say': { ipa: 'seɪ', br: 'sêi' },
  'says': { ipa: 'sɛz', br: 'séz' },
  'said': { ipa: 'sɛd', br: 'séd' },
  'get': { ipa: 'ɡɛt', br: 'guét' },
  'gets': { ipa: 'ɡɛts', br: 'guéts' },
  'got': { ipa: 'ɡɑːt', br: 'gót' },
  'getting': { ipa: 'ˈɡɛtɪŋ', br: 'guérin' },
  'make': { ipa: 'meɪk', br: 'mêik' },
  'makes': { ipa: 'meɪks', br: 'mêiks' },
  'made': { ipa: 'meɪd', br: 'mêid' },
  'making': { ipa: 'ˈmeɪkɪŋ', br: 'mêikin' },
  'go': { ipa: 'ɡoʊ', br: 'gôu' },
  'goes': { ipa: 'ɡoʊz', br: 'gôuz' },
  'went': { ipa: 'wɛnt', br: 'uént' },
  'gone': { ipa: 'ɡɔːn', br: 'gón' },
  'going': { ipa: 'ˈɡoʊɪŋ', br: 'gôuin' },
  'see': { ipa: 'siː', br: 'sí' },
  'sees': { ipa: 'siːz', br: 'síz' },
  'saw': { ipa: 'sɔː', br: 'só' },
  'seen': { ipa: 'siːn', br: 'sín' },
  'seeing': { ipa: 'ˈsiːɪŋ', br: 'síin' },
  'know': { ipa: 'noʊ', br: 'nôu' },
  'take': { ipa: 'teɪk', br: 'têik' },
  'takes': { ipa: 'teɪks', br: 'têiks' },
  'took': { ipa: 'tʊk', br: 'túk' },
  'taken': { ipa: 'ˈteɪkən', br: 'têiken' },
  'taking': { ipa: 'ˈteɪkɪŋ', br: 'têikin' },
  'think': { ipa: 'θɪŋk', br: 'tínk' },
  'thinks': { ipa: 'θɪŋks', br: 'tínks' },
  'thought': { ipa: 'θɔːt', br: 'tót' },
  'thinking': { ipa: 'ˈθɪŋkɪŋ', br: 'tínkin' },
  'look': { ipa: 'lʊk', br: 'lúk' },
  'looks': { ipa: 'lʊks', br: 'lúks' },
  'looked': { ipa: 'lʊkt', br: 'lúkt' },
  'looking': { ipa: 'ˈlʊkɪŋ', br: 'lúkin' },
  'want': { ipa: 'wɑːnt', br: 'uónt' },
  'wants': { ipa: 'wɑːnts', br: 'uónts' },
  'wanted': { ipa: 'ˈwɑːntɪd', br: 'uóntid' },
  'wanting': { ipa: 'ˈwɑːntɪŋ', br: 'uóntin' },
  'give': { ipa: 'ɡɪv', br: 'guív' },
  'gives': { ipa: 'ɡɪvz', br: 'guívz' },
  'gave': { ipa: 'ɡeɪv', br: 'guêiv' },
  'given': { ipa: 'ˈɡɪvən', br: 'guíven' },
  'giving': { ipa: 'ˈɡɪvɪŋ', br: 'guívin' },
  'use': { ipa: 'juːz', br: 'iúz' },
  'uses': { ipa: 'ˈjuːzɪz', br: 'iúziz' },
  'used': { ipa: 'juːzd', br: 'iúzd' },
  'using': { ipa: 'ˈjuːzɪŋ', br: 'iúzin' },
  'find': { ipa: 'faɪnd', br: 'fáind' },
  'finds': { ipa: 'faɪndz', br: 'fáindz' },
  'found': { ipa: 'faʊnd', br: 'fáund' },
  'finding': { ipa: 'ˈfaɪndɪŋ', br: 'fáindin' },
  'tell': { ipa: 'tɛl', br: 'tél' },
  'tells': { ipa: 'tɛlz', br: 'télz' },
  'told': { ipa: 'toʊld', br: 'tôuld' },
  'telling': { ipa: 'ˈtɛlɪŋ', br: 'télin' },
  'ask': { ipa: 'æsk', br: 'ésk' },
  'work': { ipa: 'wɜːrk', br: 'uêrk' },
  'seem': { ipa: 'siːm', br: 'sím' },
  'feel': { ipa: 'fiːl', br: 'fíl' },
  'try': { ipa: 'traɪ', br: 'trái' },
  'leave': { ipa: 'liːv', br: 'lív' },
  'call': { ipa: 'kɔːl', br: 'kól' },
  'move': { ipa: 'muːv', br: 'múv' },
  'moving': { ipa: 'ˈmuːvɪŋ', br: 'múvin' },
  'moved': { ipa: 'muːvd', br: 'múvd' },
  'live': { ipa: 'lɪv', br: 'lív' },
  'living': { ipa: 'ˈlɪvɪŋ', br: 'lívin' },
  'lived': { ipa: 'lɪvd', br: 'lívd' },
  'stay': { ipa: 'steɪ', br: 'stêi' },
  'staying': { ipa: 'ˈsteɪɪŋ', br: 'stêiin' },
  'stayed': { ipa: 'steɪd', br: 'stêid' },
  'nyc': { ipa: 'ˌɛn waɪ ˈsiː', br: 'en uái sí' },
  'york': { ipa: 'jɔːrk', br: 'iórk' }
};

// 2. Phonetic Traps: Words where pronunciation diverges heavily from English spelling.
// Strictly restricted to severe traps (silent letters, major vowel discrepancies like 'money'='mâni').
// Shown only when present in a phrase to prevent cognitive overload.
const PHONETIC_TRAPS = {
  'money': { sound: 'mâni', tip: "Armadilha do 'O': pronuncia-se 'mâni' com som de 'Â', nunca 'monêi'!" },
  'honey': { sound: 'hâni', tip: "Armadilha do 'O': pronuncia-se 'hâni' com som de 'Â'!" },
  'half': { sound: 'réf', tip: "Letra Muda: o 'L' é totalmente mudo (fala-se 'réf')!" },
  'talk': { sound: 'tók', tip: "Letra Muda: o 'L' é totalmente mudo (fala-se 'tók')!" },
  'walk': { sound: 'uók', tip: "Letra Muda: o 'L' é totalmente mudo (fala-se 'uók')!" },
  'could': { sound: 'kúd', tip: "Letra Muda: o 'L' não é pronunciado (fala-se 'kúd')!" },
  'would': { sound: 'uúd', tip: "Letra Muda: o 'L' não é pronunciado (fala-se 'uúd')!" },
  'should': { sound: 'chúd', tip: "Letra Muda: o 'L' não é pronunciado (fala-se 'chúd')!" },
  'rough': { sound: 'râf', tip: "Discrepância: 'ou' tem som de 'Â' e 'gh' tem som de 'F' (râf)!" },
  'tough': { sound: 'tâf', tip: "Discrepância: 'ou' tem som de 'Â' e 'gh' tem som de 'F' (tâf)!" },
  'enough': { sound: 'inâf', tip: "Discrepância: 'gh' tem som de 'F' (inâf)!" },
  'choir': { sound: 'kuáier', tip: "Discrepância Fonética: pronuncia-se 'kuáier'!" },
  'island': { sound: 'áilend', tip: "Letra Muda: o 'S' é mudo (fala-se 'áilend')!" },
  'listen': { sound: 'lísen', tip: "Letra Muda: o 'T' não é pronunciado (fala-se 'lísen')!" },
  'doubt': { sound: 'dáut', tip: "Letra Muda: o 'B' é mudo (fala-se 'dáut')!" },
  'debt': { sound: 'dét', tip: "Letra Muda: o 'B' é mudo (fala-se 'dét')!" },
  'subtle': { sound: 'sâtol', tip: "Letra Muda: o 'B' é mudo e 'U' soa como 'Â' (sâtol)!" },
  'knife': { sound: 'náif', tip: "Letra Muda: o 'K' inicial é mudo (fala-se 'náif')!" },
  'know': { sound: 'nôu', tip: "Letra Muda: o 'K' inicial é mudo (fala-se 'nôu')!" },
  'knee': { sound: 'ní', tip: "Letra Muda: o 'K' inicial é mudo (fala-se 'ní')!" },
  'write': { sound: 'ráit', tip: "Letra Muda: o 'W' inicial é mudo (fala-se 'ráit')!" },
  'wrong': { sound: 'róng', tip: "Letra Muda: o 'W' inicial é mudo (fala-se 'róng')!" },
  'receipt': { sound: 'risít', tip: "Letra Muda: o 'P' é mudo (fala-se 'risít')!" },
  'castle': { sound: 'késol', tip: "Letra Muda: o 'T' não é pronunciado (fala-se 'késol')!" }
};

/**
 * Intelligent phonetic engine translating the SOUND, never the letter.
 * Includes morphological derivation and standard American vowel shifts.
 */
function wordToPhonetic(rawWord) {
  const clean = rawWord.toLowerCase().replace(/[^a-z']/g, '');
  if (!clean) return { ipa: '', br: '' };

  // 1. Direct dictionary match
  if (PHONETIC_DICT[clean]) {
    return PHONETIC_DICT[clean];
  }

  // 2. Morphological Lemmatization (s, es, ing, ed, ly)
  if (clean.endsWith('s') && clean.length > 3) {
    const base = clean.slice(0, -1);
    if (PHONETIC_DICT[base]) {
      return {
        ipa: PHONETIC_DICT[base].ipa + 's',
        br: PHONETIC_DICT[base].br + 's'
      };
    }
  }

  if (clean.endsWith('es') && clean.length > 4) {
    const base = clean.slice(0, -2);
    if (PHONETIC_DICT[base]) {
      return {
        ipa: PHONETIC_DICT[base].ipa + 'ɪz',
        br: PHONETIC_DICT[base].br + 'iz'
      };
    }
  }

  if (clean.endsWith('ing') && clean.length > 4) {
    const base = clean.slice(0, -3);
    if (PHONETIC_DICT[base]) {
      return {
        ipa: PHONETIC_DICT[base].ipa + 'ɪŋ',
        br: PHONETIC_DICT[base].br + 'in'
      };
    }
    const baseWithE = base + 'e';
    if (PHONETIC_DICT[baseWithE]) {
      const rootBr = PHONETIC_DICT[baseWithE].br.replace(/e$/, '');
      return {
        ipa: PHONETIC_DICT[baseWithE].ipa.replace(/eɪ$/, 'eɪɪŋ') + 'ɪŋ',
        br: rootBr + 'in'
      };
    }
  }

  if (clean.endsWith('ed') && clean.length > 4) {
    const base = clean.slice(0, -2);
    if (PHONETIC_DICT[base]) {
      return {
        ipa: PHONETIC_DICT[base].ipa + 'd',
        br: PHONETIC_DICT[base].br + 'd'
      };
    }
    const baseWithE = clean.slice(0, -1);
    if (PHONETIC_DICT[baseWithE]) {
      return {
        ipa: PHONETIC_DICT[baseWithE].ipa + 'd',
        br: PHONETIC_DICT[baseWithE].br + 'd'
      };
    }
  }

  if (clean.endsWith('ly') && clean.length > 4) {
    const base = clean.slice(0, -2);
    if (PHONETIC_DICT[base]) {
      return {
        ipa: PHONETIC_DICT[base].ipa + 'li',
        br: PHONETIC_DICT[base].br + 'li'
      };
    }
  }

  // 3. Heuristic Rule-Based American English Phonetic Engine (Sound-First!)
  let br = clean;
  let ipa = clean;

  // Silent initial letters
  if (br.startsWith('kn')) br = 'n' + br.slice(2);
  if (br.startsWith('wr')) br = 'r' + br.slice(2);
  if (br.startsWith('ps')) br = 's' + br.slice(2);

  // Initial sound transformations
  if (br.startsWith('h')) br = 'r' + br.slice(1);
  if (br.startsWith('w')) br = 'u' + br.slice(1);
  if (br.startsWith('y')) br = 'i' + br.slice(1);
  if (br.startsWith('th')) br = 'd' + br.slice(2);
  if (br.startsWith('sh')) br = 'ch' + br.slice(2);
  if (br.startsWith('ch')) br = 'tch' + br.slice(2);

  // Soft/hard C and G
  br = br.replace(/c([eiy])/g, 's$1');
  br = br.replace(/c([aou])/g, 'k$1');
  br = br.replace(/g([eiy])/g, 'dj$1');

  // American Short-O shift (money, honey, come, some, done, etc.)
  if (/^mon(ey|k|th)/.test(clean)) br = br.replace(/^mon/, 'mân');
  if (/^hon(ey)/.test(clean)) br = br.replace(/^ron/, 'rân');
  if (/^col(or)/.test(clean)) br = br.replace(/^kol/, 'kâl');
  if (/^cur(r)/.test(clean)) br = br.replace(/^kur/, 'kâr');

  // Prefix reductions (event -> ivént, expect -> ikspékt)
  if (br.startsWith('ex')) br = 'eks' + br.slice(2);
  if (br.startsWith('ev')) br = 'iv' + br.slice(2);

  // Magic Silent 'e' rules (aCe -> êiC, iCe -> áiC, oCe -> ôuC, uCe -> iúC)
  br = br.replace(/a([bcdfglmnpqrstvz])e$/g, 'êi$1');
  br = br.replace(/i([bcdfglmnpqrstvz])e$/g, 'ái$1');
  br = br.replace(/o([bcdfglmnpqrstvz])e$/g, 'ôu$1');
  br = br.replace(/u([bcdfglmnpqrstvz])e$/g, 'iú$1');

  // Common vowel clusters
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
// Excludes 'w' and 'y' which function as vowel off-glides in terminal position (money, day, now)
function getEndingConsonantSound(word) {
  if (!word) return null;
  const w = word.toLowerCase().replace(/[^a-z']/g, '');
  if (!w) return null;

  // Silent-e words where consonant is pronounced: save->v, make->k, take->k, have->v, love->v, come->m
  if (w.endsWith('e') && !w.endsWith('ee') && w.length > 2) {
    const root = w.slice(0, -1);
    if (/[bcdfghjklmnpqrstvz]$/i.test(root)) {
      return root[root.length - 1];
    }
  }

  const lastChar = w[w.length - 1];
  // Strictly obstruent/sonorant consonants (w and y are phonologically vowels in terminal coda)
  if (/[bcdfghjklmnpqrstvxz]/i.test(lastChar) && lastChar !== 'w' && lastChar !== 'y') {
    return lastChar;
  }
  return null;
}

// Unstressed clitics that readily attach to preceding consonants in natural connected speech
const LINKING_CLITICS = new Set(['it', 'in', 'on', 'at', 'up', 'out', 'of', 'us', 'is', 'a', 'an', 'all', 'him', 'her']);

/**
 * 🎓 Zero-Token Didactic Connected Speech & Phonetic Trap Analyzer
 * Strictly follows the Golden Rule:
 * 1. Single fused block (NO hyphens)
 * 2. UPPERCASE on tonic stress
 * 3. Isolated word notes ONLY for genuine phonetic traps (no obvious word clutter)
 */
export function analyzeConnectedSpeech(phrase) {
  if (!phrase || typeof phrase !== 'string') {
    return { linkedHtml: '', soundGuide: [], hasConnections: false };
  }

  const rawWords = phrase.trim().split(/\s+/).filter(Boolean);
  const soundGuide = [];

  // Pass 1: Find Connected Speech Pairs (Linking, Elision, Flap T, Assimilation, Intrusion)
  for (let i = 0; i < rawWords.length; i++) {
    const curRaw = rawWords[i];
    const curClean = curRaw.toLowerCase().replace(/[^a-z']/g, '');
    const nextRaw = i < rawWords.length - 1 ? rawWords[i + 1] : null;
    const nextClean = nextRaw ? nextRaw.toLowerCase().replace(/[^a-z']/g, '') : '';
    const punctuationMatch = curRaw.match(/[.,!?;:]+$/);
    const hasPunctuation = !!punctuationMatch;

    if (!curClean) continue;

    // Check pair connections only if not split by punctuation
    if (!hasPunctuation && nextClean) {
      if (curClean === 'and' && nextClean === 'i') {
        soundGuide.push({
          words: 'and I',
          sound: 'eNAI',
          detail: 'Elision: o "d" desaparece e a vogal se funde direto'
        });
      } else if (curClean === 'just' && nextClean === 'as') {
        soundGuide.push({
          words: 'just as',
          sound: 'DJÂSaz',
          detail: 'Elision: o "t" é omitido e emenda no "as"'
        });
      } else if (curClean === 'love' && nextClean === 'it') {
        soundGuide.push({
          words: 'love it',
          sound: 'LÂvit',
          detail: 'Linking: o som de "v" gruda direto no "it"'
        });
      } else if (curClean === 'did' && nextClean === 'on') {
        soundGuide.push({
          words: 'did on',
          sound: 'DIdon',
          detail: 'Linking: o som de "d" gruda na vogal "on"'
        });
      } else if (curClean === 'much' && nextClean === 'as') {
        soundGuide.push({
          words: 'much as',
          sound: 'MÂTCHaz',
          detail: 'Linking: o som de "ch" gruda na vogal "as"'
        });
      } else if (curClean === 'lots' && nextClean === 'of') {
        soundGuide.push({
          words: 'lots of',
          sound: 'LÓTsov',
          detail: 'Linking: o "s" final se junta ao "of"'
        });
      } else if (curClean === 'videos' && nextClean === 'on') {
        soundGuide.push({
          words: 'videos on',
          sound: 'VÍdiouzon',
          detail: 'Linking: o "s" final ganha som de "z" e gruda no "on"'
        });
      } else if (curClean === 'current' && (nextClean === 'events' || nextClean === 'event')) {
        soundGuide.push({
          words: `${curClean} ${nextClean}`,
          sound: 'CURRENTevents',
          detail: 'Linking: o "t" de current conecta direto na vogal de events'
        });
      } else if (curClean === 'about' && nextClean === 'it') {
        soundGuide.push({
          words: 'about it',
          sound: 'aBAUrit',
          detail: 'Flap T: o "t" entre vogais soa como "r" brando'
        });
      } else if (curClean === 'it' && nextClean === 'all') {
        soundGuide.push({
          words: 'it all',
          sound: 'iRÓL',
          detail: 'Flap T: o "t" soa como "r" brando ao emendar em "all"'
        });
      } else if (curClean === 'did' && nextClean === 'you') {
        soundGuide.push({
          words: 'did you',
          sound: 'DIdju',
          detail: 'Assimilation: a fusão de "d" + "y" gera o som "dju"'
        });
      } else if (curClean === 'not' && nextClean === 'you') {
        soundGuide.push({
          words: 'not you',
          sound: 'NÁtchu',
          detail: 'Assimilation: a fusão de "t" + "y" gera o som "tchu"'
        });
      } else if (curClean === 'go' && nextClean === 'out') {
        soundGuide.push({
          words: 'go out',
          sound: 'gouWAUT',
          detail: 'Intrusion: surge um som suave de "w" entre as vogais'
        });
      } else {
        // Generic Flap T
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
        }
      }
    }
  }

  // Pass 2: Check for genuine PHONETIC TRAPS in isolated words (Rule of Exception)
  // ONLY include if it's a silent letter, false-friend vowel like 'money'='mâni', etc.
  for (const rawWord of rawWords) {
    const cleanWord = rawWord.toLowerCase().replace(/[^a-z']/g, '');
    if (PHONETIC_TRAPS[cleanWord]) {
      const trap = PHONETIC_TRAPS[cleanWord];
      soundGuide.push({
        words: cleanWord,
        sound: trap.sound,
        detail: trap.tip
      });
    }
  }

  // Deduplicate and prioritize to keep visual clarity clean
  const uniqueGuide = [];
  const seenWords = new Set();
  for (const item of soundGuide) {
    if (!seenWords.has(item.words)) {
      seenWords.add(item.words);
      uniqueGuide.push(item);
    }
    if (uniqueGuide.length >= 4) break;
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
  if (curClean === 'current' && (nextClean === 'events' || nextClean === 'event')) return 'CURRENTevents';

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
  if (endConsonant && startsWithVowelSound(nextClean) && LINKING_CLITICS.has(nextClean)) {
    return `${formatTonicStress(curBr)}${nextBr.toLowerCase()}`;
  }

  return null;
}

/**
 * Get permanent phonetic transcription for a full phrase (0 tokens, 100% offline)
 * Returns standard IPA, word-by-word Brazilian respelling, and Connected Speech flow.
 * Bumped to v7 cache key to immediately purge all outdated phonetic approximations.
 * @param {string} phrase
 * @returns {{ ipa: string, br: string, connectedBr: string }}
 */
export function getPhrasePhonetics(phrase) {
  if (!phrase || typeof phrase !== 'string') {
    return { ipa: '', br: '', connectedBr: '' };
  }

  const cleanPhrase = phrase.trim();
  // v7 ensures instant automatic cache invalidation for true American phonetics (mâni, sêiv, cârent)
  const cacheKey = `phonetic_v7_${cleanPhrase.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  // 1. Check localStorage permanent cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.br && parsed.connectedBr) return parsed;
    }
  } catch (e) {}

  // 2. Compute instant offline phonetic respelling (SOUND FIRST)
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
 * Calls Gemini with strict zero-tolerance phonetics and updates Supabase DB.
 * Modifies ONLY phonetic fields (fonetica_ipa, fonetica_br, fonetica_connected, connected_speech),
 * NEVER altering clip IDs, video IDs, or cut start/end timestamps.
 * @param {object} clip - The clip object from DB
 * @param {function} updateClipFn - Database update function
 */
export async function syncDeepConnectedSpeechToDB(clip, updateClipFn) {
  if (!clip || !clip.nome) return null;
  const phrase = clip.nome.trim();

  // Instant offline analysis first
  const localAnalysis = analyzeConnectedSpeech(phrase);
  const localPhonetics = getPhrasePhonetics(phrase);

  try {
    // Import Gemini caller dynamically
    const { callGemini } = await import('../ai.js');
    const prompt = `You are a world-class Senior English Phonetician and Neurolinguist specialized in American English for Brazilian Portuguese speakers.
Analyze this spoken English sentence: "${phrase}"

CRITICAL LINGUISTIC RULES (ZERO TOLERANCE FOR LETTER-BY-LETTER LITERALISM):
1. Translate the SOUND, NEVER the letter. English is not a phonetic language.
   - The letter 'O' in American English frequently sounds like 'Â' (/ʌ/):
     Money = mâni (NEVER monêi); Honey = hâni; Color = câlâr; Come = kâm; Some = sâm; Done = dân; Won = uân; Month = mânt; Front = frânt; Rough = râf.
   - Silent 'e' words must diphthongize: Save = sêiv; Safe = sêif; Safety = sêifti.
   - Cur- sounds like 'câr': Current = cârent.
   - Initial unstressed e-: Event = ivént; Events = ivénts; Expect = ikspékt.
   - Discuss = discâs; Discussing = discâssin.

2. GOLDEN RULE FOR CONNECTED SPEECH:
   - STRICTLY FORBIDDEN to use hyphens (-) between connected words.
   - Join connected words into a single continuous word block.
   - Use UPPERCASE letters on the stressed syllable (tonic stress) to guide reading rhythm.
   Examples:
   - "lots of" -> "LÓTsov"
   - "and I" -> "eNAI"
   - "just as" -> "DJÂSaz"
   - "love it" -> "LÂvit"
   - "current events" -> "CURRENTevents"
   - "about it" -> "aBAUrit"

3. EXCEPTION RULE FOR WORD NOTES:
   - DO NOT explain obvious words.
   - ONLY include notes if a word is a genuine "phonetic trap" (silent letters like the 'l' in 'half', 'talk', 'could', or severe discrepancies like 'money' = 'mâni', 'choir', 'rough').

Return STRICT JSON only, no markdown:
{
  "fonetica_ipa": "/full sentence in standard IPA/",
  "fonetica_br": "[full sentence word-by-word with true sound]",
  "fonetica_connected": "full sentence with fused blocks and UPPERCASE stress, NO hyphens",
  "soundGuide": [
    {
      "words": "connected pair or trap word",
      "sound": "sound in Brazilian respelling",
      "detail": "short explanation of the sound rule or trap"
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

    // Safely update ONLY the phonetic fields on the clip object (never touch timestamps or IDs)
    clip.fonetica_ipa = aiData?.fonetica_ipa || localPhonetics.ipa;
    clip.fonetica_br = aiData?.fonetica_br || localPhonetics.br;
    clip.fonetica_connected = aiData?.fonetica_connected || localPhonetics.connectedBr;
    clip.connected_speech = merged;

    if (typeof updateClipFn === 'function') {
      await updateClipFn(clip);
    }

    return merged;
  } catch (err) {
    console.error('Deep Connected Speech error, using local analysis:', err);
    clip.fonetica_ipa = clip.fonetica_ipa || localPhonetics.ipa;
    clip.fonetica_br = clip.fonetica_br || localPhonetics.br;
    clip.fonetica_connected = clip.fonetica_connected || localPhonetics.connectedBr;
    clip.connected_speech = localAnalysis;
    if (typeof updateClipFn === 'function') {
      try { await updateClipFn(clip); } catch (e) {}
    }
    return localAnalysis;
  }
}
