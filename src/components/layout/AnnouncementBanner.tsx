const WHATSAPP_NUMBER = "08086451542";
// wa.me needs the international format: Nigeria (234) without the leading 0.
const WHATSAPP_LINK = "https://wa.me/2348086451542";

function Message({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <p className="announcement-item" aria-hidden={duplicate || undefined}>
      We currently deliver to Abule Oja, Yaba, Jibowu, Adekunle, Alagomeji,
      Akoka and Iwaya. Outside these locations? Contact us on WhatsApp at{" "}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="announcement-link"
        tabIndex={duplicate ? -1 : undefined}
      >
        {WHATSAPP_NUMBER}
      </a>{" "}
      to confirm delivery availability.
    </p>
  );
}

function Separator() {
  return (
    <span className="announcement-sep" aria-hidden="true">
      •
    </span>
  );
}

/**
 * Scrolling delivery-area announcement shown above the Navbar.
 *
 * It sits outside the sticky <header> and scrolls away with the page, so the
 * Navbar keeps sticking at top-0 and the elements offset from it (shop sidebar,
 * ordering-closed notice, checkout summary) need no changes.
 *
 * Two identical groups slide left together so the loop is seamless, and each
 * holds the message twice so wide screens stay filled. Only the first copy is
 * exposed to screen readers and keyboard focus. Motion pauses on hover or focus
 * and is replaced by a static, wrapped message under prefers-reduced-motion
 * (styles in globals.css).
 */
export function AnnouncementBanner() {
  return (
    <section aria-label="Delivery announcement" className="announcement">
      <div className="announcement-track">
        {[0, 1].map((group) => (
          <div
            key={group}
            className="announcement-group"
            aria-hidden={group === 1 || undefined}
          >
            <Message duplicate={group === 1} />
            <Separator />
            <Message duplicate />
            <Separator />
          </div>
        ))}
      </div>
    </section>
  );
}
