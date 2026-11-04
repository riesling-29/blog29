import githubLight from "@shikijs/themes/github-light";

/** GitHub Light reds on Blog29 paper (~#eeeadf) fail AA; darken keyword/storage tokens only. */
const LIGHT_REDS = new Set(["#d73a49", "#cb2431", "#b31d28"]);
const LIGHT_RED_AA = "#9B1C2E";

const tokenColors = (githubLight.tokenColors ?? []).map((rule) => {
  const fg = rule.settings?.foreground?.toLowerCase();
  if (fg && LIGHT_REDS.has(fg)) {
    return {
      ...rule,
      settings: { ...rule.settings, foreground: LIGHT_RED_AA },
    };
  }
  return rule;
});

export const blog29CodeLight = {
  ...githubLight,
  name: "blog29-code-light",
  displayName: "Blog29 Code Light",
  tokenColors,
};
