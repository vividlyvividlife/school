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

export interface ThemeVisual {
  image: ImageMetadata;
  season?: ThemeSeason;
}

const rules: Array<{ match: RegExp; image: ImageMetadata; season?: ThemeSeason }> = [
  { match: /восень|у восень/i, image: mapleLeaf, season: 'autumn' },
  { match: /прырод|экалог|жывая кніга/i, image: leafOak },
  { match: /радзім|без радзімы|мая зямля/i, image: rodzimaCranes },
  { match: /зім/i, image: winterSnowflake, season: 'winter' },
  { match: /вясн/i, image: springBlossom, season: 'spring' },
  { match: /казк/i, image: springButterfly, season: 'spring' },
  { match: /вайне|мірна жыць/i, image: winterSpruce },
  { match: /мастацтва|слова і кніга/i, image: springButterfly },
  { match: /сям.я|клопат|добры чалавек|шкадуе|людзей/i, image: springBlossom, season: 'spring' },
  { match: /грамадства|быць на зямлі|чалавекам/i, image: leafOak },
  { match: /птушка|вучэннем|праца|шчасліва/i, image: rowanBranch },
];

export function themeArt(title: string): ThemeVisual {
  const rule = rules.find((item) => item.match.test(title));
  return rule
    ? { image: rule.image, season: rule.season }
    : { image: rowanBranch };
}
