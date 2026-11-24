// The illustrated scene for each month, from src/assets/doodles/scenes/.
// Files are named by month number: 01-january.svg, 02-february.svg, …
// To use your own art, save over a file (keep the number at the start).
// Scenes are drawn 800×300; wider or narrower art works too, it gets cropped
// from the bottom-center to fit.
//
// DRAWING TIP: phones only show roughly the MIDDLE HALF of a scene, so keep
// the main creature between about x=200 and x=600, and leave the top ~70px
// fairly calm (the month name is lettered there).

const files = import.meta.glob<string>('../assets/doodles/scenes/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})

// { 1: url, 4: url, … } keyed by the number at the start of the file name
const byMonth = new Map<number, string>()
for (const [path, url] of Object.entries(files)) {
  const month = Number(path.split('/').pop()!.slice(0, 2))
  if (month >= 1 && month <= 12) byMonth.set(month, url)
}

/** The scene for a month (1–12). If a month has no scene yet, borrow the nearest one. */
export function sceneFor(month: number): string | undefined {
  for (let distance = 0; distance <= 6; distance++) {
    const before = ((month - 1 - distance + 12) % 12) + 1
    const after = ((month - 1 + distance) % 12) + 1
    const url = byMonth.get(before) ?? byMonth.get(after)
    if (url) return url
  }
  return undefined
}
