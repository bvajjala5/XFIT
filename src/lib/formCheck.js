import { callAI } from './ai'

const SYSTEM = `You are an expert strength and mobility coach reviewing one still frame from a user's phone camera.
Assess only what is visible: body position, joint alignment, range of motion, stance, and any obvious safety risk.
Reply in under 70 words. Start with either "Looks good" or "Adjust", then give at most three short, specific cues.
If the person is not clearly visible, or the frame does not show the exercise, say that plainly and ask them to step back so their whole body is in frame.
Never diagnose injuries or give medical advice. Do not mention that this is an image or a still frame.`

export function buildFormPrompt(exerciseName) {
  return `Exercise: ${exerciseName || 'this exercise'}.\nReview my form from this camera frame.`
}

/**
 * Send one compressed camera frame to the AI coach. Mock responses are disabled:
 * a fake "form check" would be worse than an honest error.
 */
export async function analyzeForm(exerciseName, imageDataUrl) {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(String(imageDataUrl || ''))
  if (!match) throw new Error('Could not read the camera image.')

  return callAI({
    system: SYSTEM,
    messages: [{ role: 'user', content: buildFormPrompt(exerciseName) }],
    image: { mimeType: match[1], data: match[2] },
    maxTokens: 320,
    allowMock: false,
  })
}
