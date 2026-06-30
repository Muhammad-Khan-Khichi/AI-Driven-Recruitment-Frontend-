export const STATUS_CONFIG = {
  pending:   { label: 'Pending',   pill: 'pill-pending' },
  applied:   { label: 'Applied',   pill: 'pill-applied' },
  interview: { label: 'Interview', pill: 'pill-interview' },
  offer:     { label: 'Offer',     pill: 'pill-offer' },
  rejected:  { label: 'Rejected',  pill: 'pill-rejected' },
}

export const scoreColor = (score) => {
  if (score >= 80) return 'text-em'
  if (score >= 60) return 'text-amber'
  return 'text-red'
}

export const scoreBg = (score) => {
  if (score >= 80) return 'bg-[#052E1C] border-[#074D2F]'
  if (score >= 60) return 'bg-[#2D1A00] border-[#3D2400]'
  return 'bg-[#2D0A0A] border-[#3D1212]'
}
