// ============================================================
// API Route: /api/ocr — Unified OCR endpoint
// ============================================================
// For chat/document modes: uses Tencent Cloud OCR (高精度版)
// For face/palm modes: uses LLM Vision (Anthropic SDK)
// ============================================================

import { NextRequest } from "next/server";
import { extractLLMConfig } from "@/lib/api-client";
import Anthropic from "@anthropic-ai/sdk";

// ---- Tencent Cloud OCR Client ----
let _tencentOcrClient: any = null;

async function getTencentOCRClient() {
  if (_tencentOcrClient) return _tencentOcrClient;

  const tencentcloud = require("tencentcloud-sdk-nodejs");
  const OcrClient = tencentcloud.ocr.v20181119.Client;

  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;

  if (!secretId || !secretKey) {
    throw new Error("未配置腾讯云 OCR 密钥");
  }

  _tencentOcrClient = new OcrClient({
    credential: { secretId, secretKey },
    region: "ap-shanghai",
    profile: {
      signMethod: "TC3-HMAC-SHA256",
      httpProfile: { reqMethod: "POST", reqTimeout: 30 },
    },
  });

  return _tencentOcrClient;
}

/** Strip data URL prefix and return raw base64 string */
function stripDataURLPrefix(dataUrl: string): string {
  const match = dataUrl.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,([\s\S]+)$/);
  return match ? match[1] : dataUrl;
}

/** Handle OCR via Tencent Cloud for text-heavy modes (chat, document, general) */
async function handleTencentOCR(image?: string, imageUrl?: string): Promise<string> {
  const client = await getTencentOCRClient();

  const params: Record<string, any> = {};
  if (image && typeof image === "string") {
    params.ImageBase64 = stripDataURLPrefix(image);
  } else if (imageUrl && typeof imageUrl === "string") {
    params.ImageUrl = imageUrl;
  }

  const result = await client.GeneralAccurateOCR(params);

  if (!result || !result.TextDetections || result.TextDetections.length === 0) {
    return "";
  }

  return result.TextDetections
    .map((d: any) => d.DetectedText)
    .join("\n");
}

// Cache clients to avoid re-creating
const ocrClientCache = new Map<string, Anthropic>();

function getOCRClient(config?: { baseURL?: string; apiKey?: string }): Anthropic {
  const baseURL = config?.baseURL || process.env.ANTHROPIC_BASE_URL || "https://api.minimaxi.com/anthropic";
  const apiKey = config?.apiKey || process.env.ANTHROPIC_API_KEY || "";
  if (!apiKey) throw new Error("未配置API Key。请在设置中填写API Key。");

  const cacheKey = `${baseURL}::${apiKey.slice(0, 8)}`;
  let client = ocrClientCache.get(cacheKey);
  if (!client) {
    client = new Anthropic({ baseURL, apiKey });
    ocrClientCache.set(cacheKey, client);
  }
  return client;
}

const OCR_PROMPTS: Record<string, string> = {
  chat: `你是一个专业的聊天记录识别助手。请仔细识别图片中的聊天对话内容，按照以下格式输出：

格式要求：
- 每条消息一行
- 格式: "发送者: 消息内容"
- 如果能识别出时间戳，附在行末用括号标注
- 保持消息的原始顺序
- 如有表情包/图片消息，用 [表情] 或 [图片] 标注
- 如果是微信/QQ等聊天截图，请准确区分左右两方的消息

请直接输出识别结果，不要加任何解释。`,

  document: `你是一个专业的文档OCR识别助手。请仔细识别图片中的所有文字内容，保持原文的格式和排版。
如有表格，请用Markdown表格格式输出。
请直接输出识别结果，不要加任何解释。`,

  face: `你是一个面相分析描述助手。请仔细观察图片中的人脸特征，客观描述以下内容：
1. 面部轮廓（脸型：方脸/圆脸/瓜子脸/国字脸等）
2. 五官特征（眉形、眼型、鼻形、嘴型、耳形）
3. 额头特征（宽窄、高低、饱满度）
4. 面部比例
5. 气色和肤质印象
6. 其他显著面相特征

请用客观描述的方式输出，作为后续面相分析的输入依据。不要给出任何吉凶判断。`,

  palm: `你是一个手相描述助手。请仔细观察图片中的手掌，客观描述以下内容：
1. 手掌大小和形状
2. 三条主线（生命线、智慧线、感情线）的走向、长度、深浅、分支
3. 事业线（如有）的特征
4. 手指长短比例
5. 掌丘的饱满度（金星丘、木星丘、土星丘等）
6. 其他可见纹路和特征

请用客观描述的方式输出，作为后续手相分析的输入依据。不要给出任何吉凶判断。`,

  general: `请识别图片中的所有文字和重要视觉信息，完整输出。`,
};

const MODE_TEXTS: Record<string, string> = {
  chat: "请识别这张聊天截图中的对话内容",
  face: "请描述这张照片中的面部特征",
  palm: "请描述这张照片中的手掌特征",
  document: "请识别这张文档中的文字内容",
  general: "请识别这张图片中的内容",
};

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

/** Parse a data-URL into media_type + raw base64 string */
function parseDataURL(dataUrl: string): { media_type: ImageMediaType; data: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if (!match) return null;

  // Normalise MIME to the subset Anthropic SDK accepts
  let mime = match[1].toLowerCase();
  if (mime === "image/jpg") mime = "image/jpeg";
  const allowed: ImageMediaType[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowed.includes(mime as ImageMediaType)) mime = "image/jpeg"; // safe fallback

  return { media_type: mime as ImageMediaType, data: match[2] };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, mode = "general", imageUrl } = body;

    if (!image && !imageUrl) {
      return Response.json(
        { error: "image (base64 data URL) or imageUrl field is required" },
        { status: 400 },
      );
    }

    // ---- Tencent Cloud OCR for text-heavy modes ----
    const tencentModes = ["chat", "document", "general"];
    if (tencentModes.includes(mode)) {
      try {
        const text = await handleTencentOCR(image, imageUrl);
        return Response.json({ text, mode, provider: "tencent" });
      } catch (tencentErr: any) {
        console.error("[OCR] Tencent OCR failed, falling back to LLM:", tencentErr?.message);
        // Fall through to LLM-based OCR as fallback
      }
    }

    // ---- LLM Vision for face/palm or Tencent fallback ----
    const llmConfig = extractLLMConfig(request);
    const client = getOCRClient(llmConfig);
    const model = llmConfig.model || process.env.ANTHROPIC_MODEL || "MiniMax-M2.7-highspeed";

    const systemPrompt = OCR_PROMPTS[mode] || OCR_PROMPTS.general;
    const userText = MODE_TEXTS[mode] || MODE_TEXTS.general;

    // Build Anthropic-native content blocks
    const contentBlocks: Anthropic.ContentBlockParam[] = [];

    if (image && typeof image === "string") {
      const parsed = parseDataURL(image);
      if (parsed) {
        contentBlocks.push({
          type: "image",
          source: { type: "base64", media_type: parsed.media_type, data: parsed.data },
        });
      } else {
        return Response.json(
          { error: "Invalid image format. Expected base64 data URL (data:image/...;base64,...)" },
          { status: 400 },
        );
      }
    } else if (imageUrl && typeof imageUrl === "string") {
      // For URL-based images, download and convert to base64
      try {
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) throw new Error("Fetch failed");
        const buf = Buffer.from(await imgRes.arrayBuffer());
        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        let mime = contentType.split(";")[0].trim().toLowerCase();
        if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mime)) mime = "image/jpeg";
        contentBlocks.push({
          type: "image",
          source: { type: "base64", media_type: mime as ImageMediaType, data: buf.toString("base64") },
        });
      } catch (fetchErr) {
        console.error("[OCR] Failed to fetch imageUrl:", fetchErr);
        return Response.json({ error: "无法下载图片URL" }, { status: 400 });
      }
    } else {
      return Response.json({ error: "Invalid image input" }, { status: 400 });
    }

    contentBlocks.push({ type: "text", text: userText });

    // Use Anthropic SDK — goes through MiniMax's native Anthropic-compatible endpoint
    const response = await client.messages.create({
      model,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: contentBlocks }],
    });

    let text = "";
    for (const block of response.content) {
      if (block.type === "text") text += block.text;
    }

    // Strip <think> reasoning blocks
    text = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    return Response.json({ text, mode });
  } catch (err: unknown) {
    console.error("[OCR API] Error:", err);
    const message = err instanceof Error ? err.message : "OCR识别失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
