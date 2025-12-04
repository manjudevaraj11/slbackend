export function renderTemplate(
  html: string,
  variables: Record<string, string>,
) {
  return html.replace(/{{(.*?)}}/g, (_, key) => {
    const trimmed = key.trim();
    return variables[trimmed] ?? "";
  });
}
