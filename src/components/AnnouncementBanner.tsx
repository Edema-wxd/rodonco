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
 * Scrolling delivery announcement shown at the top of every page.
 *
 * Two identical groups slide left together so the loop is seamless. Each group
 * holds the message twice so even wide desktop screens stay filled. Only the
 * first copy is exposed to screen readers and keyboard focus, so the message is
 * announced once. Motion pauses on hover or focus, and is replaced by a static,
 * wrapped message for visitors who prefer reduced motion (see globals.css).
 */
export default function AnnouncementBanner() {
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
