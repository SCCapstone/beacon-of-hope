import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import WelcomePage from "../../src/pages/WelcomePage";
import WelcomeCard from "../../src/components/WelcomeCard";
import AuthService from "../../src/services/auth.service";
import React from "react";
import "@testing-library/jest-dom/vitest";

// Mock the useNavigate hook
const mockUseNavigate = vi.fn();
vi.mock("react-router", async () => {
  return {
    ...(await vi.importActual('react-router')),
    useNavigate: mockUseNavigate,
  };
});

describe("WelcomePage", () => {
  // Test 1: Render the Welcome Page and the Buttons
  it("renders Welcome Page correctly", () => {
    render(
      <MemoryRouter>
        <WelcomePage />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Login Access your saved preferences for a tailored experience." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Default Start with our recommended settings for ease and simplicity." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Personas Explore different meal styles and explore one that suits your goals." })).toBeInTheDocument();
  });

//   // Test 2: Renders Login Button and allows navigation
//   it("allows user to navigate to login", async () => {

//     render(
//       <MemoryRouter>
//         <WelcomeCard id='button--one' header='Login' desc='Access your saved preferences for a tailored experience.' to='login' data-testid="welcome-card"></WelcomeCard>
//       </MemoryRouter>
//     );

//     fireEvent.click(screen.getByRole('button'));

//     await waitFor(() => {
//         expect(mockUseNavigate).toHaveBeenCalledOnce();
//     });

//   });

//   // Test 3: Renders Default button
//   it("allows user to navigate to home with default", () => {
//     render(
//         <MemoryRouter>
//             <WelcomeCard id='button--two' header='Default' desc='Start with our recommended settings for ease and simplicity.' to='home'></WelcomeCard>
//         </MemoryRouter>
//     )
//   })

//   // Test 4: Renders Personas button
//   it("allows user to navigate to personas", () => {
//     render(
//         <MemoryRouter>
//             <WelcomeCard id='button--three' header='Personas' desc='Explore different meal styles and explore one that suits your goals.' to='personas'></WelcomeCard>
//         </MemoryRouter>
//     )
//   })

});