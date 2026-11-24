// The colors you can give an occurrence type. Only the `key` is saved in the
// database. Each one points at a design token in src/styles/tokens.css, so
// tweak the color THERE and every type using it updates.

export interface ColorOption { key: string; name: string; value: string }

export const PALETTE: ColorOption[] = [
  { key: 'moss',   name: 'Moss',        value: 'var(--c-moss)' },
  { key: 'olive',  name: 'Olive',       value: 'var(--c-olive)' },
  { key: 'forest', name: 'Deep forest', value: 'var(--c-forest)' },
  { key: 'sage',   name: 'Sage',        value: 'var(--c-sage)' },
  { key: 'bark',   name: 'Bark',        value: 'var(--c-bark)' },
  { key: 'fawn',   name: 'Fawn',        value: 'var(--c-fawn)' },
  { key: 'teal',   name: 'Slate-teal',  value: 'var(--c-teal)' },
  { key: 'rust',   name: 'Rust',        value: 'var(--c-rust)' },
]

/** The CSS color for a palette key, e.g. 'teal' → 'var(--c-teal)' */
export function typeColor(key: string): string {
  return (PALETTE.find((c) => c.key === key) ?? PALETTE[0]).value
}
