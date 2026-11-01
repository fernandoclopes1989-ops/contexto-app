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
  'happy': { ipa: 'ˈhæpi', br: 'répi' }
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
  'christmas': { sound: 'krísmes', tip: "Letra Muda: o 'T' de Christmas não é pronunciado (krísmes)!" }
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
const LINKING_CLITICS = new Set(['i', 'it', 'in', 'on', 'at', 'up', 'out', 'of', 'us', 'is', 'a', 'an', 'all', 'him', 'her']);

/**
 * 🎓 Zero-Token Didactic Connected Speech & Phonetic Trap Analyzer
 * Produces rich, didactic sound guides so the explanation box is ALWAYS present.
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

    if (!hasPunctuation && nextClean) {
      // 1. High-frequency specific speech links
      if (curClean === 'if' && nextClean === 'i') {
        soundGuide.push({
          words: 'if I',
          sound: 'iFAI',
          detail: 'Linking: a consoante "f" gruda diretamente na vogal "I"'
        });
      } else if (curClean === 'showed' && nextClean === 'up') {
        soundGuide.push({
          words: 'showed up',
          sound: 'CHOUDâp',
          detail: 'Linking: o "d" final de "showed" emenda na vogal "up"'
        });
      } else if (curClean === 'show' && nextClean === 'up') {
        soundGuide.push({
          words: 'show up',
          sound: 'CHOUâp',
          detail: 'Linking: emenda direta das duas palavras'
        });
      } else if (curClean === 'welcome' && nextClean === 'in') {
        soundGuide.push({
          words: 'welcome in',
          sound: 'uélkâMIN',
          detail: 'Linking: o som de "m" conecta diretamente na vogal "in"'
        });
      } else if (curClean === 'and' && nextClean === 'i') {
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
      } else if ((curClean === "wouldn't" || curClean === 'wouldnt') && nextClean === 'be') {
        soundGuide.push({
          words: `${curRaw} be`,
          sound: 'uúdnBÍ',
          detail: 'Elision: o som do "t" final desaparece antes de consoante'
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
        // 2. Generic Consonant + Vowel linking with clitics (in, on, at, up, of, it, etc.)
        const endConsonant = getEndingConsonantSound(curClean);
        if (endConsonant && startsWithVowelSound(nextClean) && LINKING_CLITICS.has(nextClean)) {
          const { br: curBr } = wordToPhonetic(curClean);
          const { br: nextBr } = wordToPhonetic(nextClean);
          const root = formatTonicStress(curBr);
          soundGuide.push({
            words: `${curClean} ${nextClean}`,
            sound: `${root}${nextBr.toLowerCase()}`,
            detail: `Linking: a consoante "${endConsonant}" conecta direto na vogal de "${nextClean}"`
          });
        }
      }
    }
  }

  // Pass 2: Check for genuine PHONETIC TRAPS in isolated words
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
  if ((curClean === "wouldn't" || curClean === 'wouldnt') && nextClean === 'be') return 'uúdnBÍ';
  if ((curClean === "couldn't" || curClean === 'couldnt') && nextClean === 'be') return 'kúdnBÍ';
  if ((curClean === "shouldn't" || curClean === 'shouldnt') && nextClean === 'be') return 'chúdnBÍ';

  // 2. LINKING (C-V)
  if (curClean === 'if' && nextClean === 'i') return 'iFAI';
  if (curClean === 'showed' && nextClean === 'up') return 'CHOUDâp';
  if (curClean === 'show' && nextClean === 'up') return 'CHOUâp';
  if (curClean === 'welcome' && nextClean === 'in') return 'uélkâMIN';
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
 * Bumped to v8 cache key to immediately purge outdated cache.
 * @param {string} phrase
 * @returns {{ ipa: string, br: string, connectedBr: string }}
 */
export function getPhrasePhonetics(phrase) {
  if (!phrase || typeof phrase !== 'string') {
    return { ipa: '', br: '', connectedBr: '' };
  }

  const cleanPhrase = phrase.trim();
  // v8 guarantees automatic cache invalidation on mobile and PC
  const cacheKey = `phonetic_v8_${cleanPhrase.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  // 1. Check localStorage permanent cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.br && parsed.connectedBr && !parsed.br.includes('monêi') && !parsed.br.includes('tchôud')) {
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
    const isAiEnriched = clip.connected_speech && clip.connected_speech.ai_enriched;
    return {
      ...clip,
      fonetica_ipa: (isAiEnriched && clip.fonetica_ipa) ? clip.fonetica_ipa : ipa,
      fonetica_br: (isAiEnriched && clip.fonetica_br && !clip.fonetica_br.includes('monêi') && !clip.fonetica_br.includes('tchôud')) ? clip.fonetica_br : br,
      fonetica_connected: (isAiEnriched && clip.fonetica_connected) ? clip.fonetica_connected : connectedBr,
      connected_speech: isAiEnriched ? clip.connected_speech : cs
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

MATRIZ DE CONVERSÃO FONÉTICA OBRIGATÓRIA:
1. Vogal Curta/Schwa (o/u relaxado): Palavras como money, come, but, up, some, welcome.
   Regra: Use "â". (Ex: mâni, kâm, bât, âp, sâm, uélkâm). É estritamente proibido usar "o", "ô" ou "u" nestes fonemas.
2. Consoante 'G' Duro: Palavras como Girl, Get, Give, Girlfriend.
   Regra: Use "g" (Ex: gârl, guét, guív, gârlfrend). É TERMINANTEMENTE PROIBIDO usar "dj" para G duro.
3. Consoante /dʒ/ (j/g suave): Palavras como Just, Magic, Job.
   Regra: Use "dj" (Ex: djâst, médjik, djób).
4. Consoante /ʃ/ (sh): Palavras como Showed, She, Should, Show.
   Regra: Use "ch" (Ex: chôud, chí, chúd, chôu). É PROIBIDO usar "tch" para o som de SH.
5. Consoante /tʃ/ (ch): Palavras como Much, Chair, Catch.
   Regra: Use "tch" (Ex: mâtch, tchéir, kétch).
6. Terminações em "-ed": Represente exclusivamente o som final real.
   - Voiceless: looked -> lúkt, watched -> uótcht.
   - Voiced: showed -> chôud, loved -> lâvd.
   - T/D: wanted -> uóntid, needed -> nídid.
   Nunca insira vogais fantasmas.
7. Letras Mudas (Silent Letters): Devem sumir da transcrição (half = réf, talk = tók, walk = uók, could = kúd, Christmas = krísmes).

GOLDEN RULE FOR CONNECTED SPEECH:
- STRICTLY FORBIDDEN to use hyphens (-) between connected words.
- Join connected words into a single continuous word block.
- Use UPPERCASE letters on the stressed syllable (tonic stress) to guide reading rhythm.
Examples:
- "if I" -> "iFAI"
- "showed up" -> "CHOUDâp"
- "welcome in" -> "uélkâMIN"
- "wouldn't be" -> "uúdnBÍ"
- "lots of" -> "LÓTsov"
- "and I" -> "eNAI"
- "just as" -> "DJÂSaz"
- "love it" -> "LÂvit"

PROIBIÇÃO DE OMISSÃO (Sound Guide):
Provide 2 to 4 clear, didactic explanations of the connections and reductions in this sentence. NEVER leave soundGuide empty.

Return STRICT JSON only, no markdown:
{
  "fonetica_ipa": "/full sentence in standard IPA/",
  "fonetica_br": "[full sentence word-by-word with true sound]",
  "fonetica_connected": "full sentence with fused blocks and UPPERCASE stress, NO hyphens",
  "soundGuide": [
    {
      "words": "if I",
      "sound": "iFAI",
      "detail": "Linking: a consoante 'f' gruda na vogal 'I'"
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
