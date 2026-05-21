export function apiPath(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}
