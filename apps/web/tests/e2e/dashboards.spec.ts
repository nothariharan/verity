import { expect, test } from "@playwright/test";

const server = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://127.0.0.1:8791";

test("hiring and practice dashboards render against the live server", async ({ page }) => {
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Interviews" })).toBeVisible();
  await expect(page.getByText("No scores.")).toBeVisible();
  await expect(page.getByText("The Verity server is not reachable.")).toHaveCount(0);

  await page.goto("/app/new");
  await expect(page.getByRole("button", { name: "Create interview" })).toBeVisible();

  await page.goto("/me");
  await expect(page.getByRole("heading", { name: "Your interviews" })).toBeVisible();
  await expect(page.getByText("The Verity server is not reachable.")).toHaveCount(0);
});

test("creating an interview hands the candidate a join link", async ({ page }) => {
  const created = await page.request.post(`${server}/v1/sessions`, {
    data: {
      mode: "recruiter",
      role: "ML Engineer",
      durationSec: 900,
      resumeText: "Designed a Kafka pipeline processing 50k events per second.",
      candidateName: "Avery",
    },
  });
  expect(created.status()).toBe(201);
  const { sessionId } = (await created.json()) as { sessionId: string };

  await page.goto(`/app/live/${sessionId}?invite=1`);
  await expect(page.getByLabel("Candidate join link")).toHaveValue(new RegExp(`/interview/${sessionId}$`));
  await expect(page.locator("[data-invite='ready']")).toBeVisible();
  await expect(page.getByText("Demo data")).toHaveCount(0);
});

test("the scripted dossier stays labeled and the live dossier has no score", async ({ page }) => {
  await page.goto("/app/dossier/demo");
  await expect(page.getByText("Demo data")).toBeVisible();
  await expect(page.getByText("Demo log has no audio")).toBeVisible();
  await expect(page.getByText("No overall score.")).toBeVisible();
});
