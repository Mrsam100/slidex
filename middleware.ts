import { auth } from '@/auth'

export default auth((req) => {
  const protectedRoutes = ['/dashboard', '/generate', '/deck', '/settings']
  const isProtected = protectedRoutes.some((r) =>
    req.nextUrl.pathname.startsWith(r),
  )
  if (isProtected && !req.auth) {
    return Response.redirect(new URL('/signin', req.url))
  }
})

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
