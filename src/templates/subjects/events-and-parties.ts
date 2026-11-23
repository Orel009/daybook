import { art, blank, list, paper, table, themed, title, write, type BuiltInTemplate } from '../kit';

// Events and parties: the plan, the guest list, and the menu and music.

export const eventsAndPartiesTemplates: BuiltInTemplate[] = [
  {
    id: 'party-planner',
    subject: 'Events and parties',
    name: 'Party planner',
    description: 'What, when and where, things to do and to buy, and how the day itself goes.',
    size: 'portrait',
    build: () => ({
      background: paper(4),
      elements: [
        title(60, 50, 640, 'Party planner', { size: 70 }),
        art(740, 40, 100, 'partyhat', 'lilac', 8),
        table(60, 190, 780, 170, '', 'butter', [''], ['What', 'When', 'Where']),
        list(60, 390, 380, 'To do', 'rose', 6),
        list(460, 390, 380, 'To buy', 'mint', 6),
        table(60, 790, 780, 260, 'On the day', 'lilac', ['Time', 'What happens'], blank(4)),
        write(60, 1070, 780, 90, 'Theme and colours', 'peach', false),
      ],
    }),
  },
  {
    id: 'party-guests',
    subject: 'Events and parties',
    name: 'Guest list',
    description: 'Everyone you are inviting, with a column for invited, coming and a note.',
    size: 'portrait',
    build: () => ({
      background: paper(2),
      elements: [
        title(60, 50, 560, 'Guest list'),
        art(730, 40, 110, 'balloon', 'rose', 6),
        table(60, 190, 780, 860, 'Who is coming', 'rose', ['Guest', 'Invited', 'Coming', 'Note'], blank(14)),
        write(60, 1070, 780, 90, 'How many in all', 'butter', false),
      ],
    }),
  },
  {
    id: 'party-menu',
    subject: 'Events and parties',
    name: 'Menu and music',
    description: 'What to eat and drink, songs to play, games and surprises, and thank-you notes to send after.',
    size: 'portrait',
    build: () => ({
      background: paper(3),
      elements: [
        title(60, 50, 660, 'Menu and music', { size: 66 }),
        art(740, 40, 100, 'cake', 'rose', -6),
        list(60, 190, 380, 'To eat', 'peach', 6),
        list(460, 190, 380, 'To drink', 'sky', 6),
        list(60, 590, 380, 'Songs to play', 'lilac', 6),
        write(460, 590, 380, 363, 'Games and surprises', 'butter'),
        themed(60, 986, 780, 'party', 0),
        write(60, 1050, 780, 100, 'Thank-you notes to send', 'mint', false),
      ],
    }),
  },
];
