import { Tag } from '../../../api_schema/types';

const PALETTE = [
  { bg: '#7c3aed', fg: '#ffffff' }, // purple
  { bg: '#0d9488', fg: '#ffffff' }, // teal
  { bg: '#ea580c', fg: '#ffffff' }, // orange
  { bg: '#e11d48', fg: '#ffffff' }, // rose
  { bg: '#0284c7', fg: '#ffffff' }, // sky
  { bg: '#65a30d', fg: '#ffffff' }, // lime
  { bg: '#d97706', fg: '#ffffff' }, // amber
  { bg: '#475569', fg: '#ffffff' }, // slate
];

function t(code: string, text: string, idx: number): Tag {
  const c = PALETTE[idx % PALETTE.length];
  return { code, text, colorText: c.fg, colorBackground: c.bg };
}

export const INTEREST_TAGS: Tag[] = [
  t('konst',               'Konst',                          0),
  t('teater',              'Teater',                         1),
  t('slojd_handarbete',    'Slöjd och handarbete',           2),
  t('pyssel',              'Pyssel',                         3),
  t('fotografi',           'Fotografi',                      4),
  t('skrivande',           'Skrivande',                      5),
  t('inredningsdesign',    'Inredningsdesign',                6),
  t('loppis',              'Loppis och second hand',         7),
  t('spela_instrument',    'Spela instrument',               0),
  t('sjunga',              'Sjunga',                         1),
  t('producera_musik',     'Producera musik',                2),
  t('konsert',             'Gå på konsert',                  3),
  t('lyssna_musik',        'Lyssna på musik',                4),
  t('bollsport',           'Bollsport',                      5),
  t('idrott',              'Idrott',                         6),
  t('motorsport',          'Motorsport',                     7),
  t('skidor',              'Skidor och vintersport',         0),
  t('lopning',             'Löpning',                        1),
  t('konditionstraning',   'Konditionsträning',              2),
  t('kampsport',           'Kampsport',                      3),
  t('hastsport',           'Hästsport',                      4),
  t('klattring',           'Klättring/Bouldering',           5),
  t('dykning',             'Dykning',                        6),
  t('gym',                 'Gym',                            7),
  t('yoga',                'Yoga',                           0),
  t('golf',                'Golf',                           1),
  t('dans',                'Dans',                           2),
  t('bocker',              'Böcker och litteratur',          3),
  t('film_tv',             'Film och tv-serier',             4),
  t('fest',                'Fest',                           5),
  t('tvspel',              'Tv-spel/datorspel',              6),
  t('bradspel',            'Brädspel',                       7),
  t('kortspel',            'Kortspel',                       0),
  t('odling',              'Odling och trädgårdsarbete',     1),
  t('botanik',             'Botanik',                        2),
  t('lantbruk',            'Lantbruk',                       3),
  t('friluftsliv',         'Friluftsliv',                    4),
  t('vandring',            'Vandring och hiking',            5),
  t('husdjur',             'Husdjur',                        6),
  t('zoologi',             'Zoologi',                        7),
  t('camping',             'Camping',                        0),
  t('fiske',               'Fiske',                          1),
  t('fagelskadning',       'Fågelskådning',                  2),
  t('programmering',       'Programmering och IT',           3),
  t('elektronik',          'Elektronik',                     4),
  t('teknikprylar',        'Teknikprylar',                   5),
  t('vetenskap',           'Vetenskap och forskning',        6),
  t('matematik',           'Matematik',                      7),
  t('astronomi',           'Astronomi',                      0),
  t('akademiska_studier',  'Akademiska studier',             1),
  t('livslangt_larande',   'Livslångt lärande',              2),
  t('historia',            'Historia',                       3),
  t('lasning',             'Läsning',                        4),
  t('fonder_aktier',       'Fonder och Aktier',              5),
  t('foretagande',         'Företagande och entreprenörskap', 6),
  t('politik',             'Politik',                        7),
  t('kultur',              'Kultur',                         0),
  t('sprak',               'Språk',                          1),
  t('resor',               'Resor',                          2),
  t('filosofi',            'Filosofi',                       3),
  t('psykologi',           'Psykologi',                      4),
  t('personlig_utveckling','Personlig utveckling',           5),
  t('religion',            'Religion',                       6),
  t('meditation',          'Meditation',                     7),
  t('sex_sexualitet',      'Sex och sexualitet',             0),
  t('relationer',          'Relationer och relationstyper',  1),
  t('foraldraskap',        'Föräldraskap och uppfostran',    2),
  t('restaurang',          'Restaurang och matupplevelser',  3),
  t('matlagning',          'Matlagning',                     4),
  t('bakning',             'Bakning',                        5),
  t('ol',                  'Öl',                             6),
  t('whisky',              'Whisky',                         7),
  t('vin',                 'Vin',                            0),
  t('klader',              'Kläder och personlig stil',      1),
  t('har_makeup',          'Hår och makeup',                 2),
  t('aterbruk',            'Återbruk',                       3),
  t('prepping',            'Prepping',                       4),
  t('sjalvhushall',        'Självhushåll',                   5),
  t('bygg_renovering',     'Bygg och renovering',            6),
];

// Map from interest label (UserInterest enum value) to Tag
const BY_LABEL: Record<string, Tag> = Object.fromEntries(
  INTEREST_TAGS.map(tag => [tag.text, tag])
);

// Map from tag code to Tag
const BY_CODE: Record<string, Tag> = Object.fromEntries(
  INTEREST_TAGS.map(tag => [tag.code, tag])
);

export function interestToTag(interestLabel: string): Tag | undefined {
  return BY_LABEL[interestLabel];
}

export function tagByCode(code: string): Tag | undefined {
  return BY_CODE[code];
}

/** Sort tags so the user's own interests appear first. */
export function sortByUserInterests(tags: Tag[], userInterestLabels: string[]): Tag[] {
  const userCodes = new Set(
    userInterestLabels.map(l => BY_LABEL[l]?.code).filter(Boolean)
  );
  return [
    ...tags.filter(t => userCodes.has(t.code)),
    ...tags.filter(t => !userCodes.has(t.code)),
  ];
}
