/**
 * @file lib/docx-extractor.ts
 * @description Zero-dependency server-side DOCX text extractor for CampusLit AI Mentor.
 * @purpose Parses .docx (OpenXML ZIP archive) using Node's built-in zlib to extract raw document text
 * without external npm dependencies or native binaries.
 */

import zlib from "zlib";

export interface DocxExtractionResult {
  success: boolean;
  text: string;
  error?: string;
}

/**
 * Extracts plain text from a base64-encoded or Buffer .docx file.
 * A .docx file is a standard PK zip archive containing `word/document.xml`.
 */
export function extractTextFromDocx(input: string | Buffer): DocxExtractionResult {
  try {
    const buffer = typeof input === "string" ? Buffer.from(input, "base64") : input;

    if (buffer.length < 30) {
      return { success: false, text: "", error: "File buffer is too small to be a valid DOCX document." };
    }

    // Verify ZIP magic bytes (PK\x03\x04 or 0x04034b50)
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
      return { success: false, text: "", error: "Invalid file signature: Not a valid ZIP/DOCX archive." };
    }

    let offset = 0;
    let documentXmlBuffer: Buffer | null = null;

    while (offset < buffer.length - 30) {
      // Look for local file header signature 0x04034b50 (PK\x03\x04)
      if (
        buffer[offset] === 0x50 &&
        buffer[offset + 1] === 0x4b &&
        buffer[offset + 2] === 0x03 &&
        buffer[offset + 3] === 0x04
      ) {
        const compressionMethod = buffer.readUInt16LE(offset + 8);
        const compressedSize = buffer.readUInt32LE(offset + 18);
        const uncompressedSize = buffer.readUInt32LE(offset + 22);
        const fileNameLen = buffer.readUInt16LE(offset + 26);
        const extraFieldLen = buffer.readUInt16LE(offset + 28);

        const fileNameStart = offset + 30;
        const fileNameEnd = fileNameStart + fileNameLen;
        if (fileNameEnd > buffer.length) break;

        const fileName = buffer.toString("utf8", fileNameStart, fileNameEnd);
        const dataStart = fileNameEnd + extraFieldLen;
        const dataEnd = dataStart + compressedSize;

        if (dataEnd > buffer.length) break;

        if (fileName === "word/document.xml") {
          const compressedData = buffer.subarray(dataStart, dataEnd);
          if (compressionMethod === 8) {
            // Deflate compression
            documentXmlBuffer = zlib.inflateRawSync(compressedData);
          } else if (compressionMethod === 0) {
            // Stored without compression
            documentXmlBuffer = compressedData;
          }
          break;
        }

        offset = dataEnd;
      } else {
        offset++;
      }
    }

    if (!documentXmlBuffer) {
      return {
        success: false,
        text: "",
        error: "Could not find word/document.xml inside DOCX archive.",
      };
    }

    const xmlContent = documentXmlBuffer.toString("utf8");

    // Extract text inside <w:t> tags and separate paragraphs (<w:p>) with newlines
    const paragraphs: string[] = [];
    const paragraphMatches = xmlContent.match(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g) || [xmlContent];

    for (const p of paragraphMatches) {
      const textMatches = p.match(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g);
      if (textMatches) {
        const pText = textMatches
          .map((m) => m.replace(/<[^>]+>/g, ""))
          .join("")
          .trim();
        if (pText.length > 0) {
          paragraphs.push(pText);
        }
      }
    }

    const fullText = paragraphs.join("\n\n").trim();
    return {
      success: true,
      text: fullText,
    };
  } catch (err: unknown) {
    return {
      success: false,
      text: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export interface PptxExtractionResult {
  success: boolean;
  text: string;
  slideCount?: number;
  error?: string;
}

/**
 * Extracts plain text from a base64-encoded or Buffer .pptx file.
 * A .pptx file is an OpenXML PK zip archive containing slide XMLs in `ppt/slides/slide{N}.xml`.
 */
export function extractTextFromPptx(input: string | Buffer): PptxExtractionResult {
  try {
    const buffer = typeof input === "string" ? Buffer.from(input, "base64") : input;

    if (buffer.length < 30) {
      return { success: false, text: "", error: "File buffer is too small to be a valid PPTX presentation." };
    }

    // Verify ZIP magic bytes (PK\x03\x04)
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
      return { success: false, text: "", error: "Invalid file signature: Not a valid ZIP/PPTX presentation." };
    }

    let offset = 0;
    const slides: Array<{ slideNum: number; text: string }> = [];

    while (offset < buffer.length - 30) {
      if (
        buffer[offset] === 0x50 &&
        buffer[offset + 1] === 0x4b &&
        buffer[offset + 2] === 0x03 &&
        buffer[offset + 3] === 0x04
      ) {
        const compressionMethod = buffer.readUInt16LE(offset + 8);
        const compressedSize = buffer.readUInt32LE(offset + 18);
        const fileNameLen = buffer.readUInt16LE(offset + 26);
        const extraFieldLen = buffer.readUInt16LE(offset + 28);

        const fileNameStart = offset + 30;
        const fileNameEnd = fileNameStart + fileNameLen;
        if (fileNameEnd > buffer.length) break;

        const fileName = buffer.toString("utf8", fileNameStart, fileNameEnd);
        const dataStart = fileNameEnd + extraFieldLen;
        const dataEnd = dataStart + compressedSize;

        if (dataEnd > buffer.length) break;

        const slideMatch = fileName.match(/ppt\/slides\/slide(\d+)\.xml/i);
        if (slideMatch) {
          const slideNum = parseInt(slideMatch[1], 10);
          const compressedData = buffer.subarray(dataStart, dataEnd);
          let xmlBuf: Buffer;
          if (compressionMethod === 8) {
            xmlBuf = zlib.inflateRawSync(compressedData);
          } else if (compressionMethod === 0) {
            xmlBuf = compressedData;
          } else {
            xmlBuf = compressedData;
          }

          const xmlContent = xmlBuf.toString("utf8");
          const paragraphs: string[] = [];
          const pMatches = xmlContent.match(/<a:p(?:\s[^>]*)?>[\s\S]*?<\/a:p>/g) || [xmlContent];
          for (const p of pMatches) {
            const tMatches = p.match(/<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/g);
            if (tMatches) {
              const pText = tMatches
                .map((m) => m.replace(/<[^>]+>/g, ""))
                .join("")
                .trim();
              if (pText.length > 0) {
                paragraphs.push(pText);
              }
            }
          }
          if (paragraphs.length > 0) {
            slides.push({ slideNum, text: paragraphs.join("\n") });
          }
        }

        offset = dataEnd;
      } else {
        offset++;
      }
    }

    if (slides.length === 0) {
      return {
        success: false,
        text: "",
        error: "No slides found inside PPTX presentation archive.",
      };
    }

    slides.sort((a, b) => a.slideNum - b.slideNum);
    const formatted = slides
      .map((s) => `[Slide ${s.slideNum}]\n${s.text}`)
      .join("\n\n");

    return {
      success: true,
      text: formatted,
      slideCount: slides.length,
    };
  } catch (err: unknown) {
    return {
      success: false,
      text: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Unified extractor for both DOCX and PPTX OpenXML formats.
 */
export function extractTextFromOffice(
  fileName: string,
  input: string | Buffer
): { success: boolean; text: string; error?: string } {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pptx")) {
    return extractTextFromPptx(input);
  }
  return extractTextFromDocx(input);
}
