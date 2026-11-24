import { useState } from 'react';
import { TEMPLATE_SUBJECTS } from '../templates/subjects';

const NEW = '\u0000new';

/**
 * Which subject a template of hers goes under: none, one of the ready-made
 * subjects, one of her own, or a new one she names here.
 */
export function SubjectPicker({ id, value, own, onChange }: { id: string; value: string; own: string[]; onChange: (subject: string) => void }) {
  const known = value === '' || (TEMPLATE_SUBJECTS as readonly string[]).includes(value) || own.includes(value);
  const [naming, setNaming] = useState(!known);
  return (
    <>
      <select
        id={id}
        value={naming ? NEW : value}
        onChange={(e) => {
          if (e.target.value === NEW) {
            setNaming(true);
            onChange('');
          } else {
            setNaming(false);
            onChange(e.target.value);
          }
        }}
      >
        <option value="">No subject</option>
        {own.length > 0 && (
          <optgroup label="My subjects">
            {own.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </optgroup>
        )}
        <optgroup label="Ready-made subjects">
          {TEMPLATE_SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </optgroup>
        <option value={NEW}>A new subject of my own…</option>
      </select>
      {naming && <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Name of the new subject" aria-label="Name of the new subject" maxLength={40} />}
    </>
  );
}
