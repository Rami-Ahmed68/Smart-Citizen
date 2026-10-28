import { CohereClientV2 } from "cohere-ai";
import sharp from "sharp";
import { ApiError } from "../utils/error/ApiError.js";

const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY,
});

const MAX_PIXELS = 18_000_000;
const MAX_DIMENSION = 2500;

async function prepareImageForCohere(imagePath) {
  const metadata = await sharp(imagePath).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const totalPixels = width * height;

  console.log(
    "🔍 [SHARP] Original:",
    width,
    "x",
    height,
    "=",
    totalPixels,
    "pixels",
  );

  let pipeline = sharp(imagePath);

  if (
    totalPixels > MAX_PIXELS ||
    width > MAX_DIMENSION ||
    height > MAX_DIMENSION
  ) {
    console.log("🔍 [SHARP] Resizing...");
    pipeline = pipeline.resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });
  } else {
    console.log("🔍 [SHARP] No resize needed");
  }

  const buffer = await pipeline.jpeg({ quality: 85 }).toBuffer();

  const newMeta = await sharp(buffer).metadata();
  console.log(
    "🔍 [SHARP] After:",
    newMeta.width,
    "x",
    newMeta.height,
    "=",
    newMeta.width * newMeta.height,
    "pixels",
  );

  return buffer.toString("base64");
}

export async function analyzeCitizenPhoto(imagePath) {
  try {
    const imageBase64 = await prepareImageForCohere(imagePath);
    const imageDataUri = `data:image/jpeg;base64,${imageBase64}`;

    const response = await cohere.chat({
      model: "command-a-vision-07-2025",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a strict face verification system for a citizen registry.

Analyze this image and answer ONLY about the FACE, not the body.

Return ONLY this JSON (no explanation, no markdown):
{
  "has_face": true or false,
  "face_visible": true or false,
  "gender": "male" or "female" or "unknown",
  "estimated_age": integer or null,
  "reason": "brief reason in English (max 10 words)"
}

STRICT RULES:
- "has_face" = true ONLY if a clear human FACE (eyes, nose, mouth) is visible.
- If the image shows only a body, torso, hand, back of head, or clothing WITHOUT a visible face → has_face = false.
- "face_visible" = true only if the face is clear enough to identify the person (not covered, not too blurry, not too far away).
- If has_face is false → gender = "unknown", estimated_age = null.
- Be strict. When in doubt, set has_face = false.`,
            },
            {
              type: "image_url",
              imageUrl: {
                url: imageDataUri,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(response.message.content[0].text);

    if (analysis.reason) {
      console.log(`🔍 Cohere reason: ${analysis.reason}`);
    }
    console.log(
      `🔍 Cohere result → has_face: ${analysis.has_face}, face_visible: ${analysis.face_visible}`,
    );

    const faceDetected = Boolean(analysis.has_face && analysis.face_visible);

    return {
      hasHuman: faceDetected,
      gender: faceDetected ? analysis.gender || "unknown" : "unknown",
      estimatedAge: faceDetected
        ? typeof analysis.estimated_age === "number"
          ? analysis.estimated_age
          : null
        : null,
      confidence: 0.8,
      embedding: null,
    };
  } catch (error) {
    console.error("🔴 COHERE ANALYZE ERROR:", error.message);
    console.error("🔴 FULL ERROR:", error);

    throw new ApiError(
      {
        en: "Failed to analyze the photo. Please try again.",
        ar: "فشل تحليل الصورة. يرجى المحاولة مرة أخرى.",
      },
      500,
    );
  }
}
