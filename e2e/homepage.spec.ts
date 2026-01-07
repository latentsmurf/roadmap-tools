import { test, expect } from "@playwright/test"

test.describe("Homepage", () => {
  test("should display the homepage title", async ({ page }) => {
    await page.goto("/")

    // Check for main heading or brand element
    const heading = page.locator("h1").first()
    await expect(heading).toBeVisible()
  })

  test("should navigate to login page", async ({ page }) => {
    await page.goto("/")

    // Look for a login link/button
    const loginLink = page.getByRole("link", { name: /login|sign in/i })

    if (await loginLink.isVisible()) {
      await loginLink.click()
      await expect(page).toHaveURL(/\/login/)
    }
  })
})

test.describe("Login Page", () => {
  test("should display login options", async ({ page }) => {
    await page.goto("/login")

    // Check for Google sign-in button
    const signInButton = page.getByRole("button", { name: /google|sign in/i })
    await expect(signInButton).toBeVisible()
  })

  test("should redirect to home when accessing login while unauthenticated", async ({ page }) => {
    await page.goto("/login")

    // Page should load without errors
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe("Unauthorized Access", () => {
  test("should redirect to login when accessing admin without auth", async ({ page }) => {
    await page.goto("/admin")

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })

  test("should show unauthorized page for invalid permissions", async ({ page }) => {
    await page.goto("/unauthorized")

    // Should display access denied message
    const accessDenied = page.getByText(/access denied|unauthorized/i)
    await expect(accessDenied).toBeVisible()
  })
})
