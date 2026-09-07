export function sanitizeUser(user: any) {
  const { password, access_token, refresh_token, ...cleaned } = user;
  return cleaned;
}
