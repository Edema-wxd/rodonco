import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

import { AnnouncementBanner } from "./AnnouncementBanner";

const MESSAGE =
  "We currently deliver to Abule Oja, Yaba, Jibowu, Adekunle, Alagomeji, Akoka and Iwaya. Outside these locations? Contact us on WhatsApp at 08086451542 to confirm delivery availability.";

describe("AnnouncementBanner", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the delivery message as a labelled region", () => {
    render(<AnnouncementBanner />);

    const region = screen.getByRole("region", { name: "Delivery announcement" });
    expect(region.querySelector("p")?.textContent).toBe(MESSAGE);
  });

  it("exposes the message and WhatsApp link only once to assistive tech", () => {
    render(<AnnouncementBanner />);

    const region = screen.getByRole("region", { name: "Delivery announcement" });
    // getAllByRole skips aria-hidden content, so the duplicates are not counted.
    const links = within(region).getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("https://wa.me/2348086451542");
    expect(links[0].textContent).toBe("08086451542");
    expect(links[0].getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("keeps the duplicate copies out of the tab order", () => {
    const { container } = render(<AnnouncementBanner />);

    const allLinks = Array.from(container.querySelectorAll("a"));
    // Four visual copies keep the loop seamless on wide screens.
    expect(allLinks).toHaveLength(4);
    const focusable = allLinks.filter((a) => a.getAttribute("tabindex") !== "-1");
    expect(focusable).toHaveLength(1);
  });
});
