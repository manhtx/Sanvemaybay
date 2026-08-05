export interface OriginOption {
  code: string;
  name: string;
}

export function uniqueOrigins(routes: Array<{ originCode: string; originName: string }>): OriginOption[] {
  const origins = new Map<string, OriginOption>();
  routes.forEach((route) => {
    if (!origins.has(route.originCode)) origins.set(route.originCode, { code: route.originCode, name: route.originName });
  });
  return [...origins.values()];
}
