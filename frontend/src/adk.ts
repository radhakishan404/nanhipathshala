declare global {
  interface Window {
    __APP_CONFIG__?: {
      ADK_API_BASE_URL?: string
      ADK_APP_NAME?: string
    }
  }
}

const runtimeApiBaseUrl = window.__APP_CONFIG__?.ADK_API_BASE_URL
const runtimeAppName = window.__APP_CONFIG__?.ADK_APP_NAME

const defaultProxyBaseUrl = '/api/adk'
const apiBaseUrl = (
  runtimeApiBaseUrl ||
  import.meta.env.VITE_ADK_API_BASE_URL ||
  defaultProxyBaseUrl
).replace(/\/$/, '')
const appName = runtimeAppName || import.meta.env.VITE_ADK_APP_NAME || 'nanhipathshala_agent'

type SessionResponse = {
  id: string
}

type RunEvent = {
  content?: {
    role?: string
    parts?: Array<{ text?: string }>
  }
}

export type AgentPart = {
  text?: string
  inlineData?: {
    mimeType: string
    data: string
  }
}

async function createSession(userId: string) {
  if (!apiBaseUrl) {
    return null
  }

  const response = await fetch(`${apiBaseUrl}/apps/${appName}/users/${userId}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })

  if (!response.ok) {
    throw new Error('Unable to create tutor session.')
  }

  const data = (await response.json()) as SessionResponse
  return data.id
}

export async function runTutorPrompt(args: {
  userId: string
  sessionId: string
  parts: AgentPart[]
}) {
  if (!apiBaseUrl) {
    return null
  }

  const response = await fetch(`${apiBaseUrl}/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appName,
      userId: args.userId,
      sessionId: args.sessionId,
      newMessage: {
        role: 'user',
        parts: args.parts,
      },
    }),
  })

  if (!response.ok) {
    throw new Error('Tutor response failed.')
  }

  const events = (await response.json()) as RunEvent[]
  const latestModelEvent = [...events]
    .reverse()
    .find((event) => event.content?.role === 'model' && event.content.parts?.length)

  const text = latestModelEvent?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('\n')
    .trim()

  return text || null
}

export async function ensureTutorSession(existingSessionId: string | null, userId: string) {
  if (existingSessionId) {
    return existingSessionId
  }

  return createSession(userId)
}

export function hasAdkApiConfigured() {
  return Boolean(apiBaseUrl)
}
