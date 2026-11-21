import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('OAuth & NextAuth Safe Public Origin Redirection Suite', () => {
  const redirectApiPath = path.resolve('src/app/api/auth/redirect/route.ts')
  const authConfigPath = path.resolve('src/auth.config.ts')
  const middlewarePath = path.resolve('src/middleware.ts')
  const nginxConfigPath = path.resolve('nginx/nginx.conf')

  it('1. /api/auth/redirect/route.ts should resolve origin from headers and never default to 0.0.0.0', () => {
    const content = fs.readFileSync(redirectApiPath, 'utf-8')
    expect(content).toContain('resolvePublicOrigin')
    expect(content).toContain("!forwardedHost.includes('0.0.0.0')")
    expect(content).not.toContain("origin || 'http://localhost:3000'")
    expect(content).toContain('https://affiliategadget.id')
  })

  it('2. auth.config.ts should have a safe redirect callback preventing 0.0.0.0 redirects', () => {
    const content = fs.readFileSync(authConfigPath, 'utf-8')
    expect(content).toContain('async redirect({ url, baseUrl })')
    expect(content).toContain("publicBase.includes('0.0.0.0')")
    expect(content).toContain('https://affiliategadget.id')
  })

  it('3. middleware.ts should use getSafeRedirectUrl instead of raw req.url', () => {
    const content = fs.readFileSync(middlewarePath, 'utf-8')
    expect(content).toContain('getSafeRedirectUrl')
    expect(content).not.toContain('new URL(destinationCms, req.url)')
  })

  it('4. nginx.conf should set X-Forwarded-Host and X-Forwarded-Port headers', () => {
    const content = fs.readFileSync(nginxConfigPath, 'utf-8')
    expect(content).toContain('proxy_set_header X-Forwarded-Host $host;')
    expect(content).toContain('proxy_set_header X-Forwarded-Port 443;')
  })
})
