import { Plus_Jakarta_Sans } from "next/font/google";
import boingFont from "next/font/local";

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
});

export const boing = boingFont({
  src: "./fonts/Boing-Bold.ttf",
  variable: "--font-boing",
});
