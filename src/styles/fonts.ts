import { Google_Sans_Flex, Noto_Sans_JP } from "next/font/google"

export const googleSansFlex = Google_Sans_Flex({
  variable: "--font-google-sans-flex",
  display: "swap",
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: "variable",
  axes: ["opsz", "wdth", "GRAD", "ROND"],
  fallback: ["Arial", "sans-serif"],
})

export const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  display: "swap",
  weight: "variable",
  fallback: ["Hiragino Sans", "Yu Gothic", "sans-serif"],
})
