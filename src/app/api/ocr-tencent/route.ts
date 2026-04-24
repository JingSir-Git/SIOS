// ============================================================
// API Route: /api/ocr-tencent — Tencent Cloud OCR (GeneralAccurateOCR)
// ============================================================
// Uses Tencent Cloud's high-accuracy general text recognition.
// Accepts base64 image data URL and returns recognized text lines.
// ============================================================

import { NextRequest } from "next/server";

// Use dynamic import to avoid issues with Tencent SDK in edge runtime
let _ocrClient: any = null;

async function getTencentOCRClient() {
  if (_ocrClient) return _ocrClient;

  const tencentcloud = require("tencentcloud-sdk-nodejs");
  const OcrClient = tencentcloud.ocr.v20181119.Client;

  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;

  if (!secretId || !secretKey) {
    throw new Error("未配置腾讯云 OCR 密钥。请在环境变量中设置 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY。");
  }

  _ocrClient = new OcrClient({
    credential: {
      secretId,
      secretKey,
    },
    region: "ap-shanghai",
    profile: {
      signMethod: "TC3-HMAC-SHA256",
      httpProfile: {
        reqMethod: "POST",
        reqTimeout: 30,
      },
    },
  });

  return _ocrClient;
}

/** Strip data URL prefix and return raw base64 string */
function stripDataURLPrefix(dataUrl: string): string {
  const match = dataUrl.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,([\s\S]+)$/);
  return match ? match[1] : dataUrl;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, imageUrl } = body;

    if (!image && !imageUrl) {
      return Response.json(
        { error: "image (base64 data URL) or imageUrl is required" },
        { status: 400 },
      );
    }

    const client = await getTencentOCRClient();

    // Build request params
    const params: Record<string, any> = {};

    if (image && typeof image === "string") {
      params.ImageBase64 = stripDataURLPrefix(image);
    } else if (imageUrl && typeof imageUrl === "string") {
      params.ImageUrl = imageUrl;
    }

    // Call Tencent Cloud GeneralAccurateOCR (高精度版)
    const result = await client.GeneralAccurateOCR(params);

    if (!result || !result.TextDetections) {
      return Response.json({ text: "", detections: [] });
    }

    // Extract text lines, ordered by position (top to bottom, left to right)
    const detections = result.TextDetections.map((d: any) => ({
      text: d.DetectedText,
      confidence: d.Confidence,
      polygon: d.ItemPolygon,
    }));

    // Join all detected text lines
    const text = result.TextDetections
      .map((d: any) => d.DetectedText)
      .join("\n");

    return Response.json({
      text,
      detections,
      angle: result.Angle,
    });
  } catch (err: unknown) {
    console.error("[Tencent OCR] Error:", err);
    const message = err instanceof Error ? err.message : "腾讯云OCR识别失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
