import { art, blank, frame, list, paper, rating, table, themed, title, write, type BuiltInTemplate } from '../kit';

// Music and podcasts: an album log with cover slots, a playlist and podcasts to hear.

export const musicAndPodcastsTemplates: BuiltInTemplate[] = [
  {
    id: 'music-albums',
    subject: 'Music and podcasts',
    name: 'Album log',
    description: 'Six album covers with stars and a line about each.',
    size: 'portrait',
    build: () => ({
      background: paper(8),
      elements: [
        title(60, 50, 640, 'Album log'),
        art(740, 40, 100, 'record', 'rose', 8),
        ...[0, 1, 2, 3, 4, 5].flatMap((i) => {
          const x = 60 + (i % 3) * 265;
          const y = 190 + Math.floor(i / 3) * 470;
          return [frame(x, y, 250, 250, i % 2 ? 1 : -1, { hint: 'Cover' }), rating(x + 25, y + 264, 200), write(x, y + 316, 250, 126, '', ['lilac', 'rose', 'sky', 'mint', 'butter', 'peach'][i], false)];
        }),
        themed(60, 1130, 400, 'playlist', -1),
      ],
    }),
  },
  {
    id: 'music-playlist',
    subject: 'Music and podcasts',
    name: 'Playlist',
    description: 'A playlist on paper: the song, who it is by and why it is on the list.',
    size: 'portrait',
    build: () => ({
      background: paper(6),
      elements: [
        title(60, 50, 560, 'Playlist'),
        art(730, 40, 110, 'headphones', 'rose', -6),
        write(60, 180, 780, 90, 'A playlist for', 'mint', false),
        table(60, 300, 780, 740, 'Tracks', 'teal', ['Song', 'Artist', 'Why it is here'], blank(12)),
        themed(60, 1076, 460, 'musicnotes', -1),
      ],
    }),
  },
  {
    id: 'music-podcasts',
    subject: 'Music and podcasts',
    name: 'Podcasts to hear',
    description: 'Shows you follow, episodes to save and something you learned from one.',
    size: 'portrait',
    build: () => ({
      background: paper(4),
      elements: [
        title(60, 50, 640, 'Podcasts'),
        art(740, 40, 100, 'note', 'lilac', 6),
        table(60, 190, 780, 520, 'Shows', 'butter', ['Podcast', 'About', 'Episodes heard'], blank(7)),
        list(60, 740, 380, 'Episodes to save', 'peach', 5),
        write(460, 740, 380, 313, 'Something I learned', 'sky'),
      ],
    }),
  },
];
