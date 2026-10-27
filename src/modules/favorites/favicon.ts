// Busca o favicon de um site pelo serviço do Google e devolve como data URL.
// O servidor só acessa este host fixo (nunca a URL do usuário), evitando SSRF.
const FAVICON_SERVICE = 'https://www.google.com/s2/favicons'
const TIMEOUT_MS = 3000
const MAX_BYTES = 100 * 1024
const TIPOS_ACEITOS = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

export function faviconServiceUrl(siteUrl: string): string {
  const { hostname } = new URL(siteUrl)
  return `${FAVICON_SERVICE}?domain=${encodeURIComponent(hostname)}&sz=128`
}

export async function fetchFavicon(siteUrl: string): Promise<string> {
  const serviceUrl = faviconServiceUrl(siteUrl)
  try {
    // Para domínios desconhecidos o Google responde 404 com um ícone genérico (globo), que serve igual
    const response = await fetch(serviceUrl, { signal: AbortSignal.timeout(TIMEOUT_MS), redirect: 'follow' })
    const tipo = response.headers.get('content-type')?.split(';')[0]?.trim() ?? ''
    if (!TIPOS_ACEITOS.includes(tipo)) return serviceUrl

    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length === 0 || bytes.length > MAX_BYTES) return serviceUrl
    return `data:${tipo};base64,${bytes.toString('base64')}`
  } catch {
    // Sem rede ou timeout: guarda a URL do serviço, que o navegador tenta carregar depois
    return serviceUrl
  }
}
