import Inspectable from "@/components/visual/Inspectable";
import type { LensMeta } from "@/components/visual/lens";

interface InspectableImageProps {
  src: string;
  alt: string;
  meta: LensMeta;
  className?: string;
  imgClassName?: string;
}

/**
 * Natural-flow variant of the instrument plate: keeps the image's own aspect
 * (schematics, lab photos, diagrams) and reveals the ironbow view under the
 * lens. The thermal copy is the same pixels through #fx-ironbow, so it's
 * always registered.
 */
export default function InspectableImage({ src, alt, meta, className, imgClassName }: InspectableImageProps) {
  return (
    <Inspectable
      meta={meta}
      className={className}
      style={{ display: "block", lineHeight: 0 }}
      thermal={
        <img
          src={src}
          alt=""
          aria-hidden
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            filter: "url(#fx-ironbow) contrast(1.05)",
          }}
        />
      }
    >
      <img src={src} alt={alt} loading="lazy" className={imgClassName} style={{ display: "block", width: "100%", height: "auto" }} />
    </Inspectable>
  );
}
