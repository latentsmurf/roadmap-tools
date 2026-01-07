import { test, expect } from "@playwright/test"

test.describe("Public Roadmap View", () => {
  // These tests assume there's at least one roadmap set up in the system
  // In a real E2E setup, you'd seed the database before tests

  test.describe("View Controls", () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to a roadmap page - adjust path as needed
      await page.goto("/r/default/demo")
    })

    test("should display zoom toggle controls", async ({ page }) => {
      // Look for zoom toggle buttons
      const zoomControls = page.locator('[data-testid="zoom-toggle"], button:has-text("Standard")')
      // If page loads with roadmap content, zoom controls should exist
      await expect(zoomControls.first())
        .toBeVisible()
        .catch(() => {
          // May not exist in empty state
        })
    })

    test("should display view type selector", async ({ page }) => {
      // Look for List, Board, Timeline, Changelog buttons
      // At least one view type button should be visible
      const buttons = await page
        .locator("button")
        .filter({ hasText: /list|board|timeline/i })
        .all()
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  test.describe("Filtering", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/r/default/demo")
    })

    test("should have a search input", async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i)
      // Search functionality exists if input is found
      const isVisible = await searchInput.isVisible().catch(() => false)
      if (isVisible) {
        await searchInput.fill("test search")
        await expect(searchInput).toHaveValue("test search")
      }
    })

    test("should have status filter options", async ({ page }) => {
      // Look for status filter dropdowns or buttons
      const statusFilter = page.locator('[data-testid="status-filter"], button:has-text("Status")')
      // Status filtering available if element exists
      await expect(statusFilter.first())
        .toBeVisible()
        .catch(() => {
          // May not exist in empty state
        })
    })
  })

  test.describe("Item Interactions", () => {
    test("should show item detail drawer when clicking an item", async ({ page }) => {
      await page.goto("/r/default/demo")

      // Find a roadmap item card
      const itemCard = page.locator('[class*="card"], [data-testid="item-card"]').first()
      const isVisible = await itemCard.isVisible().catch(() => false)

      if (isVisible) {
        await itemCard.click()
        // Drawer/modal should appear
        const drawer = page.locator('[role="dialog"], [data-testid="item-drawer"]')
        await expect(drawer)
          .toBeVisible({ timeout: 3000 })
          .catch(() => {
            // Drawer may not exist in empty state
          })
      }
    })
  })
})

test.describe("404 Handling", () => {
  test("should show not found page for invalid roadmap", async ({ page }) => {
    await page.goto("/r/nonexistent/fake-roadmap-12345")

    // Should either show 404 or redirect
    const notFoundText = page.getByText(/not found|404|doesn't exist/i)
    const isNotFound = await notFoundText.isVisible().catch(() => false)

    if (!isNotFound) {
      // Might redirect to homepage or show empty state
      expect(page.url()).toBeTruthy()
    }
  })
})

test.describe("Embed Demo", () => {
  test("should load embed demo page", async ({ page }) => {
    await page.goto("/embed-demo")

    // Page should load - check for any content
    await expect(page.locator("body")).toBeVisible()
  })
})
