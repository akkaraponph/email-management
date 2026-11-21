"use client";

import { useState } from 'react';

interface SandboxedEmailPreviewProps {
  html: string;
  title: string;
  className?: string;
}

// An opaque-origin sandbox disables scripts, forms and access to the parent.
export default function SandboxedEmailPreview({ html, title, className }: SandboxedEmailPreviewProps) {
  const [showRemoteImages, setShowRemoteImages] = useState(false);
  const imageSources = showRemoteImages ? 'data: https:' : 'data:';
  const document = `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src ${imageSources}; font-src data:; base-uri 'none'; form-action 'none'"><meta name="referrer" content="no-referrer"></head><body>${html}</body></html>`;
  return <>
    <button type="button" onClick={() => setShowRemoteImages(!showRemoteImages)} aria-pressed={showRemoteImages} className="px-3 py-1 text-xs text-left underline">
      {showRemoteImages ? 'Block remote images' : 'Load remote images (contacts external hosts)'}
    </button>
    <iframe title={title} sandbox="" srcDoc={document} className={className} />
  </>;
}
