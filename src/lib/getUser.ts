export function getUserId(request: Request): string {
  return request.headers.get('x-user-id') || ''
}
