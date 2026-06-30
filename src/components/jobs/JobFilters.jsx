import { RiCloseLine } from 'react-icons/ri'

const ROLE_TYPES = ['Engineering', 'Product', 'Design']

export default function JobFilters({ filters, setFilters, trainingProgress }) {
  const toggleRoleType = (type) => {
    setFilters(f => {
      const isActive = f.roleTypes.includes(type)
      return {
        ...f,
        roleTypes:  isActive ? f.roleTypes.filter(t => t !== type) : [...f.roleTypes, type],
        activeTags: isActive ? f.activeTags.filter(t => t !== type) : [...f.activeTags, type],
      }
    })
  }

  const removeActiveTag = (tag) => {
    setFilters(f => ({
      ...f,
      activeTags: f.activeTags.filter(t => t !== tag),
      roleTypes:  f.roleTypes.filter(t => t !== tag),
    }))
  }

  return (
    <div className="flex flex-col gap-7">
      {/* Active filter chips — only shown if any are set */}
      {filters.activeTags.length > 0 && (
        <div>
          <span className="label-xs block mb-3">Active Filters</span>
          <div className="flex flex-wrap gap-2">
            {filters.activeTags.map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1.5 bg-[#0C2233] text-cyan border border-[#0E3347] text-xs font-semibold px-3 py-1.5 rounded-md"
              >
                {tag}
                <button onClick={() => removeActiveTag(tag)}>
                  <RiCloseLine size={13} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Salary range */}
      <div>
        <span className="label-xs block mb-3">Salary Range</span>
        <input
          type="range"
          min={filters.salaryMin}
          max={filters.salaryMax}
          step={5000}
          value={filters.salaryFloor}
          onChange={e => setFilters(f => ({ ...f, salaryFloor: Number(e.target.value) }))}
          className="w-full accent-em h-1.5"
        />
        <div className="flex justify-between mt-2 text-xs">
          <span className="text-t1 font-semibold">${Math.round(filters.salaryFloor / 1000)}k</span>
          <span className="text-t4">${Math.round(filters.salaryMax / 1000)}k+</span>
        </div>
      </div>

      {/* Role type */}
      <div>
        <span className="label-xs block mb-3">Role Type</span>
        <div className="flex flex-col gap-2.5">
          {ROLE_TYPES.map(type => (
            <label key={type} className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filters.roleTypes.includes(type)}
                onChange={() => toggleRoleType(type)}
                className="sr-only peer"
              />
              <span className="
                w-[18px] h-[18px] rounded-md border border-border2 flex items-center justify-center
                peer-checked:bg-em peer-checked:border-em transition-all flex-shrink-0
              ">
                {filters.roleTypes.includes(type) && (
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3.5 3.5L13 5" stroke="#07090A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-t2 text-sm">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Spacer pushes training progress to the bottom on tall sidebars */}
      <div className="flex-1" />

      {/* AI training progress — only shown if backend provides it */}
      {trainingProgress !== null && trainingProgress !== undefined && (
        <div className="card px-4 py-4">
          <p className="text-t1 text-sm mb-2.5">AI Training Progress</p>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-em rounded-full transition-all duration-500"
              style={{ width: `${trainingProgress}%` }}
            />
          </div>
          <p className="text-em text-xs text-right mt-1.5">{trainingProgress}% Optimized</p>
        </div>
      )}
    </div>
  )
}
