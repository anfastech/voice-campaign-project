/**
 * Validates that a URL is safe to use as an external webhook target.
 * - Must use HTTPS
 * - Must not point to private/loopback/reserved IP ranges (SSRF prevention)
 * - Must not point to private/reserved hostnames
 */
export function validateWebhookUrl(url: string): { valid: boolean; error?: string } {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'Webhook URL must use HTTPS' }
  }

  const hostname = parsed.hostname.toLowerCase()

  // Block obviously private/loopback hostnames
  const blockedHostnames = ['localhost', '0.0.0.0', '::1', '[::]', '[::1]']
  if (blockedHostnames.includes(hostname)) {
    return { valid: false, error: 'Webhook URL must not point to a private address' }
  }

  // Block private/reserved domain suffixes
  if (/\.(local|internal|localhost|example|test|invalid|corp|home|intranet)$/i.test(hostname)) {
    return { valid: false, error: 'Webhook URL must not point to a private or reserved domain' }
  }

  // If hostname looks like an IPv4 address, check for private/reserved ranges
  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) {
    const [a, b, c] = [Number(ipv4[1]), Number(ipv4[2]), Number(ipv4[3])]
    const isPrivate =
      a === 0 ||                                        // 0.x.x.x
      a === 10 ||                                       // 10.x.x.x (RFC 1918)
      a === 127 ||                                      // 127.x.x.x loopback
      (a === 100 && b >= 64 && b <= 127) ||             // 100.64.x.x CGNAT
      (a === 169 && b === 254) ||                       // 169.254.x.x link-local
      (a === 172 && b >= 16 && b <= 31) ||              // 172.16-31.x.x (RFC 1918)
      (a === 192 && b === 0 && c === 2) ||              // 192.0.2.x TEST-NET
      (a === 192 && b === 168) ||                       // 192.168.x.x (RFC 1918)
      (a === 198 && b >= 18 && b <= 19) ||              // 198.18-19.x.x benchmarking
      (a === 198 && b === 51 && c === 100) ||           // 198.51.100.x TEST-NET-2
      (a === 203 && b === 0 && c === 113) ||            // 203.0.113.x TEST-NET-3
      a >= 224                                          // multicast / reserved

    if (isPrivate) {
      return { valid: false, error: 'Webhook URL must not point to a private IP address' }
    }
  }

  return { valid: true }
}
