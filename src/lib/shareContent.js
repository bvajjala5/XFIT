/**
 * Share text, a link and optionally a file using the device share sheet.
 * Falls back to the clipboard (and an image download, when supplied) so the
 * button still does something useful on desktop browsers without navigator.share.
 */
export async function shareContent({ title, text, url, files, downloadDataUrl, downloadName }) {
  const base = typeof window !== 'undefined' ? window.location.href : 'https://xfit-bpe.pages.dev/';
  const absoluteUrl = url ? new URL(url, base).href : undefined;

  const shareData = { title, text };

  if (files?.length && typeof navigator !== 'undefined') {
    try {
      if (!navigator.canShare || navigator.canShare({ files })) shareData.files = files;
    } catch {
      // Some browsers throw for files they cannot inspect; share text instead.
    }
  }

  if (absoluteUrl) {
    // Chrome rejects a URL field alongside files. Keep the link in the text so
    // image shares still give recipients something to open.
    if (shareData.files) shareData.text = [text, absoluteUrl].filter(Boolean).join('\n');
    else shareData.url = absoluteUrl;
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      // Called before any await so the browser's transient user activation is
      // still valid. Awaiting image work here is what used to break sharing.
      await navigator.share(shareData);
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'aborted';
      // Fall through to clipboard on permission/activation errors.
    }
  }

  const copyText = [text, absoluteUrl].filter(Boolean).join('\n');
  const copied = await copyTextToClipboard(copyText);

  if (copied && downloadDataUrl) triggerDownload(downloadDataUrl, downloadName || 'uttar-workout.png');
  return copied ? 'copied' : 'failed';
}

async function copyTextToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Try the older selection-based path below.
  }
  try {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand('copy');
    field.remove();
    return ok;
  } catch {
    return false;
  }
}

function triggerDownload(dataUrl, filename) {
  try {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch {
    // The clipboard copy already succeeded; a blocked download is not fatal.
  }
}

/** Turn a canvas data URL into a File for native image sharing. */
export function dataUrlToFile(dataUrl, filename = 'uttar-workout.png') {
  try {
    const [header, encoded] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new File([bytes], filename, { type: mime });
  } catch {
    return null;
  }
}
