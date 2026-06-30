export default function Placeholder({ title, icon }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 animate-in">
      <div className="text-5xl mb-4 opacity-50">{icon || '🚧'}</div>
      <h2 className="text-t1 text-xl font-bold mb-1">{title}</h2>
      <p className="text-t4 text-sm">This page is coming soon.</p>
    </div>
  )
}
