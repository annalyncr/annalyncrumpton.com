// The icons you can give an occurrence type.
// PHASE 2 PLACEHOLDER: each icon is an emoji for now. In phase 3 these become
// hand-drawn SVG doodles in src/assets/doodles/. The `key` values stay the
// same, because they're what's saved in the database.

export interface IconOption { key: string; name: string; emoji: string }

export const ICONS: IconOption[] = [
  { key: 'cloud-rain', name: 'Rain',      emoji: '🌧️' },
  { key: 'sun',        name: 'Sun',       emoji: '☀️' },
  { key: 'snow',       name: 'Snow',      emoji: '❄️' },
  { key: 'lightning',  name: 'Lightning', emoji: '⚡' },
  { key: 'wind',       name: 'Wind',      emoji: '🌬️' },
  { key: 'moon',       name: 'Moon',      emoji: '🌙' },
  { key: 'star',       name: 'Star',      emoji: '⭐' },
  { key: 'leaf',       name: 'Leaf',      emoji: '🍃' },
  { key: 'flower',     name: 'Flower',    emoji: '🌸' },
  { key: 'mushroom',   name: 'Mushroom',  emoji: '🍄' },
  { key: 'tree',       name: 'Tree',      emoji: '🌲' },
  { key: 'bird',       name: 'Bird',      emoji: '🐦' },
  { key: 'deer',       name: 'Deer',      emoji: '🦌' },
  { key: 'heart',      name: 'Heart',     emoji: '❤️' },
  { key: 'coffee',     name: 'Coffee',    emoji: '☕' },
  { key: 'pill',       name: 'Pill',      emoji: '💊' },
  { key: 'book',       name: 'Book',      emoji: '📖' },
  { key: 'shoe',       name: 'Shoe',      emoji: '👟' },
  { key: 'house',      name: 'House',     emoji: '🏠' },
  { key: 'sparkle',    name: 'Sparkle',   emoji: '✨' },
]

export function iconFor(key: string): IconOption {
  return ICONS.find((i) => i.key === key) ?? ICONS[7] // fall back to the leaf
}
