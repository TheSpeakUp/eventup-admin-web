export async function register(): Promise<void> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_BACKEND !== "true") return;
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { mockServer } = await import("@/mocks/server");
  mockServer.listen({ onUnhandledRequest: "bypass" });
}
