export default function FoodImage({ imageUrl, emoji, className = '', imageClassName = '' }) {
  return imageUrl ? (
    <img src={imageUrl} alt="" className={`object-cover ${imageClassName}`} />
  ) : (
    <span className={className} aria-hidden="true">{emoji}</span>
  )
}
