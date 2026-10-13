type ResponsivePictureProps = {
  image: {
    avif: string
    webp: string
    fallback: string
    width: number
    height: number
    alt: string
  }
  className?: string
  eager?: boolean
}

export function ResponsivePicture({ image, className, eager = false }: ResponsivePictureProps) {
  return (
    <picture className={className}>
      <source srcSet={image.webp} type="image/webp" />
      <source srcSet={image.avif} type="image/avif" />
      <img
        src={image.fallback}
        width={image.width}
        height={image.height}
        alt={image.alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  )
}
