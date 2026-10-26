import type { ImageProps } from 'next/image';

// Loopback-only preview: preserve the real public asset, without Next's runtime.
export default function PreviewImage({ src, alt, width, height, className, style }: ImageProps) {
  const url = typeof src === 'string' ? src : 'src' in src ? src.src : src.default.src;
  // eslint-disable-next-line @next/next/no-img-element -- not part of the production app
  return <img src={url} alt={alt} width={width} height={height} className={className} style={style} />;
}
