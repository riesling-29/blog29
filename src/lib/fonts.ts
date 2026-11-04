import localFont from "next/font/local";

/** Pretendard Variable — Next.js build-time subsetting from the official variable file. */
export const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "100 900",
});
