import type { ImageMetadata } from 'astro';
import mapleLeaf from '../assets/decor/maple-leaf.webp';
import rowanBranch from '../assets/decor/rowan-branch.webp';
import winterSnowflake from '../assets/decor/winter-snowflake.webp';
import winterSpruce from '../assets/decor/winter-spruce.webp';
import springBlossom from '../assets/decor/spring-blossom.webp';
import springButterfly from '../assets/decor/spring-butterfly.webp';
import leafOak from '../assets/fx/leaf-oak.webp';
import rodzimaCranes from '../assets/decor/rodzima-cranes.webp';

export type ThemeSeason = 'autumn' | 'winter' | 'spring';
export type ThemeMotif =
  | 'leaves'
  | 'snow'
  | 'spring'
  | 'nature'
  | 'magic'
  | 'sparkles'
  | 'cranes'
  | 'birds'
  | 'butterflies'
  | 'hearts'
  | 'letters'
  | 'notes'
  | 'planes'
  | 'doves'
  | 'bees';

export interface ThemeVisual {
  image: ImageMetadata;
  season?: ThemeSeason;
  motif: ThemeMotif;
}

const rules: Array<{ match: RegExp; image: ImageMetadata; season?: ThemeSeason; motif: ThemeMotif }> = [
  { match: /восень|у восень/i, image: mapleLeaf, season: 'autumn', motif: 'leaves' },
  { match: /радзім|без радзімы|мая зямля|яго род/i, image: rodzimaCranes, motif: 'cranes' },
  { match: /зім/i, image: winterSnowflake, season: 'winter', motif: 'snow' },
  { match: /вясн/i, image: springBlossom, season: 'spring', motif: 'spring' },
  { match: /казк/i, image: springButterfly, season: 'spring', motif: 'magic' },
  { match: /прырод|экалог|жывая кніга/i, image: leafOak, motif: 'nature' },
  { match: /клопат|добры чалавек|шкадуе|жывёлу/i, image: springButterfly, season: 'spring', motif: 'butterflies' },
  { match: /сям.я|бацькоў|дзіця|людзей/i, image: springBlossom, season: 'spring', motif: 'hearts' },
  { match: /мастацтва/i, image: springButterfly, motif: 'notes' },
  { match: /слова і кніга/i, image: leafOak, motif: 'letters' },
  { match: /вайне|мірна жыць|быць на зямлі|чалавекам/i, image: rodzimaCranes, motif: 'doves' },
  { match: /грамадства/i, image: leafOak, motif: 'planes' },
  { match: /птушка|вучэннем/i, image: rowanBranch, motif: 'birds' },
  { match: /праца|шчасліва/i, image: rowanBranch, motif: 'bees' },
  { match: /урокі жыцця/i, image: rowanBranch, motif: 'sparkles' },
];

export function themeArt(title: string): ThemeVisual {
  const rule = rules.find((item) => item.match.test(title));
  return rule
    ? { image: rule.image, season: rule.season, motif: rule.motif }
    : { image: rowanBranch, motif: 'leaves' };
}
