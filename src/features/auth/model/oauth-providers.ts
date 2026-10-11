export type OAuthProvider = "google" | "microsoft" | "facebook"

export type OAuthProviderConfig = {
  id: OAuthProvider
  displayName: string
  authorizePath: string
  callbackPath: string
  iconSrc?: string
}

export const oauthProviders: Record<OAuthProvider, OAuthProviderConfig> = {
  google: {
    id: "google",
    displayName: "Google",
    authorizePath: "/auth/google/authorize",
    callbackPath: "/auth/google/callback",
    iconSrc: "/google.svg",
  },
  microsoft: {
    id: "microsoft",
    displayName: "Microsoft",
    authorizePath: "/auth/microsoft/authorize",
    callbackPath: "/auth/microsoft/callback",
    iconSrc: "/microsoft.svg",
  },
  facebook: {
    id: "facebook",
    displayName: "Facebook",
    authorizePath: "/auth/facebook/authorize",
    callbackPath: "/auth/facebook/callback",
    iconSrc: "/facebook.svg",
  },
}
