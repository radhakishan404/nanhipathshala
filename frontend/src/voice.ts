let activeAudio: HTMLAudioElement | null = null
let activeObjectUrl: string | null = null

function cleanupAudio() {
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.src = ''
    activeAudio = null
  }

  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl)
    activeObjectUrl = null
  }
}

function fallbackSpeakText(text: string, language: 'hi' | 'en') {
  if (!window.speechSynthesis) {
    return
  }

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN'
  utterance.rate = 0.95
  utterance.pitch = 1
  window.speechSynthesis.speak(utterance)
}

function formatSpeechText(text: string, language: 'hi' | 'en') {
  let next = text
    .replace(/\s*\+\s*/g, language === 'hi' ? ' plus ' : ' plus ')
    .replace(/\s*=\s*/g, language === 'hi' ? ' बराबर ' : ' equals ')
    .replace(/\s*\/\s*/g, language === 'hi' ? ' बटा ' : ' divided by ')
    .replace(/\bAI\b/g, language === 'hi' ? 'ए आई' : 'A I')
    .replace(/\bEVS\b/g, language === 'hi' ? 'ई वी एस' : 'E V S')
    .replace(/\bClass\b/g, language === 'hi' ? 'क्लास' : 'Class')

  if (language === 'hi') {
    next = next.replace(/\bEnglish\b/g, 'इंग्लिश').replace(/\bMath\b/g, 'मैथ')
  }

  return next
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

export function getSupportedRecorderMimeType() {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return ''
  }

  const mimeTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]

  return mimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || ''
}

export async function transcribeAudio(blob: Blob, language: 'hi' | 'en') {
  const audioBytes = await blob.arrayBuffer()
  const base64Audio = arrayBufferToBase64(audioBytes)

  const response = await fetch('/api/stt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio: base64Audio,
      mimeType: blob.type || 'audio/webm',
      language,
    }),
  })

  if (!response.ok) {
    throw new Error('Voice transcription failed.')
  }

  const payload = (await response.json()) as { transcript?: string }
  return payload.transcript?.trim() || ''
}

export async function speakText(text: string, language: 'hi' | 'en') {
  if (!text.trim()) {
    return
  }

  stopSpeaking()
  const speechText = formatSpeechText(text, language)

  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: speechText,
        language,
      }),
    })

    if (!response.ok) {
      throw new Error('Speech generation failed.')
    }

    const audioBlob = await response.blob()
    const objectUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(objectUrl)

    activeAudio = audio
    activeObjectUrl = objectUrl

    audio.onended = cleanupAudio
    audio.onerror = cleanupAudio
    await audio.play()
  } catch {
    cleanupAudio()
    fallbackSpeakText(speechText, language)
  }
}

export function stopSpeaking() {
  cleanupAudio()

  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}
