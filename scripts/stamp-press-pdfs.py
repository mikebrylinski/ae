#!/usr/bin/env python3
"""Stamp press PDFs with a bottom bar: publication | ANDYEBERT.COM | month/year."""

from pathlib import Path
import sys

import fitz

SRC = Path("/Users/mikebrylinski/Downloads/Articles")
PDF_OUT = Path(__file__).resolve().parents[1] / "public" / "press"
IMG_OUT = Path(__file__).resolve().parents[1] / "public" / "images" / "press" / "cards"

FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
LIME = (184 / 255, 1, 0)
FOOTER = "ANDYEBERT.COM"

# card_page is 0-indexed. FOH uses page 2 (index 1) — article, not TOC.
articles = [
    {"src": "FOH Magazine 5:11.pdf", "slug": "foh-magazine-2011-05", "source": "FOH MAGAZINE", "date": "MAY 2011", "card_page": 1},
    {"src": "Soundcheck 2:10, Story AndyEbert.pdf", "slug": "soundcheck-2010-02", "source": "SOUNDCHECK", "date": "FEB 2010"},
    {"src": "PSN article 11:10.pdf", "slug": "pro-sound-news-2010-11", "source": "PRO SOUND NEWS", "date": "NOV 2010"},
    {"src": "PSN article 12:08.pdf", "slug": "pro-sound-news-2008-12", "source": "PRO SOUND NEWS", "date": "DEC 2008"},
    {"src": "PSN article 9:10.pdf", "slug": "pro-sound-news-2010-09", "source": "PRO SOUND NEWS", "date": "SEP 2010"},
    {"src": "Total Production 2:08.pdf", "slug": "total-production-2008-04", "source": "TOTAL PRODUCTION", "date": "APR 2008"},
    {"src": "Mix magazine 1:07.pdf", "slug": "mix-magazine-2007-01", "source": "MIX MAGAZINE", "date": "JAN 2007"},
    {"src": "Mix Magazine, 1:16.pdf", "slug": "mix-magazine-2016-01", "source": "MIX MAGAZINE", "date": "JAN 2016"},
    {"src": "Lighting&Sound America Online 12:06.pdf", "slug": "lighting-sound-america-2006-12", "source": "LIGHTING & SOUND AMERICA", "date": "DEC 2006"},
    {"src": "Live Design magazine 4:05.pdf", "slug": "live-design-2005-04", "source": "LIVE DESIGN", "date": "APR 2005"},
    {"src": "Heil Sound press release 8:09.pdf", "slug": "heil-sound-2009-08", "source": "HEIL SOUND", "date": "AUG 2009", "start_page": 1},
    {"src": 'Digidesign "Venue On The Road" testimonial.pdf', "slug": "venue-on-the-road-gnr", "source": "VENUE ON THE ROAD", "date": "2006"},
    {"src": "JBL HLA News 1999.pdf", "slug": "jbl-hla-news-1999-05", "source": "JBL HLA NEWS", "date": "MAY 1999"},
    {"src": "AEbert Article - Tools4Music.pdf", "slug": "tools4music", "source": "TOOLS4MUSIC", "date": "2009"},
    {"src": "Live Sound International - Andy Ebert 10:08.pdf", "slug": "live-sound-international-2008-10", "source": "LIVE SOUND INTERNATIONAL", "date": "OCT 2008"},
    {"src": "Production Partner Article 3:17.pdf", "slug": "production-partner-2017-04", "source": "PRODUCTION PARTNER", "date": "APR 2017", "card_page": 1},
]


def stamp_page(page, source, date):
    r = page.rect
    bar_h = max(26, min(48, r.height * 0.042))
    y0 = r.height - bar_h
    page.draw_rect(fitz.Rect(0, y0, r.width, r.height), color=(0, 0, 0), fill=(0, 0, 0), width=0)
    accent_h = max(2.0, bar_h * 0.08)
    page.draw_rect(fitz.Rect(0, y0, r.width, y0 + accent_h), color=LIME, fill=LIME, width=0)

    fontsize = max(8, min(13, bar_h * 0.38))
    font = fitz.Font(fontfile=FONT)
    pad = max(10, r.width * 0.02)
    baseline = y0 + accent_h + (bar_h - accent_h) * 0.72

    tw_source = font.text_length(source, fontsize=fontsize)
    tw_date = font.text_length(date, fontsize=fontsize)
    tw_site = font.text_length(FOOTER, fontsize=fontsize)

    site_fs = fontsize
    gap = 12
    occupied = pad + tw_source + gap + tw_site + gap + tw_date + pad
    if occupied > r.width:
        site_fs = max(7, fontsize * 0.9)
        tw_site = font.text_length(FOOTER, fontsize=site_fs)

    page.insert_text((pad, baseline), source, fontfile=FONT, fontsize=fontsize, color=(1, 1, 1))
    page.insert_text((r.width - pad - tw_date, baseline), date, fontfile=FONT, fontsize=fontsize, color=LIME)
    page.insert_text(((r.width - tw_site) / 2, baseline), FOOTER, fontfile=FONT, fontsize=site_fs, color=LIME)


def main():
    PDF_OUT.mkdir(parents=True, exist_ok=True)
    IMG_OUT.mkdir(parents=True, exist_ok=True)

    updated = []
    for art in articles:
        src = SRC / art["src"]
        if not src.exists():
            sys.exit(f"missing {src}")
        doc = fitz.open(src)
        start = art.get("start_page", 0)
        if start:
            doc.delete_pages(from_page=0, to_page=start - 1)
        for page in doc:
            stamp_page(page, art["source"], art["date"])
        pdf_path = PDF_OUT / f"{art['slug']}.pdf"
        doc.save(pdf_path, deflate=True, garbage=4)

        card_idx = art.get("card_page", 0)
        if card_idx >= doc.page_count:
            card_idx = 0
        page_card = doc[card_idx]
        scale = 1400 / page_card.rect.width
        pix = page_card.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
        jpg = IMG_OUT / f"{art['slug']}.jpg"
        pix.save(str(jpg), jpg_quality=82)

        hits_upper = []
        hits_lower = []
        for p in doc:
            text = p.get_text("text")
            hits_upper.append(FOOTER in text)
            hits_lower.append("andyebert.com" in text)
        if not all(hits_upper):
            sys.exit(f"missing {FOOTER} on {art['slug']}: {hits_upper}")
        if any(hits_lower):
            sys.exit(f"lowercase andyebert.com still present on {art['slug']}: {hits_lower}")

        print(
            f"{art['slug']}: {doc.page_count}p all_caps={all(hits_upper)} "
            f"pdf={pdf_path.stat().st_size // 1024}kb jpg={jpg.stat().st_size // 1024}kb card_p{card_idx + 1}"
        )
        updated.append(art["slug"])
        doc.close()

    print("updated", len(updated))
    print("skipped: Ultimate Ears Manual.pdf")


if __name__ == "__main__":
    if len(sys.argv) >= 2:
        src = Path(sys.argv[1])
        slug = "production-partner-2017-04"
        source = "PRODUCTION PARTNER"
        date = "APR 2017"
        card_page = 1
        PDF_OUT.mkdir(parents=True, exist_ok=True)
        IMG_OUT.mkdir(parents=True, exist_ok=True)
        if not src.exists():
            sys.exit(f"missing {src}")
        doc = fitz.open(src)
        for page in doc:
            stamp_page(page, source, date)
        pdf_path = PDF_OUT / f"{slug}.pdf"
        doc.save(pdf_path, deflate=True, garbage=4)
        card_idx = card_page if card_page < doc.page_count else 0
        page_card = doc[card_idx]
        scale = 1400 / page_card.rect.width
        pix = page_card.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
        jpg = IMG_OUT / f"{slug}.jpg"
        pix.save(str(jpg), jpg_quality=82)
        print(
            f"{slug}: {doc.page_count}p pdf={pdf_path.stat().st_size // 1024}kb "
            f"jpg={jpg.stat().st_size // 1024}kb card_p{card_idx + 1}"
        )
        doc.close()
    else:
        main()
