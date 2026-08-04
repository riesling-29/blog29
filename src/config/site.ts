const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const siteConfig = {
  name: "Blog29",
  description: "기술, 연구, 문화와 일상의 관찰을 오래 남기는 기록 저장소",
  url: productionHost ? `https://${productionHost}` : "https://blog29.vercel.app",
  githubUrl: "https://github.com/riesling-29/blog29",
} as const;
