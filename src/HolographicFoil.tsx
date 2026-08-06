import { useRef, useEffect } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * HolographicFoil — background iridescent / hologram foil premium.
 *
 * Lapisan shading (high-end look):
 *  1. Dual-domain warping FBM        → lipatan foil kaya & organik
 *  2. Pseudo-normal dari gradien     → permukaan 3D untuk pencahayaan
 *  3. Thin-film interference spectral → warna pelangi fisik (wavelength → RGB)
 *  4. 3-point specular (key/fill/rim) → kilau logam multi-sumber
 *  5. Fresnel rim glow               → cahaya tepi pada sudut pelik
 *  6. Caustic filaments              → filamen cahaya mengalir
 *  7. Sparkle micro-highlights       → titik kilau berkelap-kelip
 *  8. Bloom pass (downsample+blur)   → glow sinematik
 *  9. ACES filmic tonemap + grain    → warna & tekstur film mahal
 *
 * Semua dependensi waktu pakai cos/sin(loopT) (gerakan melingkar) sehingga
 * frame pertama == frame terakhir → SEAMLESS LOOP.
 */
export const HolographicFoil: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bloomRef = useRef<HTMLCanvasElement | null>(null);
    const grainRef = useRef<HTMLCanvasElement | null>(null);
    const frame = useCurrentFrame();
    const { width, height, durationInFrames } = useVideoConfig();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // ── Offscreen bloom canvas (dibuat sekali, dipakai ulang) ──
        if (!bloomRef.current) bloomRef.current = document.createElement('canvas');
        const bc = bloomRef.current;
        const BW = Math.max(2, Math.round(width / 6));
        const BH = Math.max(2, Math.round(height / 6));
        bc.width = BW; bc.height = BH;

        // ── Perlin noise boilerplate ──────────────────────────────
        const perm = new Uint8Array(512);
        const gradX = new Float32Array(256);
        const gradY = new Float32Array(256);
        let seed = 91;
        const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        for (let i = 0; i < 256; i++) { const a = rng() * Math.PI * 2; gradX[i] = Math.cos(a); gradY[i] = Math.sin(a); }
        for (let i = 255; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
        for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
        const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
        const lerp = (a: number, b: number, t: number) => a + t * (b - a);
        const dot = (gi: number, x: number, y: number) => gradX[gi] * x + gradY[gi] * y;
        const noise2D = (x: number, y: number) => {
            const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
            const xf = x - Math.floor(x), yf = y - Math.floor(y);
            const u = fade(xf), v = fade(yf);
            const aa = perm[perm[X] + Y], ab = perm[perm[X] + Y + 1], ba = perm[perm[X + 1] + Y], bb = perm[perm[X + 1] + Y + 1];
            return lerp(lerp(dot(aa, xf, yf), dot(ba, xf - 1, yf), u), lerp(dot(ab, xf, yf - 1), dot(bb, xf - 1, yf - 1), u), v);
        };
        const fbm = (x: number, y: number, oct = 4) => {
            let v = 0, a = 0.5, f = 1;
            for (let i = 0; i < oct; i++) { v += a * noise2D(x * f, y * f); a *= 0.5; f *= 2; }
            return v;
        };
        const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

        // ── Spektrum cahaya: panjang gelombang (nm) → RGB ─────────
        // (algoritma Bruton) → iridescence fisik, bukan palette biasa.
        const wavelengthToRGB = (w: number): [number, number, number] => {
            let r = 0, g = 0, b = 0;
            if (w >= 380 && w < 440) { r = -(w - 440) / 60; b = 1; }
            else if (w >= 440 && w < 490) { g = (w - 440) / 50; b = 1; }
            else if (w >= 490 && w < 510) { g = 1; b = -(w - 510) / 20; }
            else if (w >= 510 && w < 580) { r = (w - 510) / 70; g = 1; }
            else if (w >= 580 && w < 645) { r = 1; g = -(w - 645) / 65; }
            else if (w >= 645 && w <= 780) { r = 1; }
            let f = 1;
            if (w < 420) f = 0.3 + 0.7 * (w - 380) / 40;
            else if (w > 700) f = 0.3 + 0.7 * (780 - w) / 80;
            return [r * f, g * f, b * f];
        };

        // ── ACES filmic tonemap → warna sinematik kaya ────────────
        const aces = (x: number) => {
            const a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
            return clamp01((x * (a * x + b)) / (x * (c * x + d) + e));
        };

        // ── Loop timing (multi-harmonik → aliran kaya & seamless) ─
        const TAU = Math.PI * 2;
        const loopT = (frame / durationInFrames) * TAU;
        // Harmonik integer: cos(k·loopT) identik di frame 0 & akhir → seamless,
        // tapi gabungan beberapa harmonik menghasilkan morf organik (bukan wobble).
        const c1 = Math.cos(loopT),     s1 = Math.sin(loopT);
        const c2 = Math.cos(2 * loopT), s2 = Math.sin(2 * loopT);
        const c3 = Math.cos(3 * loopT), s3 = Math.sin(3 * loopT);
        // Vektor aliran besar (amplitude ~0.6) → foil benar-benar mengalir
        const fx = 0.34 * c1 + 0.17 * c2 + 0.09 * c3;
        const fy = 0.34 * s1 + 0.17 * s2 + 0.09 * s3;
        const eps = 1 / width;

        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const nx = x / width, ny = y / height;

                // (1) Dual-domain warp → crumpled foil yang MENGALIR & MORF
                const wx = fbm(nx * 1.5 + fx * 1.2, ny * 1.5 + fy * 1.2, 4);
                const wy = fbm(nx * 1.5 + fx * 1.2 + 5.2, ny * 1.5 - fy * 1.2 + 1.3, 4);
                const wx2 = fbm(nx * 4.5 + wx * 2 + fx * 0.7, ny * 4.5 + wy * 2 + fy * 0.7, 3);
                const wy2 = fbm(nx * 4.5 + wy * 2 - fx * 0.7 + 9.1, ny * 4.5 + wx * 2 + fy * 0.7 + 3.7, 3);

                // (2) Tinggi permukaan + gradien → pseudo-normal 3D
                const field = (cx: number, cy: number) =>
                    fbm(cx * 3.2 + wx * 1.8 + wx2 * 0.6, cy * 3.2 + wy * 1.8 + wy2 * 0.6, 4);
                const h = field(nx, ny);
                const hx = field(nx + eps, ny);
                const hy = field(nx, ny + eps);
                const gx = (h - hx) / eps;
                const gy = (h - hy) / eps;
                const gz = 1.0; // kedalaman → sebaran highlight
                const nl = Math.hypot(gx, gy, gz);
                const nxn = gx / nl, nyn = gy / nl, nzn = gz / nl;

                const ndotv = Math.max(0, nzn);            // menghadap kamera
                const fres = Math.pow(1 - ndotv, 5);       // (5) fresnel rim

                // (3) Thin-film interference → warna spektral dari ketebalan & sudut
                const thickness = (h * 0.5 + 0.5) * 1.8 + (1 - ndotv) * 0.9;
                // geser 1 siklus penuh selama loop (frame/total = 0→1) → seamless
                const t01 = (thickness + frame / durationInFrames) % 1;
                const wavelength = 380 + ((t01 + 1) % 1) * 400;
                const [irR, irG, irB] = wavelengthToRGB(wavelength);

                // (4) 3-point specular (key / fill / rim) dengan ketajaman berbeda
                const spec = (lx: number, ly: number, lz: number, sharp: number) =>
                    Math.pow(Math.max(0, nxn * lx + nyn * ly + nzn * lz), sharp);
                const sKey = spec(0.5, -0.4, 0.77, 90);   // cahaya utama lembut
                const sFill = spec(-0.6, 0.35, 0.72, 50);  // isi
                const sRim = spec(0.15, 0.6, 0.79, 250);   // kilau tajam tepi

                // Streak anisotropik: kilau memanjang sepanjang aliran warp & menyapu
                const streakA = Math.max(0, wx2);
                const streakB = Math.max(0, wy2);
                const streak = Math.pow(streakA * 0.5 + streakB * 0.5, 3) * (0.6 + 0.4 * Math.sin(loopT * 2 + h * 8));

                // (6) Caustic filaments — filamen cahaya mengalir & morf
                const causticN = fbm(nx * 6 + fx * 2.5, ny * 6 + fy * 2.5, 3);
                const caustic = Math.pow(Math.max(0, causticN), 5) * 0.5;

                // (7) Sparkle micro-highlights (hash berkelap-kelip)
                const sp = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
                const sv = sp - Math.floor(sp);
                const sparkle = sv > 0.9985 ? Math.pow(0.5 + 0.5 * Math.cos(loopT * 2 + sv * 100), 4) * 1.5 : 0;

                // Diffuse base metal
                const diff = Math.max(0, nzn * 0.6 + 0.4);

                // ── Compose HDR (boleh > 1, ditonemap) ──
                let r = irR * (0.25 + 0.75 * diff) + sKey * 1.3 + sFill * 0.7 + streak * 0.5 + caustic * 0.8 + fres * 0.35 + sparkle;
                let g = irG * (0.25 + 0.75 * diff) + sKey * 1.3 + sFill * 0.7 + streak * 0.5 + caustic * 0.9 + fres * 0.45 + sparkle;
                let b = irB * (0.25 + 0.75 * diff) + sKey * 1.3 + sFill * 0.7 + streak * 0.6 + caustic * 1.0 + fres * 0.6 + sparkle;

                // Boost + ACES tonemap (sinematik)
                r = aces(r * 1.25 + sRim * 0.4);
                g = aces(g * 1.25 + sRim * 0.45);
                b = aces(b * 1.25 + sRim * 0.6);

                data[idx] = r * 255;
                data[idx + 1] = g * 255;
                data[idx + 2] = b * 255;
                data[idx + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);

        // (8) BLOOM — downsample → blur → screen blend (glow premium)
        const bctx = bc.getContext('2d');
        if (bctx) {
            bctx.clearRect(0, 0, BW, BH);
            bctx.drawImage(canvas, 0, 0, BW, BH);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.5;
            ctx.filter = `blur(${(width * 0.006).toFixed(1)}px)`;
            ctx.drawImage(bc, 0, 0, width, height);
            ctx.filter = 'none';
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.restore();
        }

        // (9) FILM GRAIN — tile noise, geser via cos/sin (shimmer + seamless)
        if (!grainRef.current) grainRef.current = document.createElement('canvas');
        const gc = grainRef.current;
        if (gc.width !== 256) { gc.width = 256; gc.height = 256; }
        const gctx = gc.getContext('2d');
        if (gctx) {
            const gi = gctx.createImageData(256, 256);
            const gd = gi.data;
            for (let i = 0; i < gd.length; i += 4) {
                const v = Math.random() * 255;
                gd[i] = v; gd[i + 1] = v; gd[i + 2] = v; gd[i + 3] = 255;
            }
            gctx.putImageData(gi, 0, 0);
            const pat = ctx.createPattern(gc, 'repeat');
            if (pat) {
                ctx.save();
                ctx.globalCompositeOperation = 'overlay';
                ctx.globalAlpha = 0.05;
                ctx.translate(c1 * 12, s1 * 12);
                ctx.fillStyle = pat;
                ctx.fillRect(-24, -24, width + 48, height + 48);
                ctx.restore();
            }
        }

        // Vignette untuk kedalaman
        const vg = ctx.createRadialGradient(width / 2, height / 2, height * 0.25, width / 2, height / 2, height * 0.8);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, width, height);
    });

    return <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: '100%', display: 'block' }} />;
};
