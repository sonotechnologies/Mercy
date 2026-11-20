"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  /** CSS object-position */
  focus?: string;
  fit?: "cover" | "contain";
  className?: string;
  imgClassName?: string;
  style?: React.CSSProperties;
};

/**
 * Fills its (relatively positioned) parent. Shows a shimmer skeleton until loaded.
 * Uploaded admin images (data: URLs) bypass the optimiser.
 */
export function ProductImage({ src, alt, sizes, priority, focus = "50% 55%", fit = "cover", className = "", imgClassName = "", style }: Props) {
  const [loaded, setLoaded] = useState(false);
  const isData = src.startsWith("data:") || src.startsWith("blob:");
  return (
    <div className={`absolute inset-0 overflow-hidden ${loaded ? "bg-sand" : "skeleton"} ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={isData}
        quality={75}
        onLoad={() => setLoaded(true)}
        className={`transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${imgClassName}`}
        style={{ objectFit: fit, objectPosition: focus, ...style }}
      />
    </div>
  );
}
