import { TEMPLATE_GROUPS, TEMPLATE_SUBJECTS, type TemplateSubject } from './subjects';

// Finding templates on the Templates screen: by a word in the name, the
// description or the subject, within a group of subjects or one subject.
// Kept apart from the screen so it can be unit tested.

export interface TemplateInfo {
  id: string;
  subject: TemplateSubject;
  name: string;
  description: string;
}

export interface TemplateFilter {
  /** Words typed in the search box. */
  query?: string;
  /** A group of subjects, or 'All'. */
  group?: string;
  /** One subject, or 'All'. */
  subject?: string;
}

/** Does the search text appear in any of these texts? Case doesn't matter; an empty search matches everything. */
export function matchesQuery(query: string | undefined, ...texts: string[]): boolean {
  const q = (query ?? '').trim().toLowerCase();
  return !q || texts.some((t) => t.toLowerCase().includes(q));
}

/** The subjects of a group, in the group's order ('All': every subject). */
export function subjectsOf(group: string | undefined): readonly TemplateSubject[] {
  return !group || group === 'All' ? TEMPLATE_SUBJECTS : TEMPLATE_GROUPS.find((g) => g.name === group)?.subjects ?? [];
}

/** The sections to show: each subject that has matching templates, with those templates in their own order. */
export function findTemplates<T extends TemplateInfo>(all: readonly T[], filter: TemplateFilter): { subject: TemplateSubject; templates: T[] }[] {
  return subjectsOf(filter.group)
    .filter((name) => !filter.subject || filter.subject === 'All' || filter.subject === name)
    .map((subject) => ({ subject, templates: all.filter((t) => t.subject === subject && matchesQuery(filter.query, t.name, t.description, t.subject)) }))
    .filter((section) => section.templates.length > 0);
}
