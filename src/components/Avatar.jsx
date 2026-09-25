// 头像：有照片就显示照片，没有就显示名字首字
export default function Avatar({ profile, size = 28 }) {
  const name = profile?.display_name || '?'
  const url = profile?.avatar_url
  const style = { width: size, height: size, fontSize: size * 0.45 }
  if (url) {
    return <img src={url} alt={name} style={style} className="shrink-0 rounded-full object-cover" />
  }
  return (
    <div
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-orange-200 font-bold text-orange-700"
    >
      {name.slice(0, 1)}
    </div>
  )
}
