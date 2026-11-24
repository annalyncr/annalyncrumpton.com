// The icons you can give an occurrence type.
//
// Every .svg file in src/assets/doodles/icons/ becomes an icon automatically.
// The file name is the icon's "key" (what's saved in the database), so:
//   • to REPLACE an icon with your own art: overwrite the file, same name
//   • to ADD an icon: drop in a new file, e.g. "frog.svg"
//   • don't rename files that types already use (their key would change)
// Icons are shown as single-color shapes tinted with the type's color, so
// draw them as dark lines on a transparent background.

export interface IconOption { key: string; name: string; url: string }

// import.meta.glob is a Vite feature: "give me the web address of every
// file matching this pattern".
const files = import.meta.glob<string>('../assets/doodles/icons/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})

/** 'cloud-rain' → 'Cloud rain' */
function niceName(key: string): string {
  const words = key.replace(/-/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export const ICONS: IconOption[] = Object.entries(files)
  .map(([path, url]) => {
    const key = path.split('/').pop()!.replace('.svg', '')
    return { key, name: niceName(key), url }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

export function iconFor(key: string): IconOption {
  return ICONS.find((i) => i.key === key) ?? ICONS.find((i) => i.key === 'leaf') ?? ICONS[0]
}
