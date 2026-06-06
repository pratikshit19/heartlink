export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  /** Optional: email of the first user who will be granted admin role automatically */
  adminEmail: process.env.ADMIN_EMAIL ?? "",

  // ── AI / Forge API (used by LLM, image generation, voice, maps, storage) ──
  // These were previously auto-injected by Manus. Set them in your .env when self-hosting.
  // For LLM: use your own API gateway or set FORGE_API_URL to OpenAI/Anthropic compatible endpoint.
  forgeApiUrl: process.env.FORGE_API_URL ?? process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.FORGE_API_KEY ?? process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
