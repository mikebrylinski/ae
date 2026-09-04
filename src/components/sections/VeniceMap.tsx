import { useLanguage } from '@/i18n/LanguageProvider'
import { cn } from '@/lib/utils'

/** Venice, Florida (Sarasota County) — not Venice, CA. */
const VENICE_FL = { lat: 27.0998, lng: -82.4543 }

const BBOX = {
  west: VENICE_FL.lng - 0.12,
  south: VENICE_FL.lat - 0.07,
  east: VENICE_FL.lng + 0.12,
  north: VENICE_FL.lat + 0.07,
}

const OSM_EMBED = `https://www.openstreetmap.org/export/embed.html?bbox=${BBOX.west}%2C${BBOX.south}%2C${BBOX.east}%2C${BBOX.north}&layer=mapnik&marker=${VENICE_FL.lat}%2C${VENICE_FL.lng}`

export function VeniceMap({ className }: { className?: string }) {
  const { t } = useLanguage()

  return (
    <div
      className={cn(
        'venice-map relative h-[220px] overflow-hidden rounded-[1rem] border border-border sm:h-[240px]',
        className,
      )}
    >
      <iframe
        title={t.map.title}
        src={OSM_EMBED}
        className="venice-map__frame absolute inset-0 h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <p className="pointer-events-none absolute bottom-3 left-3 z-[1] rounded-[1rem] border border-primary/40 bg-black/80 px-3 py-1.5 font-heading text-xs tracking-[0.14em] text-primary backdrop-blur-sm">
        {t.map.marker}
      </p>
    </div>
  )
}
