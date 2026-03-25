const express = require('express')
const { GoogleAuth } = require('google-auth-library')
const path = require('path')

const app = express()
const distDir = path.join(__dirname, 'dist')
const port = Number(process.env.PORT || 8080)
const adkBaseUrl = (process.env.ADK_API_BASE_URL || '').replace(/\/$/, '')
const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || process.env.PROJECT_ID || ''
const googleAuth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
})

const TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize'
const STT_ENDPOINT = projectId
  ? `https://us-speech.googleapis.com/v2/projects/${projectId}/locations/us/recognizers/_:recognize`
  : ''

const TTS_VOICES = {
  hi: [
    { languageCode: 'hi-IN', name: 'hi-IN-Chirp3-HD-Leda' },
    { languageCode: 'hi-IN', name: 'hi-IN-Neural2-D' },
  ],
  en: [
    { languageCode: 'en-IN', name: 'en-IN-Chirp3-HD-Leda' },
    { languageCode: 'en-IN', name: 'en-IN-Neural2-D' },
  ],
}

function getVoiceOptions(language) {
  return TTS_VOICES[language] || TTS_VOICES.hi
}

async function getAccessToken() {
  const client = await googleAuth.getClient()
  const token = await client.getAccessToken()
  return typeof token === 'string' ? token : token?.token
}

async function synthesizeSpeech(text, voice, accessToken) {
  const response = await fetch(TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: { text },
      voice,
      audioConfig: {
        audioEncoding: 'MP3',
        effectsProfileId: ['handset-class-device'],
      },
    }),
  })

  return response
}

function getDecodingConfig(mimeType) {
  if (mimeType.includes('webm')) {
    return {
      explicitDecodingConfig: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        audioChannelCount: 1,
      },
    }
  }

  if (mimeType.includes('ogg')) {
    return {
      explicitDecodingConfig: {
        encoding: 'OGG_OPUS',
        sampleRateHertz: 48000,
        audioChannelCount: 1,
      },
    }
  }

  if (mimeType.includes('mp4') || mimeType.includes('aac')) {
    return {
      explicitDecodingConfig: {
        encoding: 'MP4_AAC',
        sampleRateHertz: 44100,
        audioChannelCount: 1,
      },
    }
  }

  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) {
    return {
      autoDecodingConfig: {},
    }
  }

  return {
    autoDecodingConfig: {},
  }
}

async function transcribeSpeech(audio, mimeType, languageCodes, accessToken) {
  return fetch(STT_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      config: {
        ...getDecodingConfig(mimeType),
        languageCodes,
        model: 'chirp_3',
        features: {
          enableAutomaticPunctuation: true,
        },
      },
      content: audio,
    }),
  })
}

app.use(express.json({ limit: '15mb' }))

app.use('/api/adk', async (req, res) => {
  if (!adkBaseUrl) {
    res.status(500).json({ error: 'ADK_API_BASE_URL is not configured.' })
    return
  }

  try {
    const upstreamUrl = `${adkBaseUrl}${req.originalUrl.replace(/^\/api\/adk/, '')}`
    const headers = {
      'Content-Type': 'application/json',
    }

    const upstreamResponse = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body ?? {}),
    })

    const contentType = upstreamResponse.headers.get('content-type') || 'application/json'
    const payload = await upstreamResponse.text()

    res.status(upstreamResponse.status)
    res.type(contentType)
    res.send(payload)
  } catch (error) {
    console.error('ADK proxy failed', error)
    res.status(502).json({ error: 'ADK proxy request failed.' })
  }
})

app.post('/api/tts', async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim().slice(0, 1800) : ''
  const language = req.body?.language === 'en' ? 'en' : 'hi'

  if (!text) {
    res.status(400).json({ error: 'Text is required for speech.' })
    return
  }

  try {
    const accessToken = await getAccessToken()

    if (!accessToken) {
      throw new Error('No Google access token available for TTS.')
    }

    const voiceOptions = getVoiceOptions(language)
    let audioContent = null

    for (const voice of voiceOptions) {
      const upstreamResponse = await synthesizeSpeech(text, voice, accessToken)
      if (!upstreamResponse.ok) {
        continue
      }

      const payload = await upstreamResponse.json()
      if (payload.audioContent) {
        audioContent = payload.audioContent
        break
      }
    }

    if (!audioContent) {
      throw new Error('No speech audio was returned by Google TTS.')
    }

    res.set('Cache-Control', 'no-store')
    res.type('audio/mpeg')
    res.send(Buffer.from(audioContent, 'base64'))
  } catch (error) {
    console.error('TTS synthesis failed', error)
    res.status(502).json({ error: 'Speech generation failed.' })
  }
})

app.post('/api/stt', async (req, res) => {
  const audio = typeof req.body?.audio === 'string' ? req.body.audio : ''
  const language = req.body?.language === 'en' ? 'en' : 'hi'
  const mimeType = typeof req.body?.mimeType === 'string' ? req.body.mimeType.toLowerCase() : 'audio/webm'

  if (!audio) {
    res.status(400).json({ error: 'Audio is required for transcription.' })
    return
  }

  if (!STT_ENDPOINT) {
    res.status(500).json({ error: 'Speech-to-Text is not configured.' })
    return
  }

  try {
    const accessToken = await getAccessToken()

    if (!accessToken) {
      throw new Error('No Google access token available for STT.')
    }

    const languageCodes = language === 'hi' ? ['hi-IN', 'en-IN'] : ['en-IN', 'hi-IN']
    const upstreamResponse = await transcribeSpeech(audio, mimeType, languageCodes, accessToken)

    if (!upstreamResponse.ok) {
      const errorBody = await upstreamResponse.text()
      throw new Error(`Speech transcription failed: ${errorBody}`)
    }

    const payload = await upstreamResponse.json()
    const transcript = (payload.results || [])
      .flatMap((result) => result.alternatives || [])
      .map((alternative) => alternative.transcript || '')
      .join(' ')
      .trim()

    res.json({ transcript })
  } catch (error) {
    console.error('STT transcription failed', error)
    res.status(502).json({ error: 'Voice transcription failed.' })
  }
})

app.get('/app-config.js', (_req, res) => {
  const config = {
    ADK_API_BASE_URL: '/api/adk',
    ADK_APP_NAME: process.env.ADK_APP_NAME || 'nanhipathshala_agent',
  }

  res.type('application/javascript')
  res.send(`window.__APP_CONFIG__ = ${JSON.stringify(config)};`)
})

app.use(express.static(distDir))

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})

app.listen(port, () => {
  console.log(`NanhiPathshala frontend listening on port ${port}`)
})
