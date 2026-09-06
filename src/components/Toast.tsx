'use client';

import { useEffect, useCallback } from 'react';

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function toast(msg: string) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('toast');
  if (!el) return;
  if (toastTimer) clearTimeout(toastTimer);
  el.textContent = msg;
  el.classList.add('on');
  toastTimer = setTimeout(() => el.classList.remove('on'), 2600);
}

export function Toast() {
  return null; // Toast uses portal-style DOM manipulation via toast()
}
