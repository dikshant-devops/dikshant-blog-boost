import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ScrollToTop } from "./ScrollToTop";

const NavigationProbe = () => {
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate("/blog?tag=GCP")}>Change query</button>
      <button onClick={() => navigate("/playlists/gcp-security")}>Change path</button>
    </>
  );
};

describe("ScrollToTop", () => {
  it("resets scroll only when the pathname changes", () => {
    const scrollTo = vi.fn();
    vi.spyOn(window, "scrollTo").mockImplementation(scrollTo);

    render(
      <MemoryRouter initialEntries={["/blog"]}>
        <ScrollToTop />
        <NavigationProbe />
      </MemoryRouter>
    );

    expect(scrollTo).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Change query" }));
    expect(scrollTo).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Change path" }));
    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: "auto" });
  });
});
