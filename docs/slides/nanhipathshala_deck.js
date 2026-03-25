const pptxgen = require('pptxgenjs')
const {
  imageSizingContain,
  safeOuterShadow,
  warnIfSlideHasOverlaps,
  warnIfSlideElementsOutOfBounds,
} = require('./pptxgenjs_helpers')

const pptx = new pptxgen()
pptx.layout = 'LAYOUT_WIDE'
pptx.author = 'Codex'
pptx.company = 'NanhiPathshala'
pptx.subject = 'Google Cloud Gen AI Academy APAC Edition submission'
pptx.title = 'NanhiPathshala Submission Deck'
pptx.lang = 'hi-IN'
pptx.theme = {
  headFontFace: 'Arial',
  bodyFontFace: 'Arial',
  lang: 'hi-IN',
}

const colors = {
  bg: 'F7ECDD',
  paper: 'FFF9F1',
  ink: '2C211C',
  muted: '68554C',
  saffron: 'FF9B46',
  leaf: '5E9F69',
  sky: '59B8D4',
  sand: 'FDE5BF',
  cocoa: 'A95018',
  slate: '314955',
  white: 'FFFFFF',
}

const page = { w: 13.333, h: 7.5 }
const screenshotPath =
  '/Volumes/CodeDrive/OpenSourceGithub/nanhipathshala/output/playwright/nanhipathshala-home.png'
const outputPath =
  '/Volumes/CodeDrive/OpenSourceGithub/nanhipathshala/docs/slides/NanhiPathshala-Submission-Deck.pptx'

function addBackground(slide) {
  slide.background = { color: colors.bg }
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.25,
    y: 0.25,
    w: 12.83,
    h: 7,
    rectRadius: 0.18,
    line: { color: 'EAD7BF', transparency: 100 },
    fill: { color: colors.paper },
    shadow: safeOuterShadow('8A5B36', 0.1, 45, 1.5, 1.2),
  })
}

function addTitleBlock(slide, eyebrow, title, subtitle) {
  slide.addText(eyebrow, {
    x: 0.7,
    y: 0.58,
    w: 4.4,
    h: 0.3,
    fontFace: 'Arial',
    fontSize: 9,
    bold: true,
    color: colors.cocoa,
    charSpace: 1.2,
  })

  slide.addText(title, {
    x: 0.7,
    y: 0.92,
    w: 7.2,
    h: 0.58,
    fontFace: 'Arial',
    fontSize: 23,
    bold: true,
    color: colors.ink,
    valign: 'mid',
  })

  slide.addText(subtitle, {
    x: 0.7,
    y: 1.62,
    w: 6.7,
    h: 0.46,
    fontFace: 'Arial',
    fontSize: 11,
    color: colors.muted,
    breakLine: false,
    margin: 0,
  })
}

function addTag(slide, text, x, y, color, textColor = colors.ink) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w: 1.45,
    h: 0.4,
    rectRadius: 0.14,
    line: { color, transparency: 100 },
    fill: { color, transparency: 82 },
  })
  slide.addText(text, {
    x: x + 0.12,
    y: y + 0.07,
    w: 1.18,
    h: 0.18,
    fontFace: 'Arial',
    fontSize: 9,
    bold: true,
    color: textColor,
    align: 'center',
    margin: 0,
  })
}

function addBulletCard(slide, x, y, w, h, title, bullets, accent) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.16,
    line: { color: accent, transparency: 88, pt: 1 },
    fill: { color: colors.white, transparency: 3 },
  })
  slide.addText(title, {
    x: x + 0.22,
    y: y + 0.18,
    w: w - 0.44,
    h: 0.3,
    fontFace: 'Arial',
    fontSize: 15,
    bold: true,
    color: colors.ink,
    margin: 0,
  })
  slide.addText(
    bullets.map((text) => ({ text, options: { bullet: { indent: 12 } } })),
    {
      x: x + 0.22,
      y: y + 0.58,
      w: w - 0.38,
      h: h - 0.72,
      fontFace: 'Arial',
      fontSize: 10.5,
      color: colors.muted,
      breakLine: true,
      paraSpaceAfterPt: 10,
      valign: 'top',
      margin: 0,
    },
  )
}

function addMetric(slide, x, y, w, title, body, accent) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h: 1.25,
    rectRadius: 0.16,
    line: { color: accent, transparency: 85, pt: 1 },
    fill: { color: colors.white, transparency: 2 },
  })
  slide.addText(title, {
    x: x + 0.18,
    y: y + 0.18,
    w: w - 0.36,
    h: 0.24,
    fontFace: 'Arial',
    fontSize: 12,
    bold: true,
    color: colors.ink,
    margin: 0,
  })
  slide.addText(body, {
    x: x + 0.18,
    y: y + 0.5,
    w: w - 0.36,
    h: 0.5,
    fontFace: 'Arial',
    fontSize: 10,
    color: colors.muted,
    margin: 0,
  })
}

function addTimelineStep(slide, x, y, w, number, title, body, accent) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h: 1.35,
    rectRadius: 0.16,
    line: { color: accent, transparency: 90, pt: 1 },
    fill: { color: colors.white, transparency: 5 },
  })
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x + 0.18,
    y: y + 0.18,
    w: 0.44,
    h: 0.44,
    rectRadius: 0.14,
    line: { color: accent, transparency: 100 },
    fill: { color: accent, transparency: 10 },
  })
  slide.addText(String(number), {
    x: x + 0.18,
    y: y + 0.24,
    w: 0.44,
    h: 0.16,
    align: 'center',
    fontFace: 'Arial',
    fontSize: 12,
    bold: true,
    color: colors.ink,
    margin: 0,
  })
  slide.addText(title, {
    x: x + 0.74,
    y: y + 0.2,
    w: w - 0.92,
    h: 0.24,
    fontFace: 'Arial',
    fontSize: 12.5,
    bold: true,
    color: colors.ink,
    margin: 0,
  })
  slide.addText(body, {
    x: x + 0.74,
    y: y + 0.48,
    w: w - 0.92,
    h: 0.56,
    fontFace: 'Arial',
    fontSize: 9.8,
    color: colors.muted,
    margin: 0,
  })
}

function finalize(slide) {
  warnIfSlideHasOverlaps(slide, pptx)
  warnIfSlideElementsOutOfBounds(slide, pptx)
}

{
  const slide = pptx.addSlide()
  addBackground(slide)
  addTag(slide, 'Track 1', 0.72, 0.48, colors.saffron)
  addTag(slide, 'Google ADK', 2.28, 0.48, colors.leaf)
  addTag(slide, 'Cloud Run', 3.98, 0.48, colors.sky)
  slide.addText('NanhiPathshala', {
    x: 0.7,
    y: 1.18,
    w: 4.8,
    h: 0.7,
    fontFace: 'Arial',
    fontSize: 28,
    bold: true,
    color: colors.ink,
    margin: 0,
  })
  slide.addText('Hindi-first AI tutoring agent for Indian mothers and children', {
    x: 0.7,
    y: 1.95,
    w: 5.4,
    h: 0.75,
    fontFace: 'Arial',
    fontSize: 16,
    color: colors.muted,
    bold: true,
    margin: 0,
  })
  slide.addText(
    'A mobile-first learning companion that teaches in simple Hindi, adapts when a child is confused, speaks calmly, and gives mothers a clear progress summary.',
    {
      x: 0.7,
      y: 2.8,
      w: 5.4,
      h: 1.1,
      fontFace: 'Arial',
      fontSize: 11.5,
      color: colors.muted,
      margin: 0,
    },
  )
  addMetric(slide, 0.7, 4.45, 1.95, 'Problem', 'English-first and stressful tools', colors.saffron)
  addMetric(slide, 2.82, 4.45, 1.95, 'Solution', 'Hindi tutor with gentle reteaching', colors.leaf)
  addMetric(slide, 4.94, 4.45, 1.95, 'Build', 'ADK + Gemini + Cloud Run', colors.sky)
  slide.addImage({
    path: screenshotPath,
    ...imageSizingContain(screenshotPath, 7.15, 0.78, 5.2, 5.95),
  })
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 7.02,
    y: 0.64,
    w: 5.46,
    h: 6.2,
    rectRadius: 0.18,
    line: { color: 'E4D0B8', pt: 1.4 },
    fill: { color: colors.white, transparency: 100 },
  })
  slide.addText('Live app screenshot', {
    x: 10.02,
    y: 6.85,
    w: 1.85,
    h: 0.22,
    fontFace: 'Arial',
    fontSize: 8.5,
    color: colors.muted,
    align: 'right',
    margin: 0,
  })
  finalize(slide)
}

{
  const slide = pptx.addSlide()
  addBackground(slide)
  addTitleBlock(
    slide,
    'PROBLEM AND USER',
    'Why this matters for Indian families',
    'Mothers want to help children study at home, but most tools are not made for Hindi-first, low-pressure, early learning.'
  )
  addBulletCard(
    slide,
    0.72,
    2.45,
    4.02,
    3.32,
    'Core pain points',
    [
      'Most edtech and AI tools are English-first and intimidating for young learners.',
      'Children need short explanations, real-life examples, and repetition without shame.',
      'Mothers want clarity, not a complex dashboard or long English reports.',
      'Affordable home learning support is still a gap for many families.',
    ],
    colors.saffron,
  )
  addBulletCard(
    slide,
    4.95,
    2.45,
    3.48,
    3.32,
    'Target users',
    [
      'Classes 1 to 5',
      'Hindi-comfortable children',
      'Mothers guiding study at home',
      'Low-cost side-project friendly deployment',
    ],
    colors.leaf,
  )
  addBulletCard(
    slide,
    8.64,
    2.45,
    3.95,
    3.32,
    'What success looks like',
    [
      'The child feels safe to ask questions in Hindi.',
      'The tutor reteaches patiently when the child says “samajh nahi aaya”.',
      'The mother can see learned topic, weak area, and next home practice in one view.',
    ],
    colors.sky,
  )
  finalize(slide)
}

{
  const slide = pptx.addSlide()
  addBackground(slide)
  addTitleBlock(
    slide,
    'PRODUCT',
    'What we built in the MVP',
    'A simple mobile web experience with one clear flow: choose the child context, ask by voice or text, get a calm Hindi explanation, then view practice and parent summary.'
  )
  addTimelineStep(slide, 0.72, 2.6, 3.8, 1, 'Set the child context', 'Choose class, subject, and child mood in one simple setup area.', colors.saffron)
  addTimelineStep(slide, 0.72, 4.0, 3.8, 2, 'Tap to talk', 'The child can use a large voice button or type a simple question.', colors.sky)
  addTimelineStep(slide, 0.72, 5.4, 3.8, 3, 'Learn and retry', 'The agent explains in Hindi and can reteach more simply when needed.', colors.leaf)

  addBulletCard(
    slide,
    4.78,
    2.55,
    3.55,
    4.1,
    'MVP features',
    [
      'Hindi-first tutoring',
      'Browser audio input and spoken response',
      'Class, subject, and mood selection',
      'Quiz prompts for quick practice',
      'Parent summary card',
    ],
    colors.saffron,
  )
  addBulletCard(
    slide,
    8.58,
    2.55,
    3.95,
    4.1,
    'Why the UI is different',
    [
      'Not a generic transcript-style chatbot.',
      'Large buttons and mobile-friendly spacing.',
      'Warm Indian visual language with Hindi default.',
      'Designed for low-tech confidence, not power-user complexity.',
    ],
    colors.leaf,
  )
  finalize(slide)
}

{
  const slide = pptx.addSlide()
  addBackground(slide)
  addTitleBlock(
    slide,
    'ARCHITECTURE',
    'Built as a real Google ADK agent',
    'NanhiPathshala is a genuine agent implementation for Track 1. It has a root agent, tools, session-aware execution, Gemini on Vertex AI, and Cloud Run deployment.'
  )

  const boxes = [
    { x: 0.95, y: 2.8, w: 2.2, h: 1.0, title: 'Mobile Web App', body: 'Hindi-first UI for child and mother', color: colors.saffron },
    { x: 3.45, y: 2.8, w: 2.35, h: 1.0, title: 'Cloud Run Frontend', body: 'Public web service', color: colors.sky },
    { x: 6.15, y: 2.8, w: 2.55, h: 1.0, title: 'Cloud Run ADK API', body: 'Session-based tutor runtime', color: colors.leaf },
    { x: 9.05, y: 2.8, w: 2.9, h: 1.0, title: 'Gemini on Vertex AI', body: 'gemini-2.5-flash model', color: colors.saffron },
  ]

  boxes.forEach((box, index) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      rectRadius: 0.16,
      line: { color: box.color, transparency: 88, pt: 1.2 },
      fill: { color: colors.white, transparency: 2 },
    })
    slide.addText(box.title, {
      x: box.x + 0.16,
      y: box.y + 0.18,
      w: box.w - 0.32,
      h: 0.24,
      fontFace: 'Arial',
      fontSize: 12.6,
      bold: true,
      color: colors.ink,
      margin: 0,
      align: 'center',
    })
    slide.addText(box.body, {
      x: box.x + 0.16,
      y: box.y + 0.5,
      w: box.w - 0.32,
      h: 0.24,
      fontFace: 'Arial',
      fontSize: 9.8,
      color: colors.muted,
      margin: 0,
      align: 'center',
    })
  })

  addBulletCard(
    slide,
    0.92,
    4.55,
    3.7,
    1.78,
    'ADK agent proof',
    [
      'Defined root agent',
      'Tool-backed workflows',
      'Stateful session execution',
    ],
    colors.leaf,
  )
  addBulletCard(
    slide,
    4.82,
    4.55,
    3.7,
    1.78,
    'Current tools',
    [
      'generate_quiz',
      'reteach_topic',
      'generate_parent_summary',
    ],
    colors.saffron,
  )
  addBulletCard(
    slide,
    8.72,
    4.55,
    3.7,
    1.78,
    'Cloud alignment',
    [
      'Cloud Build for deploys',
      'Cloud Run services live',
      'Track 1 stack matched directly',
    ],
    colors.sky,
  )
  finalize(slide)
}

{
  const slide = pptx.addSlide()
  addBackground(slide)
  addTitleBlock(
    slide,
    'IMPACT AND ROADMAP',
    'Why this MVP is strong now and expandable later',
    'The current version is intentionally small, affordable, and demo-ready. It solves a real problem first, then leaves room for deeper native audio and broader language support.'
  )
  addMetric(slide, 0.9, 2.7, 2.9, 'Immediate value', 'Hindi support, calm teaching, and mother-friendly summary from day one.', colors.saffron)
  addMetric(slide, 4.02, 2.7, 2.9, 'Affordable build', 'Cloud Run + Gemini Flash keeps the MVP cost low and practical.', colors.leaf)
  addMetric(slide, 7.14, 2.7, 2.9, 'Hackathon fit', 'Clear problem, simple demo, and direct Google Cloud alignment.', colors.sky)
  addMetric(slide, 10.26, 2.7, 2.1, 'Scale path', 'Native audio and progress tracking later.', colors.saffron)

  addBulletCard(
    slide,
    0.9,
    4.45,
    3.8,
    2.05,
    'What is already live',
    [
      'Deployed frontend',
      'Deployed ADK backend',
      'Real Gemini responses through Vertex AI',
    ],
    colors.leaf,
  )
  addBulletCard(
    slide,
    4.98,
    4.45,
    3.8,
    2.05,
    'Next product upgrades',
    [
      'Gemini Live native audio',
      'Progress history across sessions',
      'More class-wise topic packs',
    ],
    colors.saffron,
  )
  addBulletCard(
    slide,
    9.06,
    4.45,
    3.3,
    2.05,
    'Judge takeaway',
    [
      'Useful now',
      'Low-friction demo',
      'Clearly deployable',
    ],
    colors.sky,
  )
  finalize(slide)
}

{
  const slide = pptx.addSlide()
  addBackground(slide)
  addTitleBlock(
    slide,
    'DEMO AND LINKS',
    'How to present NanhiPathshala in under 2 minutes',
    'Open the live app, choose class and subject, ask a Hindi question, show the reteach flow, then end on the parent summary and architecture story.'
  )
  addBulletCard(
    slide,
    0.8,
    2.5,
    4.1,
    3.45,
    'Demo flow',
    [
      'Show Hindi-first mobile UI.',
      'Pick a class, subject, and child mood.',
      'Ask a simple topic question.',
      'Say “samajh nahi aaya” and show reteach behavior.',
      'Show practice prompts and mother summary.',
    ],
    colors.saffron,
  )
  addBulletCard(
    slide,
    5.15,
    2.5,
    3.18,
    3.45,
    'Live links',
    [
      'Web app: nanhipathshala-web-766923141169.us-central1.run.app',
      'Agent API: nanhipathshala-agent-766923141169.us-central1.run.app',
      'Docs: architecture, track fit, demo script, submission copy',
    ],
    colors.leaf,
  )
  addBulletCard(
    slide,
    8.58,
    2.5,
    3.95,
    3.45,
    'Closing line',
    [
      'NanhiPathshala gives Indian families a low-cost Hindi AI tutor that is patient, practical, and deployable today on Google Cloud.',
    ],
    colors.sky,
  )
  slide.addText('Thank you', {
    x: 0.82,
    y: 6.45,
    w: 1.6,
    h: 0.36,
    fontFace: 'Arial',
    fontSize: 18,
    bold: true,
    color: colors.ink,
    margin: 0,
  })
  finalize(slide)
}

pptx.writeFile({ fileName: outputPath })
