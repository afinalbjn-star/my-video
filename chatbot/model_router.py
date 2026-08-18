# model_router.py
"""
Model Router dengan auto-failover untuk OpenRouter free tier.
Jika satu model terkena rate limit / limit kuota, otomatis pindah
ke model gratis lain yang tersedia.
"""

import os
import time
import threading
import requests
from typing import List, Dict, Optional

# Daftar model gratis (free tier) OpenRouter yang tersedia untuk dipilih user.
# List ini diverifikasi pertengahan 2026; model :free bisa berubah-ubah,
# jadi router otomatis melewati model yang error/limit.
FREE_MODELS: List[Dict[str, str]] = [
    {
        "id": "openrouter/free",
        "label": "🌀 Auto (OpenRouter free)",
        "desc": "Router otomatis: pilih model gratis yang tersedia",
    },
    {
        "id": "meta-llama/llama-3.3-70b-instruct:free",
        "label": "🦙 Llama 3.3 70B (Meta)",
        "desc": "Generalist, good untuk chat & reasoning",
    },
    {
        "id": "qwen/qwen3-coder:free",
        "label": "🧩 Qwen3 Coder",
        "desc": "Terbaik gratis untuk coding",
    },
    {
        "id": "openai/gpt-oss-120b:free",
        "label": "🟢 GPT-OSS 120B (OpenAI)",
        "desc": "Coding & reasoning berat",
    },
    {
        "id": "openai/gpt-oss-20b:free",
        "label": "🟢 GPT-OSS 20B (OpenAI)",
        "desc": "Cepat, tugas coding ringan",
    },
    {
        "id": "z-ai/glm-4.5-air:free",
        "label": "🔷 GLM-4.5-Air (Z.ai)",
        "desc": "Umum & reasoning, ringan",
    },
    {
        "id": "poolside/laguna-m.1:free",
        "label": "🏖️ Laguna M.1 (Poolside)",
        "desc": "Coding agent",
    },
    {
        "id": "poolside/laguna-xs.2:free",
        "label": "🏖️ Laguna XS.2 (Poolside)",
        "desc": "Coding agent ringan",
    },
    {
        "id": "nvidia/nemotron-3-super-120b-a12b:free",
        "label": "💎 Nemotron 3 Super (NVIDIA)",
        "desc": "1M context, reasoning besar",
    },
    {
        "id": "nvidia/nemotron-3-ultra-550b-a55b:free",
        "label": "💎 Nemotron 3 Ultra (NVIDIA)",
        "desc": "1M context, agent task",
    },
    {
        "id": "nvidia/nemotron-3-nano-30b-a3b:free",
        "label": "💎 Nemotron 3 Nano (NVIDIA)",
        "desc": "Cepat, tugas umum",
    },
    {
        "id": "google/gemma-4-31b-it:free",
        "label": "🪷 Gemma 4 31B (Google)",
        "desc": "Multimodal + teks",
    },
    {
        "id": "google/gemma-4-26b-a4b-it:free",
        "label": "🪷 Gemma 4 26B (Google)",
        "desc": "Multimodal ringan",
    },
    {
        "id": "moonshotai/kimi-k2.6:free",
        "label": "🌙 Kimi K2.6 (Moonshot)",
        "desc": "Reasoning & agent task",
    },
    {
        "id": "nousresearch/hermes-3-llama-3.1-405b:free",
        "label": "🧠 Hermes 3 405B",
        "desc": "Generalist besar",
    },
    {
        "id": "cohere/north-mini-code:free",
        "label": "🌿 North Mini Code (Cohere)",
        "desc": "Coding",
    },
    {
        "id": "liquid/lfm-2.5-2.6b:free",
        "label": "💧 LFM2.5 (Liquid)",
        "desc": "Sangat ringan",
    },
]

# model ID yang belum lama ini terdaftar namun tetap dicoba sebagai fallback
EXTRA_FREE_MODELS: List[Dict[str, str]] = [
    {
        "id": "nvidia/nemotron-3.5-lightning:free",
        "label": "⚡ Nemotron 3.5 Lightning",
        "desc": "Cepat",
    },
    {
        "id": "nvidia/nemotron-nano-9b-v2:free",
        "label": "💎 Nemotron Nano 9B V2",
        "desc": "Ringan",
    },
    {
        "id": "inclusionai/ling-3.0-tiny:free",
        "label": "🧬 Ling 3.0 Tiny",
        "desc": "Sangat ringan",
    },
]

ALL_MODELS: List[Dict[str, str]] = FREE_MODELS + EXTRA_FREE_MODELS


class ModelRouter:
    """Memilih model gratis, dengan auto-failover saat kena limit/error."""

    def __init__(self, api_key: str, base_url: str = "https://openrouter.ai/api/v1/chat/completions"):
        self.api_key = api_key
        self.base_url = base_url
        self._lock = threading.Lock()
        # model_id -> timestamp kapan boleh dipakai lagi (cooldown)
        self._cooldown: Dict[str, float] = {}
        # model_id -> jumlah kegagalan berurutan (untuk backoff)
        self._fail_count: Dict[str, int] = {}
        self._stats: Dict[str, Dict] = {}

    # ── Statistik & status ──
    def list_models(self) -> List[Dict]:
        now = time.time()
        with self._lock:
            return [
                {
                    **m,
                    "cooldown": max(0, int(self._cooldown.get(m["id"], 0) - now)),
                    "fails": self._fail_count.get(m["id"], 0),
                    "used": self._stats.get(m["id"], {}).get("used", 0),
                    "last_error": self._stats.get(m["id"], {}).get("error", ""),
                }
                for m in ALL_MODELS
            ]

    def _mark_ok(self, model_id: str):
        with self._lock:
            self._cooldown.pop(model_id, None)
            self._fail_count[model_id] = 0
            st = self._stats.setdefault(model_id, {"used": 0, "error": ""})
            st["used"] += 1
            st["error"] = ""

    def _mark_fail(self, model_id: str, reason: str, cooldown: Optional[int] = None):
        with self._lock:
            self._fail_count[model_id] = self._fail_count.get(model_id, 0) + 1
            # cooldown makin lama tiap gagal beruntun: 30s -> 60s -> 120s -> 300s
            if cooldown is None:
                cooldown = min(300, 30 * (2 ** self._fail_count[model_id]))
            self._cooldown[model_id] = time.time() + cooldown
            st = self._stats.setdefault(model_id, {"used": 0, "error": ""})
            st["error"] = reason[:200]

    def _is_available(self, model_id: str) -> bool:
        with self._lock:
            return self._cooldown.get(model_id, 0) <= time.time()

    # ── Logika auto-failover ──
    def call(self, messages: List[Dict], preferred: Optional[str] = None,
             temperature: float = 0.7, timeout: int = 120, max_attempts: int = 8) -> Dict:
        """
        Panggil model gratis dengan failover. Mengembalikan dict:
          { ok: bool, content: str, model: str, attempts: int, error: str }
        - 'preferred' opsional: model yang diinginkan user. Jika limit,
          router otomatis pindah ke model lain.
        - Urutan: preferred -> "openrouter/free" -> model lain yang belum cooldown.
        - Maksimal max_attempts percobaan per panggilan agar respons tetap cepat.
        """
        order: List[str] = []
        if preferred:
            order.append(preferred)
        order.append("openrouter/free")
        for m in FREE_MODELS:
            if m["id"] not in order:
                order.append(m["id"])
        for m in EXTRA_FREE_MODELS:
            if m["id"] not in order:
                order.append(m["id"])

        errors: List[str] = []
        attempts = 0
        for model_id in order:
            if not self._is_available(model_id):
                continue
            if attempts >= max_attempts:
                break
            attempts += 1
            result = self._call_once(model_id, messages, temperature, timeout)
            if result["ok"]:
                self._mark_ok(model_id)
                return {
                    "ok": True,
                    "content": result["content"],
                    "model": model_id,
                    "attempts": attempts,
                    "error": "",
                }
            errors.append(f"{model_id}: {result['error']}")
            # Auth error (401/403): semua model pasti gagal, jangan coba sisanya
            if result["error"].startswith("auth"):
                self._mark_fail(model_id, result["error"], cooldown=5)
                return {
                    "ok": False,
                    "content": "❌ Kunci API OpenRouter tidak valid. Periksa OPENROUTER_API_KEY di .env.",
                    "model": model_id,
                    "attempts": attempts,
                    "error": result["error"],
                }
            self._mark_fail(model_id, result["error"])

        msg = "Semua model gratis sedang limit/error. Coba lagi beberapa saat, atau tunggu cooldown.\n\n"
        msg += "\n".join(f"• {e}" for e in errors[:5])
        return {
            "ok": False,
            "content": msg,
            "model": preferred or "openrouter/free",
            "attempts": attempts,
            "error": "; ".join(errors[:3]),
        }

    def _call_once(self, model_id: str, messages: List[Dict],
                   temperature: float, timeout: int) -> Dict:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model_id,
            "messages": messages,
            "temperature": temperature,
        }
        try:
            resp = requests.post(self.base_url, headers=headers, json=payload, timeout=timeout)
        except requests.RequestException as e:
            return {"ok": False, "error": f"network error: {str(e)[:100]}"}

        if resp.status_code == 200:
            try:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return {"ok": True, "content": content}
            except Exception as e:
                return {"ok": False, "error": f"parse error: {str(e)[:100]}"}

        # Rate limit / quota / unavailable
        err_text = resp.text[:200].replace("\n", " ")
        if resp.status_code in (401, 403):
            return {"ok": False, "error": f"auth ({resp.status_code}): {err_text}"}
        if resp.status_code in (429, 402):
            return {"ok": False, "error": f"limit/quota ({resp.status_code}): {err_text}"}
        return {"ok": False, "error": f"HTTP {resp.status_code}: {err_text}"}


# Singleton router yang dipakai di seluruh app
_router: Optional[ModelRouter] = None
_router_lock = threading.Lock()


def get_router(api_key: str) -> ModelRouter:
    global _router
    with _router_lock:
        if _router is None:
            _router = ModelRouter(api_key)
        elif _router.api_key != api_key:
            _router = ModelRouter(api_key)
        return _router