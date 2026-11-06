import { css, html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";

const DEFAULT_IMAGE =
  "https://cdn.jsdelivr.net/gh/brzxi/tw-laura-vanity@main/assets/laura-vanity.webp";

/** Drawer hit-areas, as % of the vanity image (1080 × 1620 artwork). */
const DRAWER_ZONES = [
  { top: 50.1, height: 9.5 },
  { top: 60.2, height: 9.6 },
  { top: 70.3, height: 9.6 },
  { top: 80.4, height: 9.6 },
];
const ZONE_LEFT = 12.3;
const ZONE_WIDTH = 75.5;

type Lingual = string | Record<string, string> | undefined | null;

interface Drawer {
  title?: Lingual;
  link?: string | { url?: string } | null;
  [key: string]: any;
}

export default class LauraVanity extends LitElement {
  @property({ type: Object })
  config?: Record<string, any>;

  @state() private active = -1;

  private get lang(): string {
    try {
      return (window as any).Salla?.config?.get?.("user.language_code") || document.documentElement.lang || "ar";
    } catch {
      return "ar";
    }
  }

  /** Reads a (possibly multilingual) value from an object. */
  private t(obj: Record<string, any> | undefined, key: string): string {
    if (!obj) return "";
    const lang = this.lang;
    let v: Lingual = obj[key];
    if ((v === undefined || v === null || v === "") && obj[lang]) v = obj[lang][key];
    if ((v === undefined || v === null || v === "") && obj.ar) v = obj.ar[key];
    if (v && typeof v === "object") v = (v as any)[lang] || (v as any).ar || (v as any).en || "";
    return (v as string) || "";
  }

  private img(v: any): string {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return this.img(v[0]);
    return v.url || v.original || v.src || "";
  }

  private link(v: any): string {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return this.link(v[0]);
    return v.url || v.value || "";
  }

  static styles = css`
    :host {
      display: block;
      --lv-ink: #5e1424;
      --lv-copper: #b8734f;
      --lv-muted: #8a7a76;
      font-family: inherit;
    }
    * { box-sizing: border-box; }

    .lv {
      padding: clamp(32px, 6vw, 72px) 16px;
      text-align: center;
    }
    .lv-head { margin: 0 auto clamp(18px, 3vw, 32px); max-width: 640px; }
    .lv-title {
      margin: 0;
      color: var(--lv-ink);
      font-size: clamp(26px, 4.2vw, 40px);
      font-weight: 700;
      line-height: 1.2;
    }
    .lv-sub {
      margin: 8px 0 0;
      color: var(--lv-muted);
      font-size: clamp(14px, 1.8vw, 17px);
    }

    .lv-stage {
      position: relative;
      width: min(100%, 560px);
      margin: 0 auto;
      aspect-ratio: 1080 / 1620;
      border-radius: 18px;
      overflow: hidden;
      background: #f3ebe8;
    }
    .lv-art {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      user-select: none;
      -webkit-user-drag: none;
    }

    /* Each drawer is a slice of the same artwork that slides out on hover. */
    .lv-drawer {
      position: absolute;
      display: block;
      text-decoration: none;
      background-repeat: no-repeat;
      border-radius: 3px;
      transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.45s ease, filter 0.45s ease;
      will-change: transform;
      outline: none;
    }
    .lv-drawer:hover,
    .lv-drawer:focus-visible,
    .lv-drawer.is-active {
      transform: translateY(5%) scale(1.035);
      box-shadow: 0 14px 26px -12px rgba(94, 20, 36, 0.35), 0 2px 0 rgba(184, 115, 79, 0.25);
      filter: brightness(1.02);
      z-index: 2;
    }
    .lv-drawer:focus-visible { box-shadow: 0 0 0 2px var(--lv-copper); }

    .lv-label {
      position: absolute;
      inset-inline: 0;
      top: 7%;
      color: var(--lv-ink);
      font-size: clamp(11px, 2.2vw, 15px);
      font-weight: 600;
      letter-spacing: 0.02em;
      opacity: 0.88;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .lv-cta {
      position: absolute;
      bottom: 12%;
      inset-inline: 0;
      display: flex;
      justify-content: center;
      pointer-events: none;
    }
    .lv-cta span {
      background: var(--lv-ink);
      color: #fff;
      font-size: clamp(10px, 1.9vw, 13px);
      padding: 4px 12px;
      border-radius: 999px;
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 0.35s ease, transform 0.35s ease;
    }
    .lv-drawer:hover .lv-cta span,
    .lv-drawer:focus-visible .lv-cta span,
    .lv-drawer.is-active .lv-cta span {
      opacity: 1;
      transform: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .lv-drawer, .lv-cta span { transition: none; }
    }
  `;

  private onTouch(i: number, e: Event) {
    // First tap on touch devices opens the drawer, second tap follows the link.
    if (window.matchMedia("(hover: none)").matches && this.active !== i) {
      e.preventDefault();
      this.active = i;
    }
  }

  render() {
    const c = this.config || {};
    const title = this.t(c, "title") || "تسريحة لورا";
    const subtitle = this.t(c, "subtitle");
    const art = this.img(c.image) || DEFAULT_IMAGE;
    const cta = this.t(c, "button_text") || "تسوّق الآن";
    const drawers: Drawer[] = Array.isArray(c.drawers) ? c.drawers.slice(0, 4) : [];

    return html`
      <section class="lv" dir="rtl">
        <div class="lv-head">
          <h2 class="lv-title">${title}</h2>
          ${subtitle ? html`<p class="lv-sub">${subtitle}</p>` : nothing}
        </div>

        <div class="lv-stage">
          <img class="lv-art" src=${art} alt=${title} loading="lazy" decoding="async" />
          ${DRAWER_ZONES.map((z, i) => {
            const d = drawers[i] || {};
            const label = this.t(d, "title");
            const href = this.link(d.link) || "#";
            const bgSize = `${(100 / ZONE_WIDTH) * 100}% ${(100 / z.height) * 100}%`;
            const bgPos = `${(ZONE_LEFT / (100 - ZONE_WIDTH)) * 100}% ${(z.top / (100 - z.height)) * 100}%`;
            return html`
              <a
                class="lv-drawer ${this.active === i ? "is-active" : ""}"
                href=${href}
                aria-label=${label || `درج ${i + 1}`}
                style="top:${z.top}%;left:${ZONE_LEFT}%;width:${ZONE_WIDTH}%;height:${z.height}%;background-image:url('${art}');background-size:${bgSize};background-position:${bgPos};"
                @click=${(e: Event) => this.onTouch(i, e)}
                @mouseenter=${() => (this.active = i)}
                @mouseleave=${() => (this.active = -1)}
              >
                ${label ? html`<span class="lv-label">${label}</span>` : nothing}
                <span class="lv-cta"><span>${cta}</span></span>
              </a>
            `;
          })}
        </div>
      </section>
    `;
  }
}
