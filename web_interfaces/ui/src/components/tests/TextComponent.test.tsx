import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { TextComponent, TextProps } from "../TextComponent";
import userEvent from "@testing-library/user-event";

describe("TextComponent", () => {
  const defaultProps: TextProps = {
    text: "Hello, World!",
  };

  it("renders component with initial state", () => {
    render(<TextComponent {...defaultProps} />);
    expect(screen.getByText(defaultProps.text)).toBeInTheDocument();
    expect(screen.getByText("Timer: 0 seconds")).toBeInTheDocument();
  });

  it("updates timer every second", () => {
    jest.useFakeTimers();
    render(<TextComponent {...defaultProps} />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText("Timer: 1 seconds")).toBeInTheDocument();
    jest.useRealTimers();
  });

  it("cleanup function calls clearInterval", async () => {
    jest.useFakeTimers(); // Mock the timers API
    const clearIntervalMock = jest.spyOn(window, "clearInterval");
    const { unmount } = render(<TextComponent text={"Hello"} />);

    // eslint-disable-next-line testing-library/no-wait-for-empty-callback
    await waitFor(() => {}, { timeout: 1 });

    // Unmount the component
    unmount();

    // Assert that clearInterval was called
    expect(clearIntervalMock).toHaveBeenCalled();

    // Clean up the mock
    clearIntervalMock.mockRestore();
  });

  it("handles user interaction", () => {
    render(<TextComponent {...defaultProps} />);
    // Example interaction
    // userEvent.click(screen.getByText('Click Me'));

    // Write your interaction and assertion code here
  });
});
