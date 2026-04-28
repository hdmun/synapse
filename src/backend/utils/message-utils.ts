export function extractMessageSummary(content: any, maxLength: number = 80): string | undefined {
  if (!content) return undefined;

  const findText = (obj: any): string | null => {
    if (!obj) return null;
    if (typeof obj === 'string') return obj;
    if (obj.text && typeof obj.text === 'string') return obj.text;
    if (obj.content && typeof obj.content === 'string') return obj.content;
    if (Array.isArray(obj.parts)) {
      for (const part of obj.parts) {
        const t = findText(part);
        if (t) return t;
      }
    }
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const t = findText(item);
        if (t) return t;
      }
    }
    if (typeof obj === 'object') {
      return obj.text || obj.content || null;
    }
    return null;
  };

  let text: string | null = null;
  
  if (typeof content === 'string') {
    try {
      if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        text = findText(JSON.parse(content));
      } else {
        text = content;
      }
    } catch (e) {
      text = content;
    }
  } else {
    text = findText(content);
  }

  if (!text) {
    text = typeof content === 'string' ? content : JSON.stringify(content);
  }

  if (!text) return undefined;

  let summary = String(text).replace(/\s+/g, ' ').trim();
  if (summary.length > maxLength) {
    summary = summary.slice(0, maxLength) + '...';
  }
  
  return summary;
}
