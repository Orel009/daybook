import { LOCALE } from '../../domain/dates';
import { art, blank, list, month, paper, sub, table, themed, title, write, type BuiltInTemplate } from '../kit';

// Money: ready-made pages.

export const moneyTemplates: BuiltInTemplate[] = [
  {
    id: 'budget',
    asks: 'month',
    subject: 'Money',
    name: 'Budget planner',
    description: 'Planned, spent and left for each category, with bills to pay.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(6, 'grid'),
      elements: [
        title(60, 56, 620, 'Budget'),
        sub(62, 160, 600, ctx.month.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })),
        table(60, 230, 780, 500, '', 'mint', ['Planned', 'Spent', 'Left'], ['Home', 'Food', 'Transport', 'Bills', 'Fun', 'Savings', 'Other', 'Total']),
        list(60, 760, 380, 'Bills to pay', 'rose', 4),
        write(460, 760, 380, 390, 'Notes', 'butter'),
      ],
    }),
  },
  {
    id: 'savings',
    subject: 'Money',
    name: 'Savings goal',
    description: 'What you’re saving for, the target, and every deposit along the way.',
    size: 'portrait',
    build: () => ({
      background: paper(6),
      elements: [
        title(60, 50, 700, 'Savings goal'),
        art(726, 44, 120, 'gelt', 'butter', 8),
        write(60, 196, 780, 110, 'Saving for', 'butter', false),
        table(60, 326, 780, 100, '', 'mint', ['Goal amount', 'By when', 'Saved so far'], blank(1)),
        table(60, 446, 780, 440, 'Deposits', 'sky', ['Date', 'Amount', 'Total'], blank(7)),
        write(60, 906, 780, 244, 'Why I want this', 'rose'),
      ],
    }),
  },
  {
    id: 'spending',
    asks: 'month',
    subject: 'Money',
    name: 'Spending log',
    description: 'Every purchase with its amount, and what you noticed at the end.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(1, 'grid'),
      elements: [
        title(60, 50, 700, 'Spending log'),
        sub(62, 150, 600, ctx.month.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })),
        table(60, 210, 780, 770, '', 'peach', ['Date', 'What', 'Amount', 'Needed?'], blank(14)),
        write(60, 1000, 780, 150, 'What I noticed', 'butter'),
      ],
    }),
  },
  {
    id: 'bills',
    asks: 'month',
    subject: 'Money',
    name: 'Bills tracker',
    description: 'Every regular bill with its due date, amount and a paid column, plus what’s coming up.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(6, 'grid'),
      elements: [
        title(60, 50, 640, 'Bills'),
        sub(62, 150, 600, ctx.month.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })),
        art(730, 44, 110, 'gelt', 'butter', 8),
        table(60, 214, 780, 620, '', 'mint', ['Bill', 'Due', 'Amount', 'Paid'], ['Rent', 'Electricity', 'Water', 'Phone', 'Internet', 'Insurance', 'Subscriptions', '', '']),
        list(60, 856, 380, 'Coming up', 'rose', 4),
        write(460, 856, 380, 294, 'Notes', 'butter'),
      ],
    }),
  },
  {
    id: 'no-spend',
    asks: 'month',
    subject: 'Money',
    name: 'No-spend month',
    description: 'Mark every day without extra spending, set your rules and watch the savings add up.',
    size: 'portrait',
    build: (ctx) => ({
      background: paper(5),
      elements: [
        themed(60, 44, 240, 'coins', -3),
        title(60, 60, 700, 'No-spend month'),
        month(60, 196, 780, 630, 'mint', ctx.month),
        list(60, 850, 380, 'My rules', 'butter', ['Groceries are fine', 'Bills are fine', 'No takeaway', 'No online shopping']),
        write(460, 850, 380, 300, 'Money saved', 'rose'),
      ],
    }),
  },
  {
    id: 'wish-list',
    subject: 'Money',
    name: 'Wish list',
    description: 'Things you’d love, what they cost, what you’ve saved, and the ones you bought.',
    size: 'landscape',
    build: () => ({
      background: paper(2, 'grid'),
      elements: [
        title(50, 30, 700, 'Wish list'),
        art(1040, 24, 110, 'star', 'butter', 8),
        table(50, 160, 740, 690, '', 'rose', ['Item', 'Price', 'Saved', 'Bought'], blank(10)),
        write(820, 160, 330, 400, 'Why I want it', 'butter'),
        list(820, 580, 330, 'Bought it!', 'mint', 2),
      ],
    }),
  },
];
