/**
 * Small, UI-only helpers for the editable memorial plaque.
 *
 * The old catalogue stored whatever the visitor typed as one complete
 * inscription.  These helpers deliberately do not try to parse that value;
 * callers can keep it in "full text" mode and therefore never add a second
 * relationship prefix to legacy content.
 */

const RELATIONSHIP_FORMATS = Object.freeze({
  father: {
    label: '父亲',
    blank: '先父之位',
    format: name => `先父 ${name} 大人之位`,
  },
  mother: {
    label: '母亲',
    blank: '先母之位',
    format: name => `先母 ${name} 大人之位`,
  },
  grandfather: {
    label: '祖父',
    blank: '先祖父之位',
    format: name => `先祖父 ${name} 大人之位`,
  },
  grandmother: {
    label: '祖母',
    blank: '先祖母之位',
    format: name => `先祖母 ${name} 大人之位`,
  },
  spouse: {
    label: '配偶',
    blank: '故人之位',
    // Do not infer whether a spouse was a husband or wife.
    format: name => `故人 ${name} 之位`,
  },
  child: {
    label: '子女',
    blank: '故人之位',
    // Do not infer a child's gender from the selected relationship.
    format: name => `故人 ${name} 之位`,
  },
  ancestors: {
    label: '先祖',
    blank: '列祖列宗之位',
    // A family name is optional for a collective memorial.
    format: name => `${name}氏列祖列宗之位`,
  },
  general: {
    label: '其他',
    blank: '有缘故人之位',
    format: name => `有缘故人 ${name} 之位`,
  },
})

export function normalizeInscription(value) {
  return String(value ?? '').trim()
}

export function relationshipLabel(slug) {
  return RELATIONSHIP_FORMATS[slug]?.label || '其他'
}

/**
 * Build only the new template-based format.  A blank name returns the
 * supplied catalogue title when available, so the UI does not invent a name.
 */
export function buildInscription(slug, personName, fallbackTitle = '') {
  const name = normalizeInscription(personName)
  if (!name) return normalizeInscription(fallbackTitle) || RELATIONSHIP_FORMATS[slug]?.blank || '先人之位'
  return (RELATIONSHIP_FORMATS[slug] || RELATIONSHIP_FORMATS.general).format(name)
}

/**
 * A raw-name field is trusted only when it reconstructs the stored full
 * inscription exactly. This protects legacy full-text edits from a stale raw
 * field left behind by an earlier template save.
 */
export function matchesTemplateInscription(slug, personName, storedInscription, fallbackTitle = '') {
  const name = normalizeInscription(personName)
  const stored = normalizeInscription(storedInscription)
  return Boolean(name && stored) && buildInscription(slug, name, fallbackTitle) === stored
}

export function hasInscription(value) {
  return Boolean(normalizeInscription(value))
}

export const MEMORIAL_NAME_FIELD = 'memorial_person_name'
