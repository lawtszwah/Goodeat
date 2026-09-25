import { useEffect, useState } from 'react'

export default function FoodPhoto({ imageUrl, file, onChange, label = '照片' }) {
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const src = preview || imageUrl

  return (
    <div className="mb-3">
      <div className="mb-2 text-sm font-medium text-gray-600">{label}（可选）</div>
      <div className="flex items-center gap-3">
        {src && <img src={src} alt="照片预览" className="h-16 w-16 rounded-xl object-cover" />}
        <label className="soft-button cursor-pointer px-4 py-2.5 text-sm">
          {src ? '更换照片' : '📷 上传照片'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(event) => {
              const selected = event.target.files?.[0]
              if (selected) onChange({ file: selected, imageUrl })
              event.target.value = ''
            }}
          />
        </label>
        {src && <button type="button" onClick={() => onChange({ file: null, imageUrl: null })} className="text-sm text-gray-500">移除</button>}
      </div>
      <p className="mt-1 text-xs text-gray-400">支持 JPG、PNG、WebP、GIF，最大 5 MB</p>
    </div>
  )
}
