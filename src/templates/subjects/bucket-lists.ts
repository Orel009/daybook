import { art, list, paper, photoSpot, tape, title, write, type BuiltInTemplate } from '../kit';
import { type Season, SEASON_LOOK, BUCKET_IDEAS } from '../shared';

// Bucket lists: ready-made pages.

const bucket = (season: Season): BuiltInTemplate => {
  const s = SEASON_LOOK[season];
  const [outside, home] = BUCKET_IDEAS[season];
  const lines = (ideas: string[]) => [...ideas, '', '', '', ''];
  return {
    id: `bucket-${season}`,
    subject: 'Bucket lists',
    name: `${s.name} bucket list`,
    description: `Things to do this ${season === 'fall' ? 'autumn' : season}, outside and at home, ticked off one by one, with a photo spot and the best moment.`,
    size: 'portrait',
    build: () => ({
      background: paper(s.paper, season === 'winter' ? 'grid' : 'dots'),
      elements: [
        tape(56, 44, 240, s.colors[0], s.tape[0]),
        title(60, 64, 620, `${s.name} bucket list`, { size: 54 }),
        art(720, 40, 130, s.art[0], undefined, 8),
        list(60, 200, 380, 'Outside', s.colors[0], lines(outside)),
        list(460, 200, 380, 'At home', s.colors[1], lines(home)),
        ...photoSpot(70, 640, 360, 300, -2, s.colors[2], s.tape[1]),
        art(372, 900, 96, s.art[1], undefined, -10),
        write(470, 640, 370, 300, 'Best moment', s.colors[2]),
        write(60, 990, 780, 160, 'Next time', s.colors[1]),
        art(756, 1080, 96, s.art[2], undefined, 6),
      ],
    }),
  };
};

export const bucketListsTemplates: BuiltInTemplate[] = [
  bucket('spring'),
  bucket('summer'),
  bucket('fall'),
  bucket('winter'),
];
