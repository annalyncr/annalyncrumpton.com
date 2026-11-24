// The colors you can give an occurrence type. Only the `key` is saved in the
// database, so you can tweak a hex value here and every type using it updates.
// (In phase 3 these move into CSS design tokens.)

export interface ColorOption { key: string; name: string; hex: string }

export const PALETTE: ColorOption[] = [
  { key: 'moss',   name: 'Moss',        hex: '#6E7B35' },
  { key: 'olive',  name: 'Olive',       hex: '#8A9A3E' },
  { key: 'forest', name: 'Deep forest', hex: '#2F3B1F' },
  { key: 'sage',   name: 'Sage',        hex: '#9BAA7E' },
  { key: 'bark',   name: 'Bark',        hex: '#5A4430' },
  { key: 'fawn',   name: 'Fawn',        hex: '#C98A5A' },
  { key: 'teal',   name: 'Slate-teal',  hex: '#5E8C8A' },
  { key: 'rust',   name: 'Rust',        hex: '#B8582E' },
]

export function colorHex(key: string): string {
  return (PALETTE.find((c) => c.key === key) ?? PALETTE[0]).hex
}
