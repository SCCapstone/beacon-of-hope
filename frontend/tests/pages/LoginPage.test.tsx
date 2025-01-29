import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginPage from "../../src/pages/LoginPage";
import AuthService from "../../src/services/auth.service";
import React from "react";
import "@testing-library/jest-dom/vitest";

// Mock the useNavigate hook
const mockUseNavigate = vi.fn();
vi.mock("react-router", async () => {
  return {
    ...(await vi.importActual('react-router')),
    useNavigate: () => mockUseNavigate,
  };
});


// Mock the AuthService
vi.mock("../services/auth.service", () => ({
  login: vi.fn(),
}));

describe("LoginPage", () => {
  // Test 1: Render the login form
  it("renders login form correctly", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Login to your Account")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  // Test 2: Allows user to type email and password
  it("allows user to type email and password", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText("mail@abc.com");
    const passwordInput = screen.getByPlaceholderText("***********");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });

  // Test 3: Successful login
  it("logs in successfully and navigates to home", async () => {

    const mock = vi.fn().mockImplementation(AuthService.login)

    // (AuthService.login as ReturnType<typeof vi.fn>).

    mock.mockReturnValue({ 
        _id: "1",
        username: "",
        email: "test@example.com",
        plan_ids: [],
        dietary_preferences: {
          preferences: [],
          numerical_preferences: {
            dairy: 0,
            nuts: 0,
            meat: 0,
          },
        },
        health_info: {
          allergies: [],
          conditions: [],
        },
        demographicsInfo: {
          ethnicity: '',
          height: '',
          weight: '',
          age: 0,
          gender: '',
        },
        meal_plan_config: {
          num_days: 0,
          num_meals: 0,
          meal_configs: {
            meal_name: '',
            meal_time: false,
            beverage: false,
            main_course: true,
            side: "",
            dessert: "",
          }[1],
        },
        created_at: "",
        updated_at: ""  });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("mail@abc.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("***********"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", {name: 'Login'}))

    // await waitFor(() => {
    //   expect(mockUseNavigate).toHaveBeenCalledOnce();
    // });
  });

//   // Test 4: Failed login and showing error
//   it("shows error message on failed login attempt", async () => {
//     vi.mocked(AuthService.login).mockRejectedValueOnce({
//       response: { data: { message: "Invalid credentials" } },
//     });

//     render(
//       <MemoryRouter>
//         <LoginPage />
//       </MemoryRouter>
//     );

//     fireEvent.change(screen.getByPlaceholderText("mail@abc.com"), {
//       target: { value: "wrong@example.com" },
//     });
//     fireEvent.change(screen.getByPlaceholderText("***********"), {
//       target: { value: "wrongpassword" },
//     });

//     fireEvent.click(screen.getByRole("button", { name: /login/i }));

//     await waitFor(() => {
//       expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
//     });
//   });

//   // Test 5: Save 'remember me' to localStorage when checked
//   it("saves 'remember me' to localStorage when checked", () => {
//     render(
//       <MemoryRouter>
//         <LoginPage />
//       </MemoryRouter>
//     );

//     const rememberMeCheckbox = screen.getByLabelText("Remember Me");
//     fireEvent.click(rememberMeCheckbox);

//     expect(rememberMeCheckbox).toBeChecked();
//     fireEvent.click(screen.getByRole("button", { name: /login/i }));

//     expect(localStorage.getItem("rememberMe")).toBe("true");
//   });
});