export type SceneId = 'forest' | 'sakura' | 'autumn';

export type SceneTheme = {
  id: SceneId;
  artSrc: string;
  /** Bias crop toward the open meadow play area. */
  objectPosition: string;
  washColour: string;
  pathColour: string;
  pathColourDark: string;
  rimColour: string;
  rimHighlight: string;
  /** Ambient motion overlay flavour. */
  ambience: 'sparkle' | 'petals' | 'leaves';
};

const SCENE_BY_LEVEL: Record<number, SceneTheme> = {
  1: {
    id: 'forest',
    artSrc: '/assets/scenes/level-1-forest.jpg',
    objectPosition: 'center 62%',
    washColour: '#6DBA4A',
    pathColour: '#E2C894',
    pathColourDark: '#C4A870',
    rimColour: '#3A6B2E',
    rimHighlight: '#6FAE52',
    ambience: 'sparkle',
  },
  2: {
    id: 'sakura',
    artSrc: '/assets/scenes/level-2-sakura.jpg',
    objectPosition: 'center 64%',
    washColour: '#74C46A',
    pathColour: '#EBD7B0',
    pathColourDark: '#D0B88C',
    rimColour: '#3F7A38',
    rimHighlight: '#78C066',
    ambience: 'petals',
  },
  3: {
    id: 'autumn',
    artSrc: '/assets/scenes/level-3-autumn.jpg',
    objectPosition: 'center 60%',
    washColour: '#C4A04A',
    pathColour: '#D0A868',
    pathColourDark: '#B48A48',
    rimColour: '#6B4A22',
    rimHighlight: '#A87838',
    ambience: 'leaves',
  },
};

export function getSceneTheme(levelId: number): SceneTheme {
  return SCENE_BY_LEVEL[levelId] ?? SCENE_BY_LEVEL[1];
}
