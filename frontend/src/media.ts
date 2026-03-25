export type AgentInlinePart = {
  inlineData: {
    mimeType: string
    data: string
  }
}

function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read the image file.'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load the selected image.'))
    image.src = src
  })
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result)
      const commaIndex = result.indexOf(',')
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result)
    }
    reader.onerror = () => reject(new Error('Could not convert the image.'))
    reader.readAsDataURL(blob)
  })
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not process the image.'))
          return
        }

        resolve(blob)
      },
      'image/jpeg',
      0.86,
    )
  })
}

export async function prepareImagePart(file: File): Promise<{
  part: AgentInlinePart
  previewUrl: string
}> {
  const sourceUrl = await fileToDataUrl(file)
  const image = await loadImage(sourceUrl)
  const maxSide = 1400
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Could not open the image canvas.')
  }

  context.drawImage(image, 0, 0, width, height)
  const blob = await canvasToBlob(canvas)
  const data = await blobToBase64(blob)

  return {
    part: {
      inlineData: {
        mimeType: 'image/jpeg',
        data,
      },
    },
    previewUrl: URL.createObjectURL(blob),
  }
}
