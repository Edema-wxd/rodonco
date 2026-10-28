import Script from "next/script";

import { FACEBOOK_PIXEL_ID } from "@/lib/facebook-pixel";

const baseCode = `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${FACEBOOK_PIXEL_ID}');
fbq('track', 'PageView');
`;

/**
 * Facebook pixel base code. Rendered on the waitlist page only — that's the
 * one page we track. Renders nothing when NEXT_PUBLIC_FACEBOOK_PIXEL_ID is
 * unset.
 *
 * next/script rather than a raw <script>: React doesn't execute inline scripts
 * it inserts on the client, so a raw tag silently does nothing whenever the
 * page is reached by a soft navigation.
 */
export function FacebookPixel() {
  if (!FACEBOOK_PIXEL_ID) return null;

  return (
    <>
      <Script id="facebook-pixel" strategy="afterInteractive">
        {baseCode}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${FACEBOOK_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
