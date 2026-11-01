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

  // Contractions & Conversational Slang (both with and without apostrophe)
  "i'm": { ipa: 'aɪm', br: 'áim' },
  'im': { ipa: 'aɪm', br: 'áim' },
  "i've": { ipa: 'aɪv', br: 'áiv' },
  'ive': { ipa: 'aɪv', br: 'áiv' },
  "i'll": { ipa: 'aɪl', br: 'áil' },
  'ill': { ipa: 'aɪl', br: 'áil' },
  "i'd": { ipa: 'aɪd', br: 'áid' },
  'id': { ipa: 'aɪd', br: 'áid' },
  "you're": { ipa: 'jʊər', br: 'iór' },
  'youre': { ipa: 'jʊər', br: 'iór' },
  "you've": { ipa: 'juːv', br: 'iúv' },
  'youve': { ipa: 'juːv', br: 'iúv' },
  "you'll": { ipa: 'juːl', br: 'iúl' },
  'youll': { ipa: 'juːl', br: 'iúl' },
  "you'd": { ipa: 'juːd', br: 'iúd' },
  'youd': { ipa: 'juːd', br: 'iúd' },
  "he's": { ipa: 'hiːz', br: 'ríz' },
  'hes': { ipa: 'hiːz', br: 'ríz' },
  "she's": { ipa: 'ʃiːz', br: 'chíz' },
  'shes': { ipa: 'ʃiːz', br: 'chíz' },
  "it's": { ipa: 'ɪts', br: 'its' },
  'its': { ipa: 'ɪts', br: 'its' },
  "we're": { ipa: 'wɪər', br: 'uír' },
  'were': { ipa: 'wɜːr', br: 'uêr' },
  "they're": { ipa: 'ðɛər', br: 'dér' },
  'theyre': { ipa: 'ðɛər', br: 'dér' },
  "don't": { ipa: 'doʊnt', br: 'dôunt' },
  'dont': { ipa: 'doʊnt', br: 'dôunt' },
  "doesn't": { ipa: 'ˈdʌzənt', br: 'dâzent' },
  'doesnt': { ipa: 'ˈdʌzənt', br: 'dâzent' },
  "didn't": { ipa: 'ˈdɪdənt', br: 'dídnt' },
  'didnt': { ipa: 'ˈdɪdənt', br: 'dídnt' },
  "can't": { ipa: 'kænt', br: 'ként' },
  'cant': { ipa: 'kænt', br: 'ként' },
  "won't": { ipa: 'woʊnt', br: 'uôunt' },
  'wont': { ipa: 'woʊnt', br: 'uôunt' },
  "wouldn't": { ipa: 'ˈwʊdənt', br: 'uúdent' },
  'wouldnt': { ipa: 'ˈwʊdənt', br: 'uúdent' },
  "couldn't": { ipa: 'ˈkʊdənt', br: 'kúdent' },
  'couldnt': { ipa: 'ˈkʊdənt', br: 'kúdent' },
  "shouldn't": { ipa: 'ˈʃʊdənt', br: 'chúdent' },
  'shouldnt': { ipa: 'ˈʃʊdənt', br: 'chúdent' },
  "haven't": { ipa: 'ˈhævənt', br: 'révent' },
  'havent': { ipa: 'ˈhævənt', br: 'révent' },
  "hasn't": { ipa: 'ˈhæzənt', br: 'rézent' },
  'hasnt': { ipa: 'ˈhæzənt', br: 'rézent' },
  "hadn't": { ipa: 'ˈhædənt', br: 'rédent' },
  'hadnt': { ipa: 'ˈhædənt', br: 'rédent' },
  "isn't": { ipa: 'ˈɪzənt', br: 'ízent' },
  'isnt': { ipa: 'ˈɪzənt', br: 'ízent' },
  "aren't": { ipa: 'ɑːrnt', br: 'árnt' },
  'arent': { ipa: 'ɑːrnt', br: 'árnt' },
  "wasn't": { ipa: 'ˈwʌzənt', br: 'uózent' },
  'wasnt': { ipa: 'ˈwʌzənt', br: 'uózent' },
  "weren't": { ipa: 'wɜːrnt', br: 'uêrnt' },
  'wernt': { ipa: 'wɜːrnt', br: 'uêrnt' },
  'gonna': { ipa: 'ˈɡənə', br: 'gôna' },
  'wanna': { ipa: 'ˈwɑːnə', br: 'uôna' },
  'gotta': { ipa: 'ˈɡɑːtə', br: 'góra' },
  'kinda': { ipa: 'ˈkaɪndə', br: 'káinda' },
  'lemme': { ipa: 'ˈlɛmi', br: 'lém-mi' },
  'gimme': { ipa: 'ˈɡɪmi', br: 'guím-mi' },

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
  'by': { ipa: 'baɪ', br: 'bái' },
  'as': { ipa: 'æz', br: 'éz' },
  'if': { ipa: 'ɪf', br: 'if' },
  'up': { ipa: 'ʌp', br: 'âp' },
  'out': { ipa: 'aʊt', br: 'áut' },
  'off': { ipa: 'ɔːf', br: 'óf' },
  'that': { ipa: 'ðæt', br: 'dét' },
  'this': { ipa: 'ðɪs', br: 'dís' },
  'then': { ipa: 'ðɛn', br: 'dén' },
  'than': { ipa: 'ðæn', br: 'dén' },
  'so': { ipa: 'soʊ', br: 'sôu' },
  'here': { ipa: 'hɪər', br: 'ríer' },
  'there': { ipa: 'ðɛər', br: 'dér' },
  'all': { ipa: 'ɔːl', br: 'ól' },
  'just': { ipa: 'dʒʌst', br: 'djâst' },
  'now': { ipa: 'naʊ', br: 'náu' },
  'today': { ipa: 'təˈdeɪ', br: 'tudêi' },
  'life': { ipa: 'laɪf', br: 'láif' },
  'much': { ipa: 'mʌtʃ', br: 'mâtch' },
  'uh': { ipa: 'ə', br: 'â' },
  'um': { ipa: 'əm', br: 'âm' },

  // Verbs, Nouns & Adjectives (Show, Girlfriend, Welcome, Friends, etc.)
  'show': { ipa: 'ʃoʊ', br: 'chôu' },
  'shows': { ipa: 'ʃoʊz', br: 'chôuz' },
  'showed': { ipa: 'ʃoʊd', br: 'chôud' },
  'showing': { ipa: 'ˈʃoʊɪŋ', br: 'chôuin' },
  'shown': { ipa: 'ʃoʊn', br: 'chôun' },
  'girl': { ipa: 'ɡɜːrl', br: 'gârl' },
  'girls': { ipa: 'ɡɜːrlz', br: 'gârlz' },
  'girlfriend': { ipa: 'ˈɡɜːrlfrɛnd', br: 'gârlfrend' },
  'girlfriends': { ipa: 'ˈɡɜːrlfrɛndz', br: 'gârlfrendz' },
  'boy': { ipa: 'bɔɪ', br: 'bói' },
  'boys': { ipa: 'bɔɪz', br: 'bóiz' },
  'boyfriend': { ipa: 'ˈbɔɪfrɛnd', br: 'bóifrend' },
  'boyfriends': { ipa: 'ˈbɔɪfrɛndz', br: 'bóifrendz' },
  'friend': { ipa: 'frɛnd', br: 'frénd' },
  'friends': { ipa: 'frɛndz', br: 'fréndz' },
  'welcome': { ipa: 'ˈwɛlkəm', br: 'uélkâm' },
  'welcomed': { ipa: 'ˈwɛlkəmd', br: 'uélkâmd' },
  'welcoming': { ipa: 'ˈwɛlkəmɪŋ', br: 'uélkâmin' },
  'new': { ipa: 'nuː', br: 'niú' },
  'good': { ipa: 'ɡʊd', br: 'gúd' },
  'bad': { ipa: 'bæd', br: 'béd' },
  'great': { ipa: 'ɡreɪt', br: 'grêit' },
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
  'event': { ipa: 'ɪˈvɛnt', br: 'ivént' },
  'events': { ipa: 'ɪˈvɛnts', br: 'ivénts' },
  'way': { ipa: 'weɪ', br: 'uêi' },
  'ways': { ipa: 'weɪz', br: 'uêis' },
  'discuss': { ipa: 'dɪˈskʌs', br: 'discâs' },
  'discussing': { ipa: 'dɪˈskʌsɪŋ', br: 'discâssin' },
  'expect': { ipa: 'ɪkˈspɛkt', br: 'ikspékt' },
  'expected': { ipa: 'ɪkˈspɛktɪd', br: 'ikspéktid' },
  'actually': { ipa: 'ˈæktʃuəli', br: 'éktchuali' },
  'ex': { ipa: 'ɛks', br: 'éks' },
  'rough': { ipa: 'rʌf', br: 'râf' },
  'tough': { ipa: 'tʌf', br: 'tâf' },
  'enough': { ipa: 'ɪˈnʌf', br: 'inâf' },
  'patch': { ipa: 'pætʃ', br: 'pétch' },
  'patches': { ipa: 'ˈpætʃɪz', br: 'pétchiz' },
  'mean': { ipa: 'miːn', br: 'mín' },
  'meant': { ipa: 'mɛnt', br: 'mént' },
  'love': { ipa: 'lʌv', br: 'lâv' },
  'like': { ipa: 'laɪk', br: 'láik' },
  'get': { ipa: 'ɡɛt', br: 'guét' },
  'gets': { ipa: 'ɡɛts', br: 'guéts' },
  'got': { ipa: 'ɡɑːt', br: 'gót' },
  'getting': { ipa: 'ˈɡɛtɪŋ', br: 'guérin' },
  'give': { ipa: 'ɡɪv', br: 'guív' },
  'gives': { ipa: 'ɡɪvz', br: 'guívz' },
  'giving': { ipa: 'ˈɡɪvɪŋ', br: 'guívin' },
  'make': { ipa: 'meɪk', br: 'mêik' },
  'made': { ipa: 'meɪd', br: 'mêid' },
  'go': { ipa: 'ɡoʊ', br: 'gôu' },
  'went': { ipa: 'wɛnt', br: 'uént' },
  'gone': { ipa: 'ɡɔːn', br: 'gón' },
  'going': { ipa: 'ˈɡoʊɪŋ', br: 'gôuin' },
  'see': { ipa: 'siː', br: 'sí' },
  'saw': { ipa: 'sɔː', br: 'só' },
  'seen': { ipa: 'siːn', br: 'sín' },
  'know': { ipa: 'noʊ', br: 'nôu' },
  'take': { ipa: 'teɪk', br: 'têik' },
  'think': { ipa: 'θɪŋk', br: 'tínk' },
  'look': { ipa: 'lʊk', br: 'lúk' },
  'want': { ipa: 'wɑːnt', br: 'uónt' },
  'use': { ipa: 'juːz', br: 'iúz' },
  'find': { ipa: 'faɪnd', br: 'fáind' },
  'tell': { ipa: 'tɛl', br: 'tél' },
  'ask': { ipa: 'æsk', br: 'ésk' },
  'work': { ipa: 'wɜːrk', br: 'uêrk' },
  'feel': { ipa: 'fiːl', br: 'fíl' },
  'try': { ipa: 'traɪ', br: 'trái' },
  'leave': { ipa: 'liːv', br: 'lív' },
  'call': { ipa: 'kɔːl', br: 'kól' },
  'move': { ipa: 'muːv', br: 'múv' },
  'live': { ipa: 'lɪv', br: 'lív' },
  'stay': { ipa: 'steɪ', br: 'stêi' },
  'time': { ipa: 'taɪm', br: 'táim' },
  'people': { ipa: 'ˈpiːpəl', br: 'pípol' },
  'thing': { ipa: 'θɪŋ', br: 'tíng' },
  'things': { ipa: 'θɪŋz', br: 'tíngz' },
  'world': { ipa: 'wɜːrld', br: 'uêrld' },
  'place': { ipa: 'pleɪs', br: 'plêis' },
  'lot': { ipa: 'lɑːt', br: 'lót' },
  'lots': { ipa: 'lɑːts', br: 'lóts' },
  'video': { ipa: 'ˈvɪdioʊ', br: 'vídiou' },
  'videos': { ipa: 'ˈvɪdioʊz', br: 'vídiouz' },
  'night': { ipa: 'naɪt', br: 'náit' },
  'day': { ipa: 'deɪ', br: 'dêi' },
  'water': { ipa: 'ˈwɔːtər', br: 'uórer' },
  'head': { ipa: 'hɛd', br: 'réd' },
  'first': { ipa: 'fɜːrst', br: 'fêrst' },
  'last': { ipa: 'læst', br: 'lést' },
  'own': { ipa: 'oʊn', br: 'ôun' },
  'old': { ipa: 'oʊld', br: 'ôuld' },
  'right': { ipa: 'raɪt', br: 'ráit' },
  'big': { ipa: 'bɪɡ', br: 'bíg' },
  'high': { ipa: 'haɪ', br: 'rái' },
  'different': { ipa: 'ˈdɪfərənt', br: 'díferent' },
  'small': { ipa: 'smɔːl', br: 'smól' },
  'next': { ipa: 'nɛkst', br: 'nékst' },
  'early': { ipa: 'ˈɜːrli', br: 'êrli' },
  'young': { ipa: 'jʌŋ', br: 'iân' },
  'same': { ipa: 'seɪm', br: 'sêim' },
  'able': { ipa: 'ˈeɪbəl', br: 'êibol' },
  'say': { ipa: 'seɪ', br: 'sêi' },
  'said': { ipa: 'sɛd', br: 'séd' },
  'put': { ipa: 'pʊt', br: 'pút' },
  'end': { ipa: 'ɛnd', br: 'énd' },
  'home': { ipa: 'hoʊm', br: 'rôum' },
  'house': { ipa: 'haʊs', br: 'ráus' },
  'side': { ipa: 'saɪd', br: 'sáid' },
  'point': { ipa: 'pɔɪnt', br: 'póint' },
  'city': { ipa: 'ˈsɪti', br: 'síti' },
  'country': { ipa: 'ˈkʌntri', br: 'kântri' },
  'mother': { ipa: 'ˈmʌðər', br: 'mâder' },
  'father': { ipa: 'ˈfɑːðər', br: 'fáder' },
  'brother': { ipa: 'ˈbrʌðər', br: 'brâder' },
  'sister': { ipa: 'ˈsɪstər', br: 'síster' },
  'family': { ipa: 'ˈfæməli', br: 'fémili' },
  'half': { ipa: 'hæf', br: 'réf' },
  'talk': { ipa: 'tɔːk', br: 'tók' },
  'walk': { ipa: 'wɔːk', br: 'uók' },
  'listen': { ipa: 'ˈlɪsən', br: 'lísen' },
  'doubt': { ipa: 'daʊt', br: 'dáut' },
  'debt': { ipa: 'dɛt', br: 'dét' },
  'knife': { ipa: 'naɪf', br: 'náif' },
  'write': { ipa: 'raɪt', br: 'ráit' },
  'wrong': { ipa: 'rɔːŋ', br: 'róng' },
  'choir': { ipa: 'kwaɪər', br: 'kuáier' },
  'island': { ipa: 'ˈaɪlənd', br: 'áilend' },
  'castle': { ipa: 'ˈkæsəl', br: 'késol' },
  'christmas': { ipa: 'ˈkrɪsməs', br: 'krísmes' },
  'episode': { ipa: 'ˈɛpɪsoʊd', br: 'épisôud' },
  'every': { ipa: 'ˈɛvri', br: 'évri' },
  'netflix': { ipa: 'ˈnɛtflɪks', br: 'nétfliks' },
  'holiday': { ipa: 'ˈhɑːlɪdeɪ', br: 'rólidêi' },
  'holidays': { ipa: 'ˈhɑːlɪdeɪz', br: 'rólidêiz' },
  'happy': { ipa: 'ˈhæpi', br: 'répi' },
  'made': { ipa: 'meɪd', br: 'mêid' },
  'eyes': { ipa: 'aɪz', br: 'áiz' },
  'eye': { ipa: 'aɪ', br: 'ái' },
  'coal': { ipa: 'koʊl', br: 'kôul' },
  'man': { ipa: 'mæn', br: 'mên' },
  'men': { ipa: 'mɛn', br: 'mén' },
  'ready': { ipa: 'ˈrɛdi', br: 'réri' },
  'better': { ipa: 'ˈbɛtər', br: 'bérer' },
  'butter': { ipa: 'ˈbʌtər', br: 'bârer' },
  'letter': { ipa: 'ˈlɛtər', br: 'lérer' },
  'bottle': { ipa: 'ˈbɑːtəl', br: 'bórol' },
  'little': { ipa: 'ˈlɪtəl', br: 'lírol' },
  'middle': { ipa: 'ˈmɪdəl', br: 'mírol' },
  'body': { ipa: 'ˈbɑːdi', br: 'bóri' },
  'model': { ipa: 'ˈmɑːdəl', br: 'mórel' },
  'lady': { ipa: 'ˈleɪdi', br: 'lêiri' },
  'party': { ipa: 'ˈpɑːrti', br: 'pári' },
  'twenty': { ipa: 'ˈtwɛnti', br: 'tuéni' },
  'thirty': { ipa: 'ˈθɜːrti', br: 'têrti' },
  'forty': { ipa: 'ˈfɔːrti', br: 'fóri' },
  'mountain': { ipa: 'ˈmaʊntən', br: "máun'n" },
  'button': { ipa: 'ˈbʌtən', br: "bâ'n" },
  'cotton': { ipa: 'ˈkɑːtən', br: "kó'n" },
  'curtain': { ipa: 'ˈkɜːrtən', br: "kêr'n" },
  'written': { ipa: 'ˈrɪtən', br: "rí'n" },
  'important': { ipa: 'ɪmˈpɔːrtənt', br: "impór'nt" },
  'exactly': { ipa: 'ɪɡˈzæktli', br: "igzák'li" }
};

// 2. Phonetic Traps: Words where pronunciation diverges heavily from English spelling.
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
  'knife': { sound: 'náif', tip: "Letra Muda: o 'K' inicial é mudo (fala-se 'náif')!" },
  'know': { sound: 'nôu', tip: "Letra Muda: o 'K' inicial é mudo (fala-se 'nôu')!" },
  'write': { sound: 'ráit', tip: "Letra Muda: o 'W' inicial é mudo (fala-se 'ráit')!" },
  'wrong': { sound: 'róng', tip: "Letra Muda: o 'W' inicial é mudo (fala-se 'róng')!" },
  'christmas': { sound: 'krísmes', tip: "Letra Muda: o 'T' de Christmas não é pronunciado (krísmes)!" },
  'girlfriend': { sound: 'gârlfrend', tip: "Consoante 'G' Duro: pronuncia-se 'gârlfrend' com 'g' duro como em 'gato', NUNCA 'djirlfriend'!" },
  'girl': { sound: 'gârl', tip: "Consoante 'G' Duro: pronuncia-se 'gârl' com 'g' duro como em 'gato', NUNCA 'dj'!" },
  'welcome': { sound: 'uélkâm', tip: "Vogal Reduzida (Schwa): o final é 'kâm' com som fechado ('uélkâm'), nunca 'kôum'!" },
  'showed': { sound: 'chôud', tip: "Som de 'SH': pronuncia-se 'chôud' com som suave de 'CH' ou 'X' brasileiro, NUNCA 'tchôud'!" },
  'she': { sound: 'chí', tip: "Som de 'SH': pronuncia-se 'chí' suave como 'chá', nunca 'tchi'!" },
  'eyes': { sound: 'áiz', tip: "Pronúncia Real: pronuncia-se 'áiz', nunca leia as letras como 'êies'!" },
  'made': { sound: 'mêid', tip: "No Connected Speech com vogal seguinte (ex: 'made a'), vira obrigatoriamente 'MÊIra' via Flap D! NUNCA diga 'mêida'!" },
  'mountain': { sound: "máun'n", tip: "Corte Glotal (Glottal Stop): o 't' antes de 'n' é preso na garganta (fala-se 'máun'n')!" },
  'button': { sound: "bâ'n", tip: "Corte Glotal (Glottal Stop): o 't' antes de 'n' é preso na garganta (fala-se 'bâ'n')!" }
};

/**
 * Intelligent phonetic engine translating the SOUND, never the letter.
 * Fixes:
 * - 'sh' never becomes 'tch'
 * - Hard G preserved (girl, give, get)
 * - True IPA fallback (never raw English)
 */
function wordToPhonetic(rawWord) {
  const clean = rawWord.toLowerCase().replace(/[^a-z']/g, '');
  if (!clean) return { ipa: '', br: '' };

  // 1. Direct dictionary match
  if (PHONETIC_DICT[clean]) {
    return PHONETIC_DICT[clean];
  }

  // 2. Morphological Lemmatization (s, es, ed, ing, ly)
  if (clean.endsWith('s') && clean.length > 3) {
    const base = clean.slice(0, -1);
    if (PHONETIC_DICT[base]) {
      return {
        ipa: PHONETIC_DICT[base].ipa + 'z',
        br: PHONETIC_DICT[base].br + 'z'
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

  if (clean.endsWith('ed') && clean.length > 4) {
    let base = clean.slice(0, -2);
    let baseDict = PHONETIC_DICT[base];
    if (!baseDict) {
      const baseWithE = clean.slice(0, -1);
      if (PHONETIC_DICT[baseWithE]) {
        base = baseWithE;
        baseDict = PHONETIC_DICT[baseWithE];
      }
    }
    if (baseDict) {
      let edIpa = 'd';
      let edBr = 'd';
      if (base.endsWith('t') || base.endsWith('d')) {
        edIpa = 'ɪd';
        edBr = 'id';
      } else if (/[pkfs]$/i.test(base) || base.endsWith('sh') || base.endsWith('ch')) {
        edIpa = 't';
        edBr = 't';
      }
      return {
        ipa: baseDict.ipa + edIpa,
        br: baseDict.br + edBr
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

  // 3. Robust Rule-Based Phonetic Engine
  let br = clean;
  let ipa = clean;

  // Initial consonant conversions (CRITICAL: sh and ch must be independent)
  if (br.startsWith('sh')) {
    br = 'ch' + br.slice(2);
  } else if (br.startsWith('ch')) {
    br = 'tch' + br.slice(2);
  } else if (br.startsWith('th')) {
    br = 'd' + br.slice(2);
  } else if (br.startsWith('wh') || br.startsWith('w')) {
    br = 'u' + (br.startsWith('wh') ? br.slice(2) : br.slice(1));
  } else if (br.startsWith('h')) {
    br = 'r' + br.slice(1);
  } else if (br.startsWith('y')) {
    br = 'i' + br.slice(1);
  } else if (br.startsWith('kn') || br.startsWith('wr')) {
    br = (br.startsWith('kn') ? 'n' : 'r') + br.slice(2);
  }

  // Hard G exceptions (Germanic high-frequency words before e/i/y)
  const isHardG = /^(girl|give|get|gift|gear|geese|begin|gold|game|good|great)/i.test(clean);
  if (!isHardG) {
    br = br.replace(/g([eiy])/g, 'dj$1');
  }

  // Soft C before e/i/y
  br = br.replace(/c([eiy])/g, 's$1');
  br = br.replace(/c([aou])/g, 'k$1');

  // American Short-O shift (money, honey, come, some, etc.)
  if (/^mon(ey|k|th)/.test(clean)) br = br.replace(/^mon/, 'mân');
  if (/^hon(ey)/.test(clean)) br = br.replace(/^ron/, 'rân');
  if (/^col(or)/.test(clean)) br = br.replace(/^kol/, 'kâl');
  if (/^cur(r)/.test(clean)) br = br.replace(/^kur/, 'kâr');
  if (/welcome/i.test(clean)) br = br.replace(/welcome/i, 'uélkâm');

  // Magic Silent 'e' rules
  br = br.replace(/a([bcdfglmnpqrstvz])e$/g, 'êi$1');
  br = br.replace(/i([bcdfglmnpqrstvz])e$/g, 'ái$1');
  br = br.replace(/o([bcdfglmnpqrstvz])e$/g, 'ôu$1');
  br = br.replace(/u([bcdfglmnpqrstvz])e$/g, 'iú$1');

  // Vowel clusters & suffixes
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

  // True IPA phonetic approximation fallback (never raw English)
  ipa = clean
    .replace(/sh/g, 'ʃ')
    .replace(/ch/g, 'tʃ')
    .replace(/th/g, 'ð')
    .replace(/ee|ea/g, 'iː')
    .replace(/oo/g, 'uː')
    .replace(/ow|ou/g, 'oʊ')
    .replace(/ay|ai/g, 'eɪ')
    .replace(/tion/g, 'ʃən')
    .replace(/ing$/g, 'ɪŋ')
    .replace(/ed$/g, 'd');

  return { ipa, br };
}

// Function words that are naturally unstressed in spoken English (weak forms)
const WEAK_FUNCTION_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'to', 'of', 'in', 'on', 'at', 'for', 'from',
  'with', 'as', 'by', 'that', 'this', 'is', 'am', 'are', 'was', 'were', 'be', 'been',
  'do', 'does', 'did', 'have', 'has', 'had', 'can', 'could', 'would', 'should',
  'it', 'its', 'us', 'them', 'him', 'her', 'your', 'my', 'his', 'our', 'if', 'up'
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

  // Silent-e words where consonant is pronounced: welcome->m, save->v, make->k, take->k, have->v, love->v, come->m
  if (w.endsWith('e') && !w.endsWith('ee') && w.length > 2) {
    const root = w.slice(0, -1);
    if (/[bcdfghjklmnpqrstvz]$/i.test(root)) {
      return root[root.length - 1];
    }
  }

  const lastChar = w[w.length - 1];
  // Obstruent/sonorant consonants (w and y function as vowel off-glides in terminal coda)
  if (/[bcdfghjklmnpqrstvxz]/i.test(lastChar) && lastChar !== 'w' && lastChar !== 'y') {
    return lastChar;
  }
  return null;
}

// Unstressed clitics and pronouns that readily link in natural speech
const LINKING_CLITICS = new Set(['i', 'it', 'in', 'on', 'at', 'up', 'out', 'of', 'us', 'is', 'a', 'an', 'all', 'him', 'her', 'and']);

/**
 * Strip non-verbal subtitle sound effects, musical notes, and noise cues
 * e.g. "(tambourine rattling) ♪ I made a man ♪" -> "I made a man"
 */
export function sanitizeSubtitleText(phrase) {
  if (!phrase || typeof phrase !== 'string') return '';
  return phrase
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[♪♫♬♩#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 🎓 Zero-Token Didactic Connected Speech & Phonetic Trap Analyzer
 * Produces rich, didactic sound guides so the explanation box is ALWAYS present.
 */
export function analyzeConnectedSpeech(phrase) {
  if (!phrase || typeof phrase !== 'string') {
    return { linkedHtml: '', soundGuide: [], hasConnections: false };
  }

  const clean = sanitizeSubtitleText(phrase) || phrase.trim();
  const rawWords = clean.split(/\s+/).filter(Boolean);
  const soundGuide = [];

  // Pass 1: Find Connected Speech Pairs across the 6 American English phenomena
  for (let i = 0; i < rawWords.length; i++) {
    const curRaw = rawWords[i];
    const curClean = curRaw.toLowerCase().replace(/[^a-z']/g, '');
    const nextRaw = i < rawWords.length - 1 ? rawWords[i + 1] : null;
    const nextClean = nextRaw ? nextRaw.toLowerCase().replace(/[^a-z']/g, '') : '';
    const punctuationMatch = curRaw.match(/[.,!?;:]+$/);
    const hasPunctuation = !!punctuationMatch;

    if (!curClean) continue;

    if (!hasPunctuation && nextClean) {
      const endConsonant = getEndingConsonantSound(curClean);
      const isBlockedCluster = curClean.endsWith('nd') || curClean.endsWith('nt') || curClean.endsWith('st') || curClean.endsWith('ld') || curClean.endsWith('lt');
      const { br: curBr } = wordToPhonetic(curClean);
      const { br: nextBr } = wordToPhonetic(nextClean);

      // --- 2. ELISION (Omissão de Sons & H-Dropping) ---
      if (curClean === 'and' && nextClean === 'i') {
        soundGuide.push({
          words: 'and I',
          sound: 'eNAI',
          detail: '2. Elision (Omissão): o som de "d" desaparece e emenda direto na vogal'
        });
      } else if (curClean === 'and' && nextClean === 'a') {
        soundGuide.push({
          words: 'and a',
          sound: 'eNA',
          detail: '2. Elision (Omissão): o som de "d" desaparece para acelerar a fala'
        });
      } else if (curClean === 'just' && nextClean === 'as') {
        soundGuide.push({
          words: 'just as',
          sound: 'DJÂSaz',
          detail: '2. Elision (Omissão): o "t" final é cancelado antes de "as"'
        });
      } else if ((curClean === "wouldn't" || curClean === 'wouldnt') && nextClean === 'be') {
        soundGuide.push({
          words: `${curRaw} be`,
          sound: 'uúdnBÍ',
          detail: '2. Elision (Omissão): o "t" final desaparece antes de consoante'
        });
      } else if (endConsonant && (nextClean === 'him' || nextClean === 'her' || nextClean === 'his')) {
        const hDrop = nextClean === 'him' ? `${formatTonicStress(curBr)}im` : (nextClean === 'her' ? `${formatTonicStress(curBr)}âr` : `${formatTonicStress(curBr)}iz`);
        soundGuide.push({
          words: `${curClean} ${nextClean}`,
          sound: hDrop,
          detail: `2. Elision (Omissão de H): o som de "h" em "${nextClean}" desaparece na fala rápida, soando "${hDrop}"`
        });
      }
      // --- 3. ASSIMILATION (Fusão T/D + Y) ---
      else if ((curClean.endsWith('t') || curClean.endsWith('d') || curClean.endsWith('te') || curClean.endsWith('de')) && nextClean === 'you') {
        const isT = curClean.endsWith('t') || curClean.endsWith('te');
        const root = curBr.replace(/[td]$/i, '');
        const assimSound = isT ? `${formatTonicStress(root)}tchu` : `${formatTonicStress(root)}dju`;
        soundGuide.push({
          words: `${curClean} you`,
          sound: assimSound,
          detail: `3. Assimilation (Fusão de Sons): colisão de "${isT ? 't' : 'd'}" com "y" gera o som africado "${isT ? 'tchu' : 'dju'}"`
        });
      }
      // --- 1. FLAP T / FLAP D (O som de 'R' suave entre vogais) ---
      else if ((endConsonant === 't' || endConsonant === 'd') && !isBlockedCluster && startsWithVowelSound(nextClean)) {
        const isD = endConsonant === 'd';
        const root = curBr.replace(/[td]$/i, '');
        const flapSound = `${formatTonicStress(root)}r${nextBr.toLowerCase()}`;
        soundGuide.push({
          words: `${curClean} ${nextClean}`,
          sound: flapSound,
          detail: `1. Flap ${isD ? 'D' : 'T'}: o som de "${isD ? 'd' : 't'}" entre vogais vira o "r" brando americano (como em "cara"), unindo em "${flapSound}"`
        });
      }
      // --- 4. INTRUSION (/w/ suave entre vogais) ---
      else if (curClean === 'go' && nextClean === 'out') {
        soundGuide.push({
          words: 'go out',
          sound: 'gouWAUT',
          detail: '4. Intrusion: surge um som suave de "w" entre as vogais para fluidez'
        });
      } else if (curClean === 'do' && nextClean === 'it') {
        soundGuide.push({
          words: 'do it',
          sound: 'duWIT',
          detail: '4. Intrusion: surge um som suave de "w" entre as vogais'
        });
      }
      // --- 6. CATENATION (Linking Consoante + Vogal) ---
      else if (endConsonant && startsWithVowelSound(nextClean) && LINKING_CLITICS.has(nextClean)) {
        const linkSound = `${formatTonicStress(curBr)}${nextBr.toLowerCase()}`;
        soundGuide.push({
          words: `${curClean} ${nextClean}`,
          sound: linkSound,
          detail: `6. Catenation (Linking C-V): a consoante final "${endConsonant}" desliza na vogal de "${nextClean}"`
        });
      }
    }
  }

  // Pass 2: Check for genuine PHONETIC TRAPS & Glottal Stops in isolated words (skip if already covered in a connected pair)
  const coveredWords = new Set();
  for (const item of soundGuide) {
    for (const w of (item.words || '').toLowerCase().split(/\s+/)) {
      coveredWords.add(w.replace(/[^a-z']/g, ''));
    }
  }

  for (const rawWord of rawWords) {
    const cleanWord = rawWord.toLowerCase().replace(/[^a-z']/g, '');
    if (PHONETIC_TRAPS[cleanWord] && !coveredWords.has(cleanWord)) {
      const trap = PHONETIC_TRAPS[cleanWord];
      soundGuide.push({
        words: cleanWord,
        sound: trap.sound,
        detail: trap.tip
      });
      coveredWords.add(cleanWord);
    }
  }

  // Deduplicate and prioritize up to 4 entries to keep the card clean and readable
  const uniqueGuide = [];
  const seenWords = new Set();
  for (const item of soundGuide) {
    if (!seenWords.has(item.words)) {
      seenWords.add(item.words);
      uniqueGuide.push(item);
    }
    if (uniqueGuide.length >= 4) break;
  }

  const teacherNotes = generateTeacherBlackboardNotes(clean, uniqueGuide);

  return {
    linkedHtml: clean,
    soundGuide: uniqueGuide,
    teacherNotes,
    hasConnections: uniqueGuide.length > 0
  };
}

/**
 * 👨‍🏫 Modo Lousa Digital do Professor
 * Generates clear, pedagogical mechanical notes on speech physical action.
 * Zero theoretical grammar — explains purely physical mouth/tongue actions and connections.
 */
export function generateTeacherBlackboardNotes(phrase, soundGuide) {
  if (!soundGuide || soundGuide.length === 0) {
    return {
      notes: [
        {
          type: 'rhythm',
          title: "🗣️ Ritmo e Articulação Contínua",
          text: "Nesta frase, não há colisões duras de consoantes. Solte o ar de forma relaxada e dê ênfase nas sílabas tônicas.",
          diagram: null
        }
      ],
      shadowingTip: "Mantenha o ar fluindo sem pausas mecânicas entre as palavras."
    };
  }

  const notes = [];
  let tipAction = '';

  for (const item of soundGuide) {
    const detailLower = (item.detail || '').toLowerCase();
    const parts = (item.words || '').trim().split(/\s+/);
    const leftWord = parts[0] || '';
    const rightWord = parts.slice(1).join(' ') || '';

    if (detailLower.includes('flap') || detailLower.includes('brando')) {
      const isD = detailLower.includes('flap d') || leftWord.endsWith('d') || leftWord.endsWith('de');
      notes.push({
        type: 'flap',
        title: `🔄 1. Flap ${isD ? 'D' : 'T'} (Som de 'R' Suave): [${item.words}] ➔ "${item.sound}"`,
        text: `No inglês americano, quando o '${isD ? 'd' : 't'}' fica entre duas vogais, a ponta da língua dá apenas um toque rápido no palato (alveolar tap), soando exatamente como o 'r' brando brasileiro (como em "cara" ou "meira"). É PROIBIDO manter som duro de '${isD ? 'd' : 't'}': ${item.words} = "${item.sound}".`,
        diagram: {
          left: leftWord,
          action: `🔄 vira flap "r" com`,
          right: rightWord,
          result: item.sound,
          type: 'flap'
        }
      });
      if (!tipAction) tipAction = `Ao falar "${item.words}", toque a ponta da língua no céu da boca de forma ultra-rápida ("${item.sound}"). Nunca diga som de "${isD ? 'd' : 't'}" duro!`;
    } else if (detailLower.includes('elision') || detailLower.includes('elisão') || detailLower.includes('desaparece') || detailLower.includes('omitido')) {
      const isH = detailLower.includes('h');
      notes.push({
        type: 'elision',
        title: `✂️ 2. Elision (Omissão de Sons): [${item.words}] ➔ "${item.sound}"`,
        text: isH
          ? `O som de 'h' em pronomes átonos (him, her, his) desaparece na velocidade nativa, conectando a consoante anterior diretamente na vogal seguinte: ${item.words} = "${item.sound}".`
          : `A consoante final de parada (/t/ ou /d/) é engolida pela língua para acelerar a fala e economizar energia muscular: ${item.words} = "${item.sound}".`,
        diagram: {
          left: leftWord,
          action: isH ? "✂️ some o 'h' de" : "✂️ some o som final de",
          right: rightWord,
          result: item.sound,
          type: 'elision'
        }
      });
      if (!tipAction) tipAction = `Não trave a língua nas consoantes que somem em "${item.words}". Deixe o som passar direto!`;
    } else if (detailLower.includes('assimilation') || detailLower.includes('fusão')) {
      notes.push({
        type: 'assimilation',
        title: `⚡ 3. Assimilation (Fusão de Sons): [${item.words}] ➔ "${item.sound}"`,
        text: `O encontro de consoante dental ('t' ou 'd') com a semivogal 'y' funde os dois sons em um fonema africado natural (T+Y vira "tch", D+Y vira "dj"): ${item.words} ➔ "${item.sound}".`,
        diagram: {
          left: leftWord,
          action: '⚡ funde sons com',
          right: rightWord,
          result: item.sound,
          type: 'assimilation'
        }
      });
      if (!tipAction) tipAction = `Na junção de "${item.words}", deixe os dentes se fecharem suavemente para soar "${item.sound}".`;
    } else if (detailLower.includes('glottal') || detailLower.includes('corte glotal')) {
      notes.push({
        type: 'glottal',
        title: `🛑 4. Glottal Stop (Corte Glotal / T Preso): "${item.words}" ➔ "${item.sound}"`,
        text: `O americano não solta a explosão do "t" antes de "n". O fluxo de ar é interrompido momentaneamente nas pregas vocais e liberado pelo nariz: ${item.words} ➔ "${item.sound}".`,
        diagram: {
          left: item.words,
          action: '🛑 corte glotal:',
          right: '',
          result: item.sound,
          type: 'glottal'
        }
      });
      if (!tipAction) tipAction = `Prenda o ar na garganta ao pronunciar "${item.words}" ("${item.sound}").`;
    } else if (detailLower.includes('schwa') || detailLower.includes('redução')) {
      notes.push({
        type: 'schwa',
        title: `💤 5. Schwa (Redução de Vogais): "${item.words}"`,
        text: `Vogais átonas em palavras funcionais relaxam completamente para o som preguiçoso "â", garantindo fluidez musical sem pausas artificiais.`,
        diagram: {
          left: item.words,
          action: '💤 som relaxado:',
          right: '',
          result: item.sound,
          type: 'schwa'
        }
      });
      if (!tipAction) tipAction = `Não tente pronunciar as vogais de "${item.words}" abertas. Relaxe a boca no som de "â".`;
    } else if (detailLower.includes('catenation') || detailLower.includes('linking') || detailLower.includes('gruda') || detailLower.includes('conecta') || detailLower.includes('junta')) {
      notes.push({
        type: 'linking',
        title: `🔗 6. Catenation (Linking C-V): [${item.words}] ➔ "${item.sound}"`,
        text: `A consoante final de uma palavra desliza diretamente para a vogal seguinte sem interrupção de ar. O cérebro do nativo processa as duas palavras como um único bloco musical: ${item.words.replace(/\s+/, ' + ')} = "${item.sound}".`,
        diagram: {
          left: leftWord,
          action: '🔗 gruda em',
          right: rightWord,
          result: item.sound,
          type: 'linking'
        }
      });
      if (!tipAction) tipAction = `Trate "${item.words}" como se fosse uma única palavra brasileira ("${item.sound}"). Não respire no meio!`;
    } else {
      notes.push({
        type: 'trap',
        title: `⚠️ Armadilha Sonora: "${item.words}"`,
        text: item.detail,
        diagram: {
          left: item.words,
          action: '⚠️ som real:',
          right: '',
          result: item.sound,
          type: 'trap'
        }
      });
      if (!tipAction) tipAction = `Cuidado com a armadilha visual de "${item.words}": o som real é "${item.sound}".`;
    }
  }

  const shadowingTip = tipAction || "Pronuncie a frase inteira com fluxo contínuo de ar, enfatizando apenas as sílabas em MAIÚSCULAS!";

  return {
    notes,
    shadowingTip
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
  // 1. ELISION (Queda de T/D em clusters e H-Dropping)
  if (curClean === 'and' && nextClean === 'i') return 'eNAI';
  if (curClean === 'and' && nextClean === 'a') return 'eNA';
  if (curClean === 'and' && nextClean === 'all') return 'eNÓL';
  if (curClean === 'and' && (nextClean === 'then' || nextClean === 'the')) return 'enDEN';
  if (curClean === 'just' && nextClean === 'as') return 'DJÂSaz';
  if (curClean === 'just' && nextClean === 'a') return 'DJÂSa';
  if ((curClean === "wouldn't" || curClean === 'wouldnt') && nextClean === 'be') return 'uúdnBÍ';
  if ((curClean === "couldn't" || curClean === 'couldnt') && nextClean === 'be') return 'kúdnBÍ';
  if ((curClean === "shouldn't" || curClean === 'shouldnt') && nextClean === 'be') return 'chúdnBÍ';

  // H-dropping
  if (getEndingConsonantSound(curClean) && (nextClean === 'him' || nextClean === 'her' || nextClean === 'his')) {
    if (nextClean === 'him') return `${formatTonicStress(curBr)}im`;
    if (nextClean === 'her') return `${formatTonicStress(curBr)}âr`;
    if (nextClean === 'his') return `${formatTonicStress(curBr)}iz`;
  }

  // 2. ASSIMILATION (T/D + Y)
  if (curClean === 'did' && nextClean === 'you') return 'DIdju';
  if (curClean === 'not' && nextClean === 'you') return 'NÁtchu';
  if (curClean === "don't" && nextClean === 'you') return 'DÔNTchu';
  if (curClean === 'want' && nextClean === 'you') return 'uonTCHU';
  if (curClean === 'meet' && nextClean === 'you') return 'MÍTchu';
  if (curClean === 'would' && nextClean === 'you') return 'uúDJU';
  if (curClean === 'could' && nextClean === 'you') return 'kúDJU';
  if (curClean === 'need' && nextClean === 'you') return 'NÍdju';
  if ((curClean.endsWith('t') || curClean.endsWith('d') || curClean.endsWith('te') || curClean.endsWith('de')) && nextClean === 'you') {
    const isT = curClean.endsWith('t') || curClean.endsWith('te');
    const root = (curBr || curClean).replace(/[td]$/i, '');
    return isT ? `${root.toUpperCase()}tchu` : `${root.toUpperCase()}dju`;
  }

  // 3. INTRUSION
  if (curClean === 'go' && nextClean === 'out') return 'gouWAUT';
  if (curClean === 'do' && nextClean === 'it') return 'duWIT';
  if (curClean === 'i' && nextClean === 'am') return 'aiYEM';

  // 4. FLAP T / FLAP D (T ou D entre sons de vogais vira o 'r' brando)
  const endConsonant = getEndingConsonantSound(curClean);
  const isBlockedCluster = curClean.endsWith('nd') || curClean.endsWith('nt') || curClean.endsWith('st') || curClean.endsWith('ld') || curClean.endsWith('lt');

  if ((endConsonant === 't' || endConsonant === 'd') && !isBlockedCluster && startsWithVowelSound(nextClean)) {
    const root = curBr.replace(/[td]$/i, '');
    return `${formatTonicStress(root)}r${nextBr.toLowerCase()}`;
  }

  // 5. CATENATION (Linking Consoante + Vogal)
  if (curClean === 'if' && nextClean === 'i') return 'iFAI';
  if (curClean === 'showed' && nextClean === 'up') return 'CHOUDâp';
  if (curClean === 'welcome' && nextClean === 'in') return 'uélkâMIN';
  if (curClean === 'lots' && nextClean === 'of') return 'LÓTsov';
  if (curClean === 'videos' && nextClean === 'on') return 'VÍdiouzon';
  if (curClean === 'love' && nextClean === 'it') return 'LÂvit';
  if (curClean === 'much' && nextClean === 'as') return 'MÂTCHaz';
  if (curClean === 'eyes' && nextClean === 'of') return 'ÁIzov';

  if (endConsonant && startsWithVowelSound(nextClean) && LINKING_CLITICS.has(nextClean)) {
    return `${formatTonicStress(curBr)}${nextBr.toLowerCase()}`;
  }

  return null;
}

/**
 * Get permanent phonetic transcription for a full phrase (0 tokens, 100% offline)
 * Returns standard IPA, word-by-word Brazilian respelling, and Connected Speech flow.
 * Bumped to v9 cache key to immediately purge outdated cache (Flap T/D + subtitle noise fixes).
 * @param {string} phrase
 * @returns {{ ipa: string, br: string, connectedBr: string }}
 */
export function getPhrasePhonetics(phrase) {
  if (!phrase || typeof phrase !== 'string') {
    return { ipa: '', br: '', connectedBr: '' };
  }

  const cleanPhrase = sanitizeSubtitleText(phrase) || phrase.trim();
  // v9 guarantees automatic cache invalidation on mobile and PC
  const cacheKey = `phonetic_v9_${cleanPhrase.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  // 1. Check localStorage permanent cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.br && parsed.connectedBr && !parsed.br.includes('monêi') && !parsed.br.includes('tchôud') && !parsed.connectedBr.includes('MÊIDa')) {
        return parsed;
      }
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

    // Detect legacy or corrupt transcriptions to immediately purge
    const isCorrupt = (clip.fonetica_br && (
      clip.fonetica_br.includes('tchôud') ||
      clip.fonetica_br.includes('djirlfriend') ||
      clip.fonetica_br.includes('uelkôum') ||
      clip.fonetica_br.includes('monêi') ||
      clip.fonetica_br.includes('mêida')
    )) || (clip.fonetica_connected && (
      clip.fonetica_connected.includes('TCHÔUD') ||
      clip.fonetica_connected.includes('DJIRLFRIEND') ||
      clip.fonetica_connected.includes('UELKÔUM') ||
      clip.fonetica_connected.includes('MONÊI') ||
      clip.fonetica_connected.includes('MÊIDa') ||
      clip.fonetica_connected.includes('MÊIDA')
    ));

    const isAiEnriched = clip.connected_speech && clip.connected_speech.ai_enriched && !isCorrupt;
    const hasGuide = isAiEnriched && Array.isArray(clip.connected_speech.soundGuide) && clip.connected_speech.soundGuide.length > 0;

    const mergedCs = hasGuide ? {
      ...clip.connected_speech,
      teacherNotes: clip.connected_speech.teacherNotes || cs.teacherNotes
    } : cs;

    return {
      ...clip,
      fonetica_ipa: (isAiEnriched && clip.fonetica_ipa) ? clip.fonetica_ipa : ipa,
      fonetica_br: (isAiEnriched && clip.fonetica_br) ? clip.fonetica_br : br,
      fonetica_connected: (isAiEnriched && clip.fonetica_connected) ? clip.fonetica_connected : connectedBr,
      connected_speech: mergedCs
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
    const prompt = `You are a world-class Senior English Phonetician and Neurolinguist specialized in American English for Brazilian Portuguese speakers.
Analyze this spoken English sentence: "${phrase}"

DIRETRIZ DE ENGENHARIA FONÉTICA (OS 6 GRANDES FENÔMENOS DO CONNECTED SPEECH):
1. Flap T / Flap D (O som de 'R' suave entre vogais):
   - REGRA ABSOLUTA: Sempre que as consoantes 'T' ou 'D' estiverem no meio de dois sons de vogais (dentro de uma palavra ou na junção entre palavras), o som resultante DEVE ser transcrito exclusivamente com a letra 'r' (o 'r' brando do português em 'cara' ou 'meira').
   - Exemplos em palavras: water -> uórer; better -> bérer; city -> síri; ready -> réri.
   - Exemplos em junções: made a -> MÊIra; had a -> RÉra; put it -> PÚrit; get it -> GUÉrit; but I -> BÂRai; what a -> UÓra.
   - PROIBIÇÃO ABSOLUTA: Nunca mantenha o som de 'd' ou 't' nestas condições! Gerar "mêida" para "made a" é uma falha crítica inaceitável. O único output aceitável é "MÊIra".

2. Elision (Omissão de Sons):
   - Omissão de H: Na fala rápida, o 'h' de pronomes (him, her, he, his) desaparece: tell him -> TÉlim; with her -> UÍZâr.
   - Queda de T/D final em clusters: and I -> eNAI; just as -> DJÂSaz; wouldn't be -> uúdnBÍ.

3. Assimilation (Fusão de Sons):
   - T + Y = som de CH/TCH: don't you -> DÔNTchu; meet you -> MÍTchu; not you -> NÁtchu.
   - D + Y = som de DJ: did you -> DIdju; would you -> uúDJU; need you -> NÍdju.

4. Glottal Stop (Corte Glotal / T Preso):
   - T antes de N: respiração para na garganta e sai pelo nariz: mountain -> máun'n; button -> bâ'n; exactly -> igzák'li.

5. Schwa (Redução de Vogais):
   - Palavras curtas (to, for, at, can, a, of) relaxam para 'â': to do -> tâ DU; for you -> fâr YÂ; a man -> a MÉN.

6. Catenation (Linking Consoante + Vogal):
   - Consoante final não-T/D desliza suavemente na vogal seguinte: eyes of -> ÁIzov; showed up -> CHOUDâp; welcome in -> uélkâMIN; lots of -> LÓTsov; love it -> LÂvit.

MATRIZ COMPLEMENTAR DE PRONÚNCIA:
- Vogal Curta/Schwa: money -> mâni (nunca monêi), come -> kâm, up -> âp, welcome -> uélkâm.
- Consoante 'G' Duro: girl -> gârl, girlfriend -> gârlfrend (nunca djirlfriend).
- Consoante /ʃ/ (sh): showed -> chôud, she -> chí (nunca tchôud).
- Passado em -ed: looked -> lúkt, showed -> chôud, wanted -> uóntid.
- Letras Mudas: half -> réf, talk -> tók, walk -> uók, could -> kúd, Christmas -> krísmes.

GOLDEN RULE FOR CONNECTED SPEECH:
- STRICTLY FORBIDDEN to use hyphens (-) between connected words.
- Join connected words into a single continuous word block.
- Use UPPERCASE letters on the stressed syllable (tonic stress) to guide reading rhythm.

Return STRICT JSON only, no markdown:
{
  "fonetica_ipa": "/full sentence in standard IPA/",
  "fonetica_br": "[full sentence word-by-word with true sound]",
  "fonetica_connected": "full sentence with fused blocks and UPPERCASE stress, NO hyphens",
  "soundGuide": [
    {
      "words": "made a",
      "sound": "MÊIra",
      "detail": "1. Flap D: o 'd' entre vogais vira o 'r' brando americano (como em 'cara'), unindo em 'MÊIra'"
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

    // Check if AI generated corrupt phonetic tokens
    const isAiCorrupt = (aiData?.fonetica_br && (
      aiData.fonetica_br.includes('tchôud') ||
      aiData.fonetica_br.includes('djirlfriend') ||
      aiData.fonetica_br.includes('uelkôum') ||
      aiData.fonetica_br.includes('monêi') ||
      aiData.fonetica_br.includes('mêida')
    )) || (aiData?.fonetica_connected && (
      aiData.fonetica_connected.includes('TCHÔUD') ||
      aiData.fonetica_connected.includes('DJIRLFRIEND') ||
      aiData.fonetica_connected.includes('UELKÔUM') ||
      aiData.fonetica_connected.includes('MONÊI') ||
      aiData.fonetica_connected.includes('MÊIDa') ||
      aiData.fonetica_connected.includes('MÊIDA')
    ));

    const guide = (!isAiCorrupt && aiData?.soundGuide && Array.isArray(aiData.soundGuide) && aiData.soundGuide.length > 0)
      ? aiData.soundGuide
      : localAnalysis.soundGuide;

    const teacherNotes = generateTeacherBlackboardNotes(phrase, guide);

    const merged = {
      ...localAnalysis,
      ai_enriched: true,
      soundGuide: guide,
      teacherNotes,
      hasConnections: guide.length > 0
    };

    // Safely update ONLY the phonetic fields on the clip object (never touch timestamps or IDs)
    clip.fonetica_ipa = (!isAiCorrupt && aiData?.fonetica_ipa) ? aiData.fonetica_ipa : localPhonetics.ipa;
    clip.fonetica_br = (!isAiCorrupt && aiData?.fonetica_br) ? aiData.fonetica_br : localPhonetics.br;
    clip.fonetica_connected = (!isAiCorrupt && aiData?.fonetica_connected) ? aiData.fonetica_connected : localPhonetics.connectedBr;
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
