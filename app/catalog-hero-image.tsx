import type { TripIdeaMedia } from "@/lib/catalog/trip-idea-media";

type CatalogHeroImageProps = {
  media: TripIdeaMedia;
};

export function CatalogHeroImage({ media }: CatalogHeroImageProps) {
  return (
    <figure className="detail-hero-visual">
      {/* Catalog photos deliberately stay direct: no image-optimization bill for this low-volume portfolio app. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={media.imageUrl} alt={media.alt} />
      <figcaption>
        <a href={media.attribution.url} target="_blank" rel="noreferrer">
          {media.attribution.label} ↗
        </a>
      </figcaption>
    </figure>
  );
}
