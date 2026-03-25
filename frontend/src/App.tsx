import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import './App.css'
import { ensureTutorSession, runTutorPrompt } from './adk'
import type { AgentPart } from './adk'
import { copy, subjects } from './content'
import { prepareImagePart } from './media'
import { getSupportedRecorderMimeType, speakText, stopSpeaking, transcribeAudio } from './voice'

type Language = 'hi' | 'en'
type SubjectId = 'math' | 'hindi' | 'evs' | 'english'
type MoodId = 'calm' | 'curious' | 'shy'
type ClassLevel = '1' | '2' | '3' | '4' | '5'
type ChatSender = 'agent' | 'user' | 'summary' | 'image'

type ChatMessage = {
  id: string
  sender: ChatSender
  text?: string
  previewUrl?: string
}

type SavedThread = {
  id: string
  title: string
  updatedAt: number
  language: Language
  classLevel: ClassLevel
  activeSubject: SubjectId
  activeMood: MoodId
  sessionId: string | null
  messages: ChatMessage[]
}

const STORAGE_KEY = 'nanhipathshala_threads_v1'

const moods: {
  id: MoodId
  hi: string
  en: string
}[] = [
  { id: 'calm', hi: 'शांत', en: 'Calm' },
  { id: 'curious', hi: 'जिज्ञासु', en: 'Curious' },
  { id: 'shy', hi: 'थोड़ा शर्मीला', en: 'Shy' },
]

const classLevels: ClassLevel[] = ['1', '2', '3', '4', '5']

function createMessage(sender: ChatSender, text?: string, previewUrl?: string): ChatMessage {
  return {
    id: `${sender}-${crypto.randomUUID()}`,
    sender,
    text,
    previewUrl,
  }
}

function createDefaultThread(language: Language = 'hi'): SavedThread {
  return {
    id: crypto.randomUUID(),
    title: language === 'hi' ? 'नई चैट' : 'New chat',
    updatedAt: Date.now(),
    language,
    classLevel: '3',
    activeSubject: 'math',
    activeMood: 'calm',
    sessionId: null,
    messages: [createMessage('agent', copy[language].welcomeMessage)],
  }
}

function loadStoredThreads() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return [createDefaultThread('hi')]
    }

    const parsed = JSON.parse(raw) as SavedThread[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [createDefaultThread('hi')]
    }

    return parsed
  } catch {
    return [createDefaultThread('hi')]
  }
}

function persistableMessages(messages: ChatMessage[]) {
  return messages.map((message) => ({
    ...message,
    previewUrl: message.previewUrl?.startsWith('data:') ? message.previewUrl : undefined,
  }))
}

function deriveThreadTitle(messages: ChatMessage[], language: Language) {
  const firstUser = messages.find((message) => message.sender === 'user' && message.text?.trim())
  if (firstUser?.text) {
    return firstUser.text.slice(0, 28)
  }

  const firstImage = messages.find((message) => message.sender === 'image')
  if (firstImage) {
    return language === 'hi' ? 'होमवर्क फोटो' : 'Homework photo'
  }

  return language === 'hi' ? 'नई चैट' : 'New chat'
}

function latestPreview(messages: ChatMessage[], language: Language) {
  const candidate = [...messages]
    .reverse()
    .find((message) => message.sender === 'agent' || message.sender === 'user' || message.sender === 'summary')

  if (candidate?.text) {
    return candidate.text.slice(0, 44)
  }

  return language === 'hi' ? 'अभी कोई संदेश नहीं' : 'No messages yet'
}

function App() {
  const [threads, setThreads] = useState<SavedThread[]>(() =>
    typeof window === 'undefined' ? [createDefaultThread('hi')] : loadStoredThreads(),
  )
  const [currentThreadId, setCurrentThreadId] = useState<string>(() =>
    typeof window === 'undefined' ? '' : loadStoredThreads()[0]?.id ?? '',
  )
  const [language, setLanguage] = useState<Language>('hi')
  const [classLevel, setClassLevel] = useState<ClassLevel>('3')
  const [activeSubject, setActiveSubject] = useState<SubjectId>('math')
  const [activeMood, setActiveMood] = useState<MoodId>('calm')
  const [isListening, setIsListening] = useState(false)
  const [isLoadingReply, setIsLoadingReply] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [apiError, setApiError] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recorderChunksRef = useRef<Blob[]>([])
  const discardRecordingRef = useRef(false)
  const recordingTimerRef = useRef<number | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const userIdRef = useRef(`nanhi-user-${Math.random().toString(36).slice(2, 10)}`)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)

  const sortedThreads = useMemo(
    () => [...threads].sort((a, b) => b.updatedAt - a.updatedAt),
    [threads],
  )

  const currentThread =
    sortedThreads.find((thread) => thread.id === currentThreadId) ?? sortedThreads[0] ?? createDefaultThread('hi')

  useEffect(() => {
    if (!currentThreadId && sortedThreads[0]?.id) {
      setCurrentThreadId(sortedThreads[0].id)
    }
  }, [currentThreadId, sortedThreads])

  useEffect(() => {
    if (!currentThread) {
      return
    }

    setLanguage(currentThread.language)
    setClassLevel(currentThread.classLevel)
    setActiveSubject(currentThread.activeSubject)
    setActiveMood(currentThread.activeMood)
    setMessages(currentThread.messages.length ? currentThread.messages : [createMessage('agent', copy[currentThread.language].welcomeMessage)])
    setStatusText(copy[currentThread.language].readyHint)
    setApiError('')
    sessionIdRef.current = currentThread.sessionId
  }, [currentThread.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isLoadingReply])

  useEffect(() => {
    if (!currentThreadId) {
      return
    }

    setThreads((current) =>
      current.map((thread) =>
        thread.id === currentThreadId
          ? {
              ...thread,
              language,
              classLevel,
              activeSubject,
              activeMood,
              sessionId: sessionIdRef.current,
              messages: persistableMessages(messages),
              title: deriveThreadTitle(messages, language),
              updatedAt: Date.now(),
            }
          : thread,
      ),
    )
  }, [activeMood, activeSubject, classLevel, currentThreadId, language, messages])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads))
  }, [threads])

  useEffect(
    () => () => {
      recorderRef.current?.stop()
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current)
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      stopSpeaking()
    },
    [],
  )

  const lessonCopy = copy[language]
  const activeSubjectCopy = subjects.find((subject) => subject.id === activeSubject) ?? subjects[0]
  const activeMoodCopy = moods.find((mood) => mood.id === activeMood) ?? moods[0]

  const classLabel = language === 'hi' ? `कक्षा ${classLevel}` : `Class ${classLevel}`
  const subjectLabel = language === 'hi' ? activeSubjectCopy.label.hi : activeSubjectCopy.label.en
  const moodLabel = language === 'hi' ? activeMoodCopy.hi : activeMoodCopy.en
  const settingsSummary = `${classLabel} • ${subjectLabel} • ${moodLabel}`
  const starterPrompts = [
    lessonCopy.starterAskMath,
    lessonCopy.starterAskHindi,
    lessonCopy.starterAskEvs,
  ]

  const buildBasePrompt = (mode: 'teach' | 'reteach') =>
    [
      language === 'hi'
        ? `आप NanhiPathshala हैं। ${classLabel} के बच्चे को ${subjectLabel} पढ़ा रहे हैं।`
        : `You are NanhiPathshala teaching ${subjectLabel} to a ${classLabel.toLowerCase()} child.`,
      language === 'hi'
        ? `बच्चे का mood ${moodLabel} है।`
        : `The child mood is ${moodLabel.toLowerCase()}.`,
      language === 'hi'
        ? 'बहुत आसान हिन्दी, छोटे वाक्य, और घर के example का उपयोग करें।'
        : 'Use simple language, short sentences, and a home example.',
      language === 'hi'
        ? 'पहले जवाब दें, फिर अंत में एक छोटा counter-question पूछें।'
        : 'Answer first, then ask one short follow-up question at the end.',
      mode === 'reteach'
        ? language === 'hi'
          ? 'बच्चे को अभी समझ नहीं आया, इसलिए और आसान करके समझाइए।'
          : 'The child did not understand, so explain again more simply.'
        : '',
    ]
      .filter(Boolean)
      .join(' ')

  const buildSummaryText = () =>
    language === 'hi'
      ? `माँ के लिए: ${activeSubjectCopy.summary.hi} अब घर पर ${activeSubjectCopy.nextPractice.hi}`
      : `For the mother: ${activeSubjectCopy.summary.en} Next at home: ${activeSubjectCopy.nextPractice.en}`

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const clearRecordingTimer = () => {
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
  }

  const stopActiveRecording = (discard = false) => {
    discardRecordingRef.current = discard
    recorderRef.current?.stop()
    setIsListening(false)
  }

  const createNewChat = () => {
    stopSpeaking()
    const nextThread = createDefaultThread(language)
    setThreads((current) => [nextThread, ...current])
    setCurrentThreadId(nextThread.id)
    setIsHistoryOpen(false)
    setIsSettingsOpen(false)
    sessionIdRef.current = null
  }

  const requestTutorReply = async (args: {
    mode: 'teach' | 'reteach'
    userText?: string
    extraParts?: AgentPart[]
    autoplayReply?: boolean
  }) => {
    setIsLoadingReply(true)
    setApiError('')
    setStatusText(lessonCopy.processing)

    try {
      const sessionId = await ensureTutorSession(sessionIdRef.current, userIdRef.current)
      sessionIdRef.current = sessionId

      if (!sessionId) {
        throw new Error('Tutor session could not be created.')
      }

      const textParts: AgentPart[] = [
        {
          text: [
            buildBasePrompt(args.mode),
            args.userText
              ? language === 'hi'
                ? `बच्चे ने पूछा: ${args.userText}`
                : `The child asked: ${args.userText}`
              : language === 'hi'
                ? `विषय ${activeSubjectCopy.topic.hi} समझाइए।`
                : `Explain ${activeSubjectCopy.topic.en}.`,
          ].join(' '),
        },
      ]

      const reply =
        (await runTutorPrompt({
          userId: userIdRef.current,
          sessionId,
          parts: [...textParts, ...(args.extraParts ?? [])],
        })) || lessonCopy.errorFallback

      setMessages((current) => [
        ...current,
        createMessage('agent', reply),
        createMessage('summary', buildSummaryText()),
      ])
      setStatusText(lessonCopy.readyHint)
      if (args.autoplayReply) {
        speakText(reply, language)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : lessonCopy.errorFallback
      setApiError(message)
      setStatusText(message)
    } finally {
      setIsLoadingReply(false)
    }
  }

  const handleVoiceToggle = () => {
    stopSpeaking()
    setApiError('')

    if (isListening) {
      stopActiveRecording(false)
      return
    }

    void (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(lessonCopy.unsupported)
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaStreamRef.current = stream

        const mimeType = getSupportedRecorderMimeType()
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)

        recorderRef.current = recorder
        recorderChunksRef.current = []
        discardRecordingRef.current = false
        setRecordingSeconds(0)
        setIsListening(true)
        setStatusText(lessonCopy.listeningNow)
        clearRecordingTimer()
        recordingTimerRef.current = window.setInterval(() => {
          setRecordingSeconds((current) => current + 1)
        }, 1000)

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recorderChunksRef.current.push(event.data)
          }
        }

        recorder.onerror = () => {
          setIsListening(false)
          clearRecordingTimer()
          setStatusText(lessonCopy.unsupported)
          setApiError(lessonCopy.unsupported)
          mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
          mediaStreamRef.current = null
        }

        recorder.onstop = async () => {
          setIsListening(false)
          clearRecordingTimer()
          mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
          mediaStreamRef.current = null

          const audioBlob = new Blob(recorderChunksRef.current, {
            type: recorder.mimeType || mimeType || 'audio/webm',
          })
          recorderChunksRef.current = []

          if (discardRecordingRef.current || !audioBlob.size) {
            discardRecordingRef.current = false
            setRecordingSeconds(0)
            setStatusText(lessonCopy.readyHint)
            return
          }

          try {
            setStatusText(lessonCopy.transcribing)
            const transcript = await transcribeAudio(audioBlob, language)
            setRecordingSeconds(0)

            if (!transcript) {
              setStatusText(lessonCopy.unsupported)
              setApiError(lessonCopy.unsupported)
              return
            }

            setMessages((current) => [...current, createMessage('user', transcript)])
            await requestTutorReply({ mode: 'teach', userText: transcript, autoplayReply: true })
          } catch (error) {
            const message = error instanceof Error ? error.message : lessonCopy.errorFallback
            setApiError(message)
            setStatusText(message)
          }
        }

        recorder.start()
      } catch (error) {
        const message = error instanceof Error ? error.message : lessonCopy.unsupported
        setIsListening(false)
        clearRecordingTimer()
        setApiError(message)
        setStatusText(message)
      }
    })()
  }

  const handleRetry = () => {
    const lastUserMessage = [...messages].reverse().find((message) => message.sender === 'user')
    const prompt =
      lastUserMessage?.text ||
      (language === 'hi' ? `${subjectLabel} आसान हिन्दी में समझाओ` : `Explain ${subjectLabel} simply`)

    void requestTutorReply({ mode: 'reteach', userText: prompt })
  }

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleOpenCameraPicker = () => {
    cameraInputRef.current?.click()
  }

  const handleImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    setApiError('')

    try {
      const { part, previewUrl } = await prepareImagePart(file)
      setMessages((current) => [...current, createMessage('image', lessonCopy.imageSent, previewUrl)])

      const imagePrompt =
        language === 'hi'
          ? 'इस homework image को देखकर आसान हिन्दी में समझाओ कि इसमें क्या है, बच्चे को क्या करना है, और फिर एक छोटा counter-question पूछो।'
          : 'Look at this homework image, explain what it shows, what the child should do, and then ask one short follow-up question.'

      await requestTutorReply({
        mode: 'teach',
        userText: imagePrompt,
        extraParts: [part],
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : lessonCopy.errorFallback
      setApiError(message)
      setStatusText(message)
    }
  }

  const replayLatestAgentAudio = (text?: string) => {
    if (!text) {
      return
    }

    speakText(text, language)
  }

  const handleStarterPrompt = (prompt: string) => {
    setMessages((current) => [...current, createMessage('user', prompt)])
    void requestTutorReply({ mode: 'teach', userText: prompt })
  }

  return (
    <main className="app-shell">
      <div className="glow glow-one" />
      <div className="glow glow-two" />

      <header className="topbar">
        <button className="top-icon-button" onClick={() => setIsHistoryOpen((open) => !open)} type="button">
          {lessonCopy.chatsLabel}
        </button>

        <div className="brand-area">
          <img alt="NanhiPathshala logo" className="brand-logo" src="/nanhipathshala-icon.png" />
          <div>
            <p className="brand-tag">{lessonCopy.brandTag}</p>
            <img
              alt={language === 'hi' ? 'नन्ही पाठशाला' : 'NanhiPathshala'}
              className="brand-title-image"
              src={language === 'hi' ? '/nanhipathshala-title-hi.png' : '/nanhipathshala-title-en.png'}
            />
          </div>
        </div>

        <div className="top-actions">
          <button className="top-icon-button" onClick={() => setIsSettingsOpen((open) => !open)} type="button">
            {lessonCopy.settingsShort}
          </button>
        </div>
      </header>

      {isHistoryOpen ? (
        <div className="modal-backdrop" onClick={() => setIsHistoryOpen(false)} role="presentation">
          <section className="history-sheet modal-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="history-sheet-header">
              <strong>{lessonCopy.chatsLabel}</strong>
              <button className="new-chat-button" onClick={createNewChat} type="button">
                {lessonCopy.newChatLabel}
              </button>
            </div>

            {sortedThreads.length === 0 ? <p className="history-empty">{lessonCopy.noChatsYet}</p> : null}

            {sortedThreads.map((thread) => (
              <button
                key={thread.id}
                className={thread.id === currentThreadId ? 'history-item active' : 'history-item'}
                onClick={() => {
                  setCurrentThreadId(thread.id)
                  setIsHistoryOpen(false)
                }}
                type="button"
              >
                <strong>{thread.title}</strong>
                <span>{latestPreview(thread.messages, thread.language)}</span>
              </button>
            ))}
          </section>
        </div>
      ) : null}

      {isSettingsOpen ? (
        <div className="modal-backdrop" onClick={() => setIsSettingsOpen(false)} role="presentation">
          <section className="session-bar modal-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="setup-card">
            <div className="setup-card-header">
              <strong>{lessonCopy.settingsLabel}</strong>
              <span>{settingsSummary}</span>
            </div>

            <div className="language-switch" role="tablist" aria-label="Language switch">
              <button
                className={language === 'hi' ? 'lang-pill active' : 'lang-pill'}
                onClick={() => setLanguage('hi')}
                type="button"
              >
                हिन्दी
              </button>
              <button
                className={language === 'en' ? 'lang-pill active' : 'lang-pill'}
                onClick={() => setLanguage('en')}
                type="button"
              >
                English
              </button>
            </div>

            <div className="setup-group">
              <span>{lessonCopy.classTitle}</span>
              <div className="chip-row">
                {classLevels.map((level) => (
                  <button
                    key={level}
                    className={level === classLevel ? 'chip active' : 'chip'}
                    onClick={() => setClassLevel(level)}
                    type="button"
                  >
                    {language === 'hi' ? `कक्षा ${level}` : `Class ${level}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="setup-group">
              <span>{lessonCopy.subjectTitle}</span>
              <div className="chip-row">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    className={subject.id === activeSubject ? 'chip active' : 'chip'}
                    onClick={() => setActiveSubject(subject.id)}
                    type="button"
                  >
                    {language === 'hi' ? subject.label.hi : subject.label.en}
                  </button>
                ))}
              </div>
            </div>

            <div className="setup-group">
              <span>{lessonCopy.moodTitle}</span>
              <div className="chip-row">
                {moods.map((mood) => (
                  <button
                    key={mood.id}
                    className={mood.id === activeMood ? 'chip active' : 'chip'}
                    onClick={() => setActiveMood(mood.id)}
                    type="button"
                  >
                    {language === 'hi' ? mood.hi : mood.en}
                  </button>
                ))}
              </div>
            </div>
            </div>
          </section>
        </div>
      ) : null}

      <section className="chat-shell">
        <div className="chat-header">
          <div className="chat-avatar">न</div>
          <div>
            <strong>NanhiPathshala</strong>
            <p>{statusText || lessonCopy.activeNow}</p>
            <div className="chat-meta-chips">
              <span>{classLabel}</span>
              <span>{subjectLabel}</span>
              <span>{moodLabel}</span>
            </div>
          </div>
        </div>

        <div className="chat-body">
          {messages.length === 1 && messages[0]?.sender === 'agent' ? (
            <>
              <div className="empty-state-card">
                <div className="empty-state-orbit">
                  <span />
                  <span />
                  <span />
                </div>
                <strong>{lessonCopy.starterTitle}</strong>
                <p>{lessonCopy.starterHelp}</p>
              </div>

              <div className="starter-row">
                {starterPrompts.map((prompt) => (
                  <button key={prompt} className="starter-chip" onClick={() => handleStarterPrompt(prompt)} type="button">
                    {prompt}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {messages.map((message) => {
            if (message.sender === 'image') {
              return (
                <div key={message.id} className="message-row user">
                  <div className="message-bubble image-bubble">
                    {message.previewUrl ? <img alt="Homework upload" src={message.previewUrl} /> : null}
                    <strong>{lessonCopy.imageSent}</strong>
                  </div>
                </div>
              )
            }

            if (message.sender === 'summary') {
              return (
                <div key={message.id} className="message-row summary">
                  <div className="message-bubble summary">
                    <strong>{lessonCopy.motherSummary}</strong>
                    <p>{message.text}</p>
                  </div>
                </div>
              )
            }

            if (message.sender === 'user') {
              return (
                <div key={message.id} className="message-row user">
                  <div className="message-bubble voice-note user">
                    <div className="voice-note-header">
                      <strong>{lessonCopy.childAsked}</strong>
                    </div>
                    <details>
                      <summary>{lessonCopy.showText}</summary>
                      <p>{message.text}</p>
                    </details>
                  </div>
                </div>
              )
            }

            return (
              <div key={message.id} className="message-row agent">
                <div className="message-bubble voice-note agent">
                  <div className="voice-note-header">
                    <strong>{lessonCopy.tutorReplied}</strong>
                    <button className="play-mini" onClick={() => replayLatestAgentAudio(message.text)} type="button">
                      {lessonCopy.playReply}
                    </button>
                  </div>
                  <details>
                    <summary>{lessonCopy.showText}</summary>
                    <p>{message.text}</p>
                  </details>
                </div>
              </div>
            )
          })}

          {isLoadingReply ? (
            <div className="message-row agent">
              <div className="message-bubble agent typing-bubble">
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-composer">
          {isListening ? (
            <div className="voice-capture-bar">
              <button className="capture-action secondary" onClick={() => stopActiveRecording(true)} type="button">
                ×
              </button>
              <div className="capture-center">
                <div className="capture-wave" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <span>{formatRecordingTime(recordingSeconds)}</span>
              </div>
              <button className="capture-action primary" onClick={() => stopActiveRecording(false)} type="button">
                ✓
              </button>
            </div>
          ) : (
            <div className="composer-row">
              <button
                className={isListening ? 'mic-button listening' : 'mic-button'}
                onClick={handleVoiceToggle}
                type="button"
                aria-label={isListening ? lessonCopy.stopListening : lessonCopy.startListening}
              >
                <span className="mic-core" />
              </button>

              <div className="composer-copy">
                <strong>{lessonCopy.voiceModeLabel}</strong>
                <p>{lessonCopy.tapHint}</p>
              </div>

              <div className="attach-stack">
                <button className="attach-button camera" onClick={handleOpenCameraPicker} type="button">
                  <span>◎</span>
                  <small>{lessonCopy.cameraLabel}</small>
                </button>
                <span className="attach-hint">{lessonCopy.cameraHint}</span>
                <button className="attach-button" onClick={handleOpenFilePicker} type="button">
                  <span>+</span>
                  <small>{lessonCopy.uploadLabel}</small>
                </button>
              </div>
            </div>
          )}

          <div className="composer-actions">
            <button className="secondary-button" type="button" onClick={handleRetry}>
              {lessonCopy.retrySimple}
            </button>
            <button className="ghost-button" type="button" onClick={stopSpeaking}>
              {lessonCopy.stopAudio}
            </button>
          </div>

          {apiError ? <p className="error-text">{apiError}</p> : null}
        </div>

        <input
          accept="image/*"
          className="hidden-input"
          onChange={handleImageSelected}
          ref={fileInputRef}
          type="file"
        />
        <input
          accept="image/*"
          capture="environment"
          className="hidden-input"
          onChange={handleImageSelected}
          ref={cameraInputRef}
          type="file"
        />
      </section>
    </main>
  )
}

export default App
