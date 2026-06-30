import { useRef, useState } from 'react'
import { RiUploadCloud2Line } from 'react-icons/ri'

export default function UploadZone({ onFileSelected, uploading }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = (files) => {
    const file = files?.[0]
    if (file) onFileSelected(file)
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault()
        setDragOver(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={`
        flex flex-col items-center justify-center gap-4
        border-2 border-dashed rounded-2xl
        py-20 px-6 text-center
        transition-all duration-150
        ${dragOver ? 'border-em bg-surface2' : 'border-border bg-surface hover:border-border2'}
      `}
    >
      <span className={`
        w-16 h-16 rounded-full flex items-center justify-center
        transition-colors duration-150
        ${dragOver ? 'bg-em/20' : 'bg-surface2'}
      `}>
        {uploading
          ? <span className="h-6 w-6 rounded-full border-2 border-em border-t-transparent animate-spin" />
          : <RiUploadCloud2Line size={26} className="text-t3" />
        }
      </span>

      <div>
        <p className="text-t1 text-[15px]">
          {uploading ? 'Uploading and parsing…' : (
            <>
              Drop your CV here or{' '}
              <button
                onClick={() => inputRef.current?.click()}
                className="text-em underline underline-offset-2 hover:brightness-110"
              >
                browse
              </button>
            </>
          )}
        </p>
        <p className="text-t4 text-xs mt-1.5">PDF, DOCX, or Markdown up to 10MB</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.md"
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  )
}
