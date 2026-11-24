// The ohdeer mascot. Each pose is its own file in src/assets/doodles/deer/,
// so you can swap in your own drawings without touching this code.
import standing from '../assets/doodles/deer/deer-standing.svg'
import peeking from '../assets/doodles/deer/deer-peeking.svg'
import sleeping from '../assets/doodles/deer/deer-sleeping.svg'

const POSES = { standing, peeking, sleeping }

interface Props {
  pose: keyof typeof POSES  // 'standing' | 'peeking' | 'sleeping'
  width?: number
  className?: string
}

export default function Deer({ pose, width = 120, className = '' }: Props) {
  // alt="" because the deer is decoration; the text next to it says what matters.
  return <img src={POSES[pose]} alt="" width={width} className={`deer ${className}`} />
}
