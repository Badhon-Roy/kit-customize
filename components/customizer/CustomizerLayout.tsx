"use client";

import React, { JSX, useMemo, useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import LogoImg from "@/assets/images/logo.png";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Center,
} from "@react-three/drei";
import {
  Palette,
  Grid,
  Type,
  Image as ImageIcon,
  Sparkles,
  Scissors,
  Box,
  ChevronLeft,
  Save,
  Share2,
  Download,
  ShoppingCart,
  Wand2,
  Hash,
  LayoutTemplate,
  Copy,
  Trash2,
  GripVertical,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// ─── Realistic GLTF Jersey Model using Decals ─────────────────────────────────
import { useGLTF, Decal } from "@react-three/drei";

function useStyleDecals(colors: any) {
  return useMemo(() => {
    if (!colors?.collar || !colors?.collarType || colors.collarType === "None")
      return { collarDecal: null };

    const S = 1024;
    const cv = document.createElement("canvas");
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext("2d");
    if (!ctx) return { collarDecal: null };
    ctx.clearRect(0, 0, S, S);

    // Polyfill for roundRect (not in all TS lib versions)
    const drawRoundRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    const drawPlacket = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
    ) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.closePath();
    };

    const drawRealisticButton = (cx: number, cy: number, r: number) => {
      ctx.save();

      // 1. Drop shadow (subtle dark glow under the button)
      ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 2;

      // 2. Outer button body (slight gradient for rounded 3D effect)
      const btnGrad = ctx.createRadialGradient(
        cx - r * 0.3,
        cy - r * 0.3,
        r * 0.1,
        cx,
        cy,
        r,
      );
      btnGrad.addColorStop(0, "#ffffff"); // Highlight
      btnGrad.addColorStop(0.7, "#eaeaea"); // Base cream/white
      btnGrad.addColorStop(1, "#c0c0c0"); // Outer shaded edge

      ctx.fillStyle = btnGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Reset shadow so it doesn't apply to inner details
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // 3. Button Rim (thin outline on the very edge)
      ctx.strokeStyle = "rgba(0, 0, 0, 0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // 4. Inner Recess (inner circle rim)
      const innerR = r * 0.6;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.stroke();

      // 5. Four Button Holes in the center
      const holeOffset = r * 0.25;
      const holeR = r * 0.08;
      const holes = [
        { x: cx - holeOffset, y: cy - holeOffset },
        { x: cx + holeOffset, y: cy - holeOffset },
        { x: cx - holeOffset, y: cy + holeOffset },
        { x: cx + holeOffset, y: cy + holeOffset },
      ];

      ctx.fillStyle = "#333333"; // Dark holes
      holes.forEach((h) => {
        ctx.beginPath();
        ctx.arc(h.x, h.y, holeR, 0, Math.PI * 2);
        ctx.fill();
      });

      // 6. Cross stitch threads (connecting the holes)
      ctx.strokeStyle = "#888888"; // Thread color
      ctx.lineWidth = 1.2;

      // Diagonal 1
      ctx.beginPath();
      ctx.moveTo(cx - holeOffset, cy - holeOffset);
      ctx.lineTo(cx + holeOffset, cy + holeOffset);
      ctx.stroke();

      // Diagonal 2
      ctx.beginPath();
      ctx.moveTo(cx + holeOffset, cy - holeOffset);
      ctx.lineTo(cx - holeOffset, cy + holeOffset);
      ctx.stroke();

      ctx.restore();
    };

    const trim = colors.designColor || colors.secondary || "#1A1A2E";
    const base = colors.primary || "#2196F3";

    // Helper: parse hex to rgb
    const hexRgb = (h: string) => {
      const c = parseInt(h.replace("#", ""), 16);
      return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
    };
    const lighten = (h: string, amt: number) => {
      const [r, g, b] = hexRgb(h);
      return `rgba(${Math.min(255, r + amt)},${Math.min(255, g + amt)},${Math.min(255, b + amt)},1)`;
    };
    const darken = (h: string, amt: number) => {
      const [r, g, b] = hexRgb(h);
      return `rgba(${Math.max(0, r - amt)},${Math.max(0, g - amt)},${Math.max(0, b - amt)},1)`;
    };

    if (colors.collarType === "Round") {
      // Thick crew neck rib band — semi-circle at top
      const grad = ctx.createLinearGradient(0, 0, 0, S * 0.22);
      grad.addColorStop(0, lighten(trim, 40));
      grad.addColorStop(0.5, trim);
      grad.addColorStop(1, darken(trim, 30));
      ctx.strokeStyle = grad;
      ctx.lineWidth = S * 0.085;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(S / 2, 0, S * 0.38, 0.08, Math.PI - 0.08);
      ctx.stroke();
      // Rib stitch lines
      ctx.strokeStyle = darken(trim, 50);
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const r2 = S * 0.34 + i * S * 0.013;
        ctx.beginPath();
        ctx.arc(S / 2, 0, r2, 0.12, Math.PI - 0.12);
        ctx.stroke();
      }
    } else if (colors.collarType === "V-Neck") {
      // Left leg of V
      const makeVLeg = (x1: number, y1: number, x2: number, y2: number) => {
        const lg = ctx.createLinearGradient(x1, y1, x2, y2);
        lg.addColorStop(0, lighten(trim, 35));
        lg.addColorStop(0.45, trim);
        lg.addColorStop(1, darken(trim, 25));
        ctx.strokeStyle = lg;
        ctx.lineWidth = S * 0.075;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        // inner rib
        ctx.strokeStyle = darken(trim, 55);
        ctx.lineWidth = 2;
        ctx.stroke();
      };
      makeVLeg(S * 0.18, 0, S * 0.5, S * 0.52);
      makeVLeg(S * 0.82, 0, S * 0.5, S * 0.52);
    } else if (colors.collarType === "Polo") {
      // Collar band at top
      const band = ctx.createLinearGradient(0, 0, 0, S * 0.18);
      band.addColorStop(0, lighten(trim, 45));
      band.addColorStop(1, darken(trim, 20));
      ctx.fillStyle = band;
      drawRoundRect(S * 0.08, 0, S * 0.84, S * 0.18, 6);
      ctx.fill();

      // Left wing
      const leftGrad = ctx.createLinearGradient(S * 0.1, 0, S * 0.5, S * 0.5);
      leftGrad.addColorStop(0, lighten(trim, 30));
      leftGrad.addColorStop(1, darken(trim, 15));
      ctx.fillStyle = leftGrad;
      ctx.beginPath();
      ctx.moveTo(S * 0.08, S * 0.14);
      ctx.lineTo(S * 0.08, S * 0.56);
      ctx.lineTo(S * 0.5, S * 0.35);
      ctx.lineTo(S * 0.5, S * 0.14);
      ctx.closePath();
      ctx.fill();

      // Right wing
      const rightGrad = ctx.createLinearGradient(S * 0.5, 0, S * 0.9, S * 0.5);
      rightGrad.addColorStop(0, lighten(trim, 30));
      rightGrad.addColorStop(1, darken(trim, 15));
      ctx.fillStyle = rightGrad;
      ctx.beginPath();
      ctx.moveTo(S * 0.92, S * 0.14);
      ctx.lineTo(S * 0.92, S * 0.56);
      ctx.lineTo(S * 0.5, S * 0.35);
      ctx.lineTo(S * 0.5, S * 0.14);
      ctx.closePath();
      ctx.fill();

      // Placket strip
      const pkGrad = ctx.createLinearGradient(
        S * 0.45,
        S * 0.34,
        S * 0.55,
        S * 0.34,
      );
      pkGrad.addColorStop(0, lighten(trim, 20));
      pkGrad.addColorStop(1, darken(trim, 10));
      ctx.fillStyle = pkGrad;
      drawPlacket(S * 0.46, S * 0.34, S * 0.08, S * 0.34, S * 0.04);
      ctx.fill();
      ctx.strokeStyle = darken(trim, 40);
      ctx.lineWidth = 2;
      drawPlacket(S * 0.46, S * 0.34, S * 0.08, S * 0.34, S * 0.04);
      ctx.stroke();

      if (colors.zipper) {
        // 1. Draw clean zipper tape background (optional: dark border)
        ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(S * 0.492, S * 0.34);
        ctx.lineTo(S * 0.492, S * 0.68);
        ctx.moveTo(S * 0.508, S * 0.34);
        ctx.lineTo(S * 0.508, S * 0.68);
        ctx.stroke();

        // 3. Draw dark gunmetal grey slider (matha) and pull tab
        const sliderY = S * 0.41;

        // 2. Draw metallic silver zipper track/teeth (looks like a coil)
        ctx.strokeStyle = "#a0a0a0"; // Metallic grey
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(S * 0.5, sliderY);
        ctx.lineTo(S * 0.5, S * 0.68);
        ctx.stroke();

        // Draw horizontal silver teeth segments
        ctx.strokeStyle = "#d8d8d8"; // Silver shine
        ctx.lineWidth = 2;
        for (let y = sliderY + S * 0.01; y <= S * 0.68; y += 5) {
          // Left side tooth
          ctx.beginPath();
          ctx.moveTo(S * 0.493, y);
          ctx.lineTo(S * 0.5, y);
          ctx.stroke();

          // Right side tooth (interlocking offset)
          ctx.beginPath();
          ctx.moveTo(S * 0.5, y + 2.5);
          ctx.lineTo(S * 0.507, y + 2.5);
          ctx.stroke();
        }

        // Draw dark center line for the track separation
        ctx.strokeStyle = "#555555";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(S * 0.5, S * 0.34);
        ctx.lineTo(S * 0.5, S * 0.68);
        ctx.stroke();

        // Loop / cap at the top (silver metallic)
        ctx.fillStyle = "#a0a0a0";
        ctx.strokeStyle = "#666666";
        ctx.lineWidth = 1;
        drawRoundRect(S * 0.491, sliderY - S * 0.008, S * 0.018, S * 0.012, 1);
        ctx.fill();
        ctx.stroke();

        // Main dark gunmetal rectangular slider body
        ctx.fillStyle = "#2d2d2d";
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = 1.5;
        // Rectangular with slightly rounded corners
        drawRoundRect(S * 0.48, sliderY, S * 0.04, S * 0.05, 1.5);
        ctx.fill();
        ctx.stroke();

        // Inner vertical groove on slider (like in the image)
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(S * 0.495, sliderY + S * 0.008, S * 0.01, S * 0.034);

        // Puller attachment bracket on slider
        ctx.fillStyle = "#555555";
        drawRoundRect(S * 0.492, sliderY + S * 0.015, S * 0.016, S * 0.018, 1);
        ctx.fill();

        // Long rectangular pull tab hanging down (matching the image)
        ctx.fillStyle = "#333333";
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = 1.5;
        drawRoundRect(S * 0.487, sliderY + S * 0.042, S * 0.026, S * 0.065, 2);
        ctx.fill();
        ctx.stroke();

        // Embossed slot detail in the center of the tab
        ctx.strokeStyle = "#555555";
        ctx.lineWidth = 2;
        drawRoundRect(S * 0.493, sliderY + S * 0.048, S * 0.014, S * 0.053, 1);
        ctx.stroke();
      } else {
        // 2 realistic buttons
        [0.45, 0.57].forEach((yf) => {
          drawRealisticButton(S * 0.5, S * yf, S * 0.02);
        });
      }
    } else if (colors.collarType === "Henley") {
      // Round neck band
      const hb = ctx.createLinearGradient(0, 0, 0, S * 0.14);
      hb.addColorStop(0, lighten(trim, 40));
      hb.addColorStop(1, darken(trim, 20));
      ctx.strokeStyle = hb;
      ctx.lineWidth = S * 0.07;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(S / 2, 0, S * 0.38, 0.08, Math.PI - 0.08);
      ctx.stroke();
      // Rib stitches on band
      ctx.strokeStyle = darken(trim, 50);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(S / 2, 0, S * 0.35, 0.1, Math.PI - 0.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(S / 2, 0, S * 0.37, 0.1, Math.PI - 0.1);
      ctx.stroke();

      // Placket
      const pg2 = ctx.createLinearGradient(S * 0.44, 0, S * 0.56, 0);
      pg2.addColorStop(0, lighten(base, 20));
      pg2.addColorStop(0.5, base);
      pg2.addColorStop(1, darken(base, 15));
      ctx.fillStyle = pg2;
      drawPlacket(S * 0.44, S * 0.28, S * 0.12, S * 0.42, S * 0.06);
      ctx.fill();
      ctx.strokeStyle = darken(trim, 35);
      ctx.lineWidth = 2;
      drawPlacket(S * 0.44, S * 0.28, S * 0.12, S * 0.42, S * 0.06);
      ctx.stroke();

      if (colors.zipper) {
        // 1. Draw clean zipper tape background
        ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(S * 0.492, S * 0.28);
        ctx.lineTo(S * 0.492, S * 0.7);
        ctx.moveTo(S * 0.508, S * 0.28);
        ctx.lineTo(S * 0.508, S * 0.7);
        ctx.stroke();

        // 3. Draw dark gunmetal grey slider and pull tab
        const sliderY = S * 0.43;

        // 2. Draw metallic silver zipper track/teeth
        ctx.strokeStyle = "#a0a0a0";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(S * 0.5, sliderY);
        ctx.lineTo(S * 0.5, S * 0.7);
        ctx.stroke();

        // Draw horizontal silver teeth segments
        ctx.strokeStyle = "#d8d8d8";
        ctx.lineWidth = 2;
        for (let y = sliderY + S * 0.01; y <= S * 0.7; y += 5) {
          ctx.beginPath();
          ctx.moveTo(S * 0.493, y);
          ctx.lineTo(S * 0.5, y);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(S * 0.5, y + 2.5);
          ctx.lineTo(S * 0.507, y + 2.5);
          ctx.stroke();
        }

        // Draw dark center line
        ctx.strokeStyle = "#555555";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(S * 0.5, S * 0.28);
        ctx.lineTo(S * 0.5, S * 0.7);
        ctx.stroke();

        // Loop / cap at the top
        ctx.fillStyle = "#a0a0a0";
        ctx.strokeStyle = "#666666";
        ctx.lineWidth = 1;
        drawRoundRect(S * 0.491, sliderY - S * 0.008, S * 0.018, S * 0.012, 1);
        ctx.fill();
        ctx.stroke();

        // Main dark gunmetal rectangular slider body
        ctx.fillStyle = "#2d2d2d";
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = 1.5;
        drawRoundRect(S * 0.48, sliderY, S * 0.04, S * 0.05, 1.5);
        ctx.fill();
        ctx.stroke();

        // Inner vertical groove
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(S * 0.495, sliderY + S * 0.008, S * 0.01, S * 0.034);

        // Puller attachment bracket
        ctx.fillStyle = "#555555";
        drawRoundRect(S * 0.492, sliderY + S * 0.015, S * 0.016, S * 0.018, 1);
        ctx.fill();

        // Long rectangular pull tab
        ctx.fillStyle = "#333333";
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = 1.5;
        drawRoundRect(S * 0.487, sliderY + S * 0.042, S * 0.026, S * 0.065, 2);
        ctx.fill();
        ctx.stroke();

        // Embossed slot detail
        ctx.strokeStyle = "#555555";
        ctx.lineWidth = 2;
        drawRoundRect(S * 0.493, sliderY + S * 0.048, S * 0.014, S * 0.053, 1);
        ctx.stroke();
      } else {
        // 2 realistic buttons
        [0.48, 0.6].forEach((yf) => {
          drawRealisticButton(S * 0.5, S * yf, S * 0.02);
        });
      }
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 16;
    tex.needsUpdate = true;
    return { collarDecal: tex };
  }, [
    colors?.collar,
    colors?.collarType,
    colors?.zipper,
    colors?.designColor,
    colors?.secondary,
    colors?.primary,
  ]);
}

const PATTERN_DEFAULT_COLORS: Record<string, { bg: string; design: string }> = {
  "/assets/images/patterns/pattern_1.png": { bg: "#FFFFFF", design: "#d73099" },
  "/assets/images/patterns/pattern_2.png": { bg: "#FFFFFF", design: "#5A6B7C" },
  "/assets/images/patterns/pattern_3.png": { bg: "#FFFFFF", design: "#0F7643" },
  "/assets/images/patterns/pattern_4.png": { bg: "#FFFFFF", design: "#8db97b" },
  "/assets/images/patterns/pattern_5.png": { bg: "#FFFFFF", design: "#E52E2E" },
};

function useJerseyDecals(state: any) {
  return useMemo(() => {
    const size = 1024;

    // Use secondary color for text to respect user's color selection
    const textColor = state.secondary || "#ffffff";

    const makeCanvas = (drawFn: (ctx: CanvasRenderingContext2D) => void) => {
      const cv = document.createElement("canvas");
      cv.width = size;
      cv.height = size;
      const ctx = cv.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Explicitly disable context border path stroke defaults
      ctx.strokeStyle = "transparent";
      ctx.lineWidth = 0;

      drawFn(ctx);

      const texture = new THREE.CanvasTexture(cv);
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      // The 3D Decal box scale for the torso is [0.54, 0.7, 0.32]. This non-square projection
      // naturally squishes the 1024x1024 square canvas horizontally by a factor of 0.54 / 0.7.
      // We apply an inverse mathematical multiplier to stretch the texture back out dynamically,
      // creating a perfect 1:1 mirror of the 2D visual layout without squeezing the logo.
      const meshDecalAspectRatio = 0.54 / 0.7;
      texture.repeat.set(meshDecalAspectRatio, 1);
      texture.offset.set((1 - meshDecalAspectRatio) / 2, 0);

      texture.needsUpdate = true;
      return texture;
    };

    const drawLayerOnCtx = (ctx: CanvasRenderingContext2D, layer: any) => {
      const img = state.loadedLogoImages[layer.src];
      if (!img) return;
      ctx.save();
      ctx.strokeStyle = "transparent";
      ctx.lineWidth = 0;
      ctx.shadowBlur = 0;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      const opacity = typeof layer.opacity === "number" ? layer.opacity : 1.0;
      ctx.globalAlpha = opacity;
      ctx.translate(layer.x, layer.y);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.scale(layer.scale, layer.scale);

      const imgWidth = img.naturalWidth || img.width || 200;
      const imgHeight = img.naturalHeight || img.height || 200;
      const drawWidth = imgWidth;
      const drawHeight = imgHeight;

      if (layer.eraserPaths && layer.eraserPaths.length > 0) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = drawWidth;
        tempCanvas.height = drawHeight;
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          tempCtx.drawImage(img, 0, 0, drawWidth, drawHeight);
          tempCtx.globalCompositeOperation = "destination-out";
          tempCtx.lineCap = "round";
          tempCtx.lineJoin = "round";
          tempCtx.strokeStyle = "rgba(0,0,0,1)";
          layer.eraserPaths.forEach((path: any) => {
            tempCtx.lineWidth = path.size;
            tempCtx.beginPath();
            path.points.forEach((pt: any, idx: number) => {
              if (idx === 0) {
                tempCtx.moveTo(pt.x, pt.y);
              } else {
                tempCtx.lineTo(pt.x, pt.y);
              }
            });
            tempCtx.stroke();
          });
          ctx.drawImage(
            tempCanvas,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight,
          );
        } else {
          ctx.drawImage(
            img,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight,
          );
        }
      } else {
        ctx.drawImage(
          img,
          -drawWidth / 2,
          -drawHeight / 2,
          drawWidth,
          drawHeight,
        );
      }
      ctx.restore();
    };

    const getFontString = (
      sizeStr: any,
      fontStyle: string,
      defaultSize: number,
    ) => {
      const sz = sizeStr || defaultSize;
      if (fontStyle === "Italic")
        return `italic 900 ${sz}px Impact, sans-serif`;
      if (fontStyle === "Script")
        return `bold ${sz}px "Brush Script MT", cursive`;
      if (fontStyle === "Block") return `900 ${sz}px "Courier New", monospace`;
      if (fontStyle === "Varsity")
        return `900 ${sz}px "Arial Black", sans-serif`;
      if (fontStyle === "Serif Athletic")
        return `900 ${sz}px "Alfa Slab One", serif`;
      if (fontStyle === "Cyberpunk")
        return `900 ${sz}px "Orbitron", sans-serif`;
      if (fontStyle === "Grunge") return `400 ${sz}px "Rubik Glitch", display`;
      if (fontStyle === "Neon Glow") return `400 ${sz}px "Monoton", sans-serif`;
      if (fontStyle === "Gothic")
        return `400 ${sz}px "UnifrakturMaguntia", serif`;
      // Default and Outline use Impact
      return `900 ${sz}px Impact, sans-serif`;
    };

    const drawTextWithSpacing = (
      ctx: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      fontStyle: string,
      textSize: number,
      color: string,
      isOutline: boolean,
      outlineColor: string,
      letterSpacingVal: number,
      lineSpacingVal: number,
      curveRadiusVal: number,
      shadowEnabled?: boolean,
      shadowColor?: string,
      shadowBlur?: number,
      shadowOffsetX?: number,
      shadowOffsetY?: number,
      outlineEnabled?: boolean,
      customOutlineColor?: string,
      outlineWidth?: number,
    ) => {
      ctx.save();
      ctx.translate(x, y);

      const lines = text.split("\n");
      const lineSpacingHeight = textSize * (lineSpacingVal || 1.15);
      const totalHeight = (lines.length - 1) * lineSpacingHeight;
      const verticalOffset = -totalHeight / 2;

      lines.forEach((line, lineIndex) => {
        const curY = verticalOffset + lineIndex * lineSpacingHeight;

        ctx.font = getFontString(textSize, fontStyle, 100);
        ctx.textBaseline = "middle";

        if (shadowEnabled) {
          ctx.shadowColor = shadowColor || "#000000";
          ctx.shadowBlur = typeof shadowBlur === "number" ? shadowBlur : 10;
          ctx.shadowOffsetX =
            typeof shadowOffsetX === "number" ? shadowOffsetX : 4;
          ctx.shadowOffsetY =
            typeof shadowOffsetY === "number" ? shadowOffsetY : 4;
        } else if (fontStyle === "Neon Glow") {
          ctx.shadowColor = color;
          ctx.shadowBlur = Math.max(10, textSize * 0.15);
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        } else {
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }

        const chars = Array.from(line);
        const charWidths = chars.map((c) => ctx.measureText(c).width);
        const totalWidth =
          charWidths.reduce((a, b) => a + b, 0) +
          (chars.length - 1) * letterSpacingVal;

        if (!curveRadiusVal || curveRadiusVal === 0) {
          if (!letterSpacingVal || letterSpacingVal === 0) {
            ctx.textAlign = "center";

            // Draw outline stroke first (underneath fill)
            if (outlineEnabled) {
              ctx.strokeStyle = customOutlineColor || "#FFFFFF";
              ctx.lineWidth =
                typeof outlineWidth === "number" ? outlineWidth : 4;
              ctx.strokeText(line, 0, curY);
            } else if (isOutline) {
              ctx.strokeStyle = color;
              ctx.lineWidth = Math.max(2, textSize * 0.04);
              ctx.strokeText(line, 0, curY);
            }

            // Draw filled text second
            if (!isOutline) {
              ctx.fillStyle = color;
              ctx.fillText(line, 0, curY);
            }
          } else {
            // Draw character by character for letter spacing support
            let curX = -totalWidth / 2;

            ctx.textAlign = "left";

            chars.forEach((char, charIdx) => {
              const charW = charWidths[charIdx];

              if (outlineEnabled) {
                ctx.strokeStyle = customOutlineColor || "#FFFFFF";
                ctx.lineWidth =
                  typeof outlineWidth === "number" ? outlineWidth : 4;
                ctx.strokeText(char, curX, curY);
              } else if (isOutline) {
                ctx.strokeStyle = color;
                ctx.lineWidth = Math.max(2, textSize * 0.04);
                ctx.strokeText(char, curX, curY);
              }

              if (!isOutline) {
                ctx.fillStyle = color;
                ctx.fillText(char, curX, curY);
              }
              curX += charW + letterSpacingVal;
            });
          }
        } else {
          // Curved rendering along an arc!
          // curveRadiusVal represents the angle in degrees, e.g. -120 to 120
          const totalAngle = (curveRadiusVal * Math.PI) / 180;
          const R = totalWidth / totalAngle;

          let currentS = 0;

          ctx.textAlign = "center";

          chars.forEach((char, charIdx) => {
            const charW = charWidths[charIdx];
            const charCenterS = currentS + charW / 2;
            const angle = (charCenterS - totalWidth / 2) / R;

            const cx = R * Math.sin(angle);
            const cy = curY + R * (1 - Math.cos(angle));

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);

            if (outlineEnabled) {
              ctx.strokeStyle = customOutlineColor || "#FFFFFF";
              ctx.lineWidth =
                typeof outlineWidth === "number" ? outlineWidth : 4;
              ctx.strokeText(char, 0, 0);
            } else if (isOutline) {
              ctx.strokeStyle = color;
              ctx.lineWidth = Math.max(2, textSize * 0.04);
              ctx.strokeText(char, 0, 0);
            }

            if (!isOutline) {
              ctx.fillStyle = color;
              ctx.fillText(char, 0, 0);
            }
            ctx.restore();

            currentS += charW + letterSpacingVal;
          });
        }
      });
      ctx.restore();
    };

    // ── Pattern drawing — mirrors every SVG pattern to Canvas 2D ──────────────
    const drawPattern = (ctx: CanvasRenderingContext2D) => {
      const dp = state.designPattern;
      if (!dp || dp === "plain") return;
      const sc = size / 100; // SVG viewBox is 100×100, canvas is 1024×1024
      const sec = state.designColor || state.secondary || "#1A1A2E";
      const pri = state.primary || "#2196F3";
      ctx.save();
      ctx.fillStyle = sec;
      ctx.strokeStyle = sec;
      switch (dp) {
        case "strike":
          ctx.globalAlpha = 1.0;
          ctx.beginPath();
          ctx.moveTo(60 * sc, 10 * sc);
          ctx.lineTo(80 * sc, 10 * sc);
          ctx.lineTo(50 * sc, 90 * sc);
          ctx.lineTo(30 * sc, 90 * sc);
          ctx.closePath();
          ctx.fill();
          break;
        case "save":
          ctx.globalAlpha = 1.0;
          ctx.fillRect(0, 0, 45 * sc, size);
          break;
        case "fastbreak":
          ctx.globalAlpha = 1.0;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(30 * sc, 0);
          ctx.lineTo(0, 50 * sc);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(100 * sc, 50 * sc);
          ctx.lineTo(100 * sc, 100 * sc);
          ctx.lineTo(70 * sc, 100 * sc);
          ctx.closePath();
          ctx.fill();
          break;
        case "final":
          ctx.globalAlpha = 1.0;
          ctx.fillRect(0, 0, 35 * sc, size);
          ctx.fillRect(65 * sc, 0, 35 * sc, size);
          break;
        case "victory":
          ctx.globalAlpha = 1.0;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(40 * sc, 0);
          ctx.lineTo(20 * sc, 100 * sc);
          ctx.lineTo(0, 100 * sc);
          ctx.closePath();
          ctx.fill();
          break;
        case "city":
          ctx.globalAlpha = 1.0;
          ctx.lineWidth = 4 * sc;
          [25, 50, 75].forEach((y) => {
            ctx.beginPath();
            ctx.moveTo(0, y * sc);
            ctx.lineTo(size, y * sc);
            ctx.stroke();
          });
          break;
        case "pure":
          ctx.globalAlpha = 1.0;
          ctx.beginPath();
          ctx.moveTo(70 * sc, 0);
          ctx.lineTo(100 * sc, 0);
          ctx.lineTo(100 * sc, 40 * sc);
          ctx.closePath();
          ctx.fill();
          break;
        case "level":
          ctx.globalAlpha = 1.0;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(55 * sc, 0);
          ctx.lineTo(0, 70 * sc);
          ctx.closePath();
          ctx.fill();
          break;
        case "vivo":
          ctx.globalAlpha = 1.0;
          ctx.beginPath();
          ctx.moveTo(60 * sc, 100 * sc);
          ctx.lineTo(100 * sc, 0);
          ctx.lineTo(100 * sc, 100 * sc);
          ctx.closePath();
          ctx.fill();
          break;
        case "orion":
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          [
            [30, 20],
            [70, 20],
            [90, 60],
            [50, 90],
            [10, 60],
          ].forEach(([x, y], i) => {
            i === 0 ? ctx.moveTo(x * sc, y * sc) : ctx.lineTo(x * sc, y * sc);
          });
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = sec;
          ctx.beginPath();
          [
            [40, 30],
            [60, 30],
            [70, 55],
            [50, 72],
            [30, 55],
          ].forEach(([x, y], i) => {
            i === 0 ? ctx.moveTo(x * sc, y * sc) : ctx.lineTo(x * sc, y * sc);
          });
          ctx.closePath();
          ctx.fill();
          break;
        case "animal":
          ctx.globalAlpha = 1.0;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(25 * sc, 40 * sc, 50 * sc, 10 * sc);
          ctx.quadraticCurveTo(75 * sc, 40 * sc, 100 * sc, 0);
          ctx.lineTo(100 * sc, 50 * sc);
          ctx.quadraticCurveTo(75 * sc, 80 * sc, 50 * sc, 55 * sc);
          ctx.quadraticCurveTo(25 * sc, 80 * sc, 0, 50 * sc);
          ctx.closePath();
          ctx.fill();
          break;
        case "avatar":
          ctx.globalAlpha = 1.0;
          ctx.beginPath();
          ctx.moveTo(0, 100 * sc);
          ctx.lineTo(45 * sc, 0);
          ctx.lineTo(55 * sc, 0);
          ctx.lineTo(0, 100 * sc);
          ctx.closePath();
          ctx.fill();
          break;
        case "league":
          ctx.globalAlpha = 1.0;
          ctx.fillRect(0, 0, 50 * sc, size);
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = pri;
          ctx.fillRect(50 * sc, 0, 50 * sc, size);
          break;
        case "magic": {
          const grad = ctx.createRadialGradient(
            50 * sc,
            40 * sc,
            0,
            50 * sc,
            40 * sc,
            80 * sc,
          );
          grad.addColorStop(0, sec);
          grad.addColorStop(1, "transparent");
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, size, size);
          break;
        }
        case "raid":
          ctx.globalAlpha = 1.0;
          ctx.fillRect(0, 0, size, 50 * sc);
          break;
        case "rush":
          ctx.globalAlpha = 1.0;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, 100 * sc);
          ctx.lineTo(40 * sc, 100 * sc);
          ctx.closePath();
          ctx.fill();
          break;
        case "score":
          ctx.globalAlpha = 1.0;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(100 * sc, 0);
          ctx.lineTo(100 * sc, 100 * sc);
          ctx.closePath();
          ctx.fill();
          break;
        default:
          break;
      }
      ctx.restore();
    };

    // ── Fabric Pattern Canvas Drawer ──────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _drawFabricPatternOld = (
      ctx: CanvasRenderingContext2D,
      patternName: string,
      primaryColor: string = "#E63946",
    ) => {
      if (!patternName || patternName === "None") return;
      ctx.save();

      switch (patternName) {
        case "Street Shard": {
          // 1. Draw Abstract Grunge Shards (Graffiti Style) on the left and right sides
          // We divide the canvas vertically into 3 sections: Left (0 to 35%), Center (35% to 65%), Right (65% to 100%)

          // Seeded/deterministic random helper so the pattern looks consistent on redraws
          let seed = 12345;
          const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
          };

          const drawShard = (
            x: number,
            y: number,
            rSize: number,
            color: string,
          ) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(
              x + (random() - 0.5) * rSize,
              y + (random() - 0.5) * rSize,
            );
            const points = 3 + Math.floor(random() * 4); // 3 to 6 points
            for (let p = 0; p < points; p++) {
              const angle = (p / points) * Math.PI * 2 + random() * 0.5;
              const px = x + Math.cos(angle) * rSize * (0.6 + random() * 0.6);
              const py = y + Math.sin(angle) * rSize * (0.6 + random() * 0.6);
              ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
          };

          // Draw dark/light shards on the left side
          for (let i = 0; i < 20; i++) {
            const rx = random() * (size * 0.33);
            const ry = random() * size;
            const rS = 30 + random() * 50;
            const isDark = random() > 0.3;
            drawShard(
              rx,
              ry,
              rS,
              isDark ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.12)",
            );
            // wrap-around for tileability
            if (rx < rS)
              drawShard(
                rx + size,
                ry,
                rS,
                isDark ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.12)",
              );
          }

          // Draw dark/light shards on the right side
          for (let i = 0; i < 20; i++) {
            const rx = size * 0.67 + random() * (size * 0.33);
            const ry = random() * size;
            const rS = 30 + random() * 50;
            const isDark = random() > 0.3;
            drawShard(
              rx,
              ry,
              rS,
              isDark ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.12)",
            );
            // wrap-around for tileability
            if (rx + rS > size)
              drawShard(
                rx - size,
                ry,
                rS,
                isDark ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.12)",
              );
          }

          // Add some fine lines / scratches for the grunge look
          ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
          ctx.lineWidth = 2;
          for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            const sx = random() * size;
            const sy = random() * size;
            ctx.moveTo(sx, sy);
            ctx.lineTo(
              sx + (random() - 0.5) * 120,
              sy + (random() - 0.5) * 120,
            );
            ctx.stroke();
          }

          // 2. Draw Center Band
          const bandStart = size * 0.36;
          const bandEnd = size * 0.64;
          const bandWidth = bandEnd - bandStart;

          // Draw solid background center band with dark overlay
          ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
          ctx.fillRect(bandStart, 0, bandWidth, size);

          // Center band subtle marble/brush overlay
          ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
          ctx.lineWidth = 3;
          for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            const sx = bandStart + random() * bandWidth;
            const sy = random() * size;
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(
              sx + (random() - 0.5) * 30,
              sy + 50,
              sx + (random() - 0.5) * 30,
              sy + 100,
            );
            ctx.stroke();
          }

          // 3. Draw Halftone Dots Gradient fading into center
          ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
          const dotSpacing = 10;

          // Left Halftone (fades as it goes left, i.e., x decreases from bandStart)
          for (let x = bandStart - 40; x <= bandStart; x += dotSpacing) {
            const distance = bandStart - x; // 0 to 40
            const maxRadius = 3.5;
            // Radius is largest at bandStart, smallest at bandStart - 40
            const radius = Math.max(0.5, maxRadius * (1 - distance / 40));
            for (let y = 0; y < size; y += dotSpacing) {
              ctx.beginPath();
              // Offset alternating rows to create a hex/halftone grid look
              const offset =
                (Math.round(y / dotSpacing) % 2) * (dotSpacing / 2);
              ctx.arc(x, y + offset, radius, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // Right Halftone (fades as it goes right, i.e., x increases from bandEnd)
          for (let x = bandEnd; x <= bandEnd + 40; x += dotSpacing) {
            const distance = x - bandEnd; // 0 to 40
            const maxRadius = 3.5;
            // Radius is largest at bandEnd, smallest at bandEnd + 40
            const radius = Math.max(0.5, maxRadius * (1 - distance / 40));
            for (let y = 0; y < size; y += dotSpacing) {
              ctx.beginPath();
              // Offset alternating rows
              const offset =
                (Math.round(y / dotSpacing) % 2) * (dotSpacing / 2);
              ctx.arc(x, y + offset, radius, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          break;
        }
        case "JerseyHexDot": {
          const size = ctx.canvas.width; // assumes square canvas; adjust as needed

          // 1. Base color — uses the user's chosen primary color
          ctx.fillStyle = primaryColor;
          ctx.fillRect(0, 0, size, size);

          // 2. Hex + halftone dot sublimation pattern
          const hexSize = 48;
          const cols = Math.ceil(size / (hexSize * 1.6)) + 2;
          const rows = Math.ceil(size / (hexSize * 1.4)) + 2;

          for (let row = -1; row < rows; row++) {
            for (let col = -1; col < cols; col++) {
              const offsetX = row % 2 === 0 ? 0 : hexSize * 0.9;
              const cx = col * hexSize * 1.7 + offsetX;
              const cy = row * hexSize * 1.35;

              // Subtle hex outline
              ctx.beginPath();
              for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 180) * (60 * i - 30);
                const x = cx + hexSize * 0.82 * Math.cos(angle);
                const y = cy + hexSize * 0.82 * Math.sin(angle);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
              }
              ctx.closePath();
              // Derive a darkened variant of primary for the hex outline
              const hexR = parseInt(primaryColor.slice(1, 3), 16);
              const hexG = parseInt(primaryColor.slice(3, 5), 16);
              const hexB = parseInt(primaryColor.slice(5, 7), 16);
              const dr2 = Math.round(hexR * 0.65);
              const dg2 = Math.round(hexG * 0.65);
              const db2 = Math.round(hexB * 0.65);
              ctx.strokeStyle = `rgba(${dr2}, ${dg2}, ${db2}, 0.5)`;
              ctx.lineWidth = 1.2;
              ctx.stroke();

              // Halftone dots inside each hex cell
              const dotRows = 5;
              const dotCols = 5;
              const dotSpacing = hexSize * 0.32;

              for (let dr = 0; dr < dotRows; dr++) {
                for (let dc = 0; dc < dotCols; dc++) {
                  const dx =
                    cx - ((dotCols - 1) * dotSpacing) / 2 + dc * dotSpacing;
                  const dy =
                    cy - ((dotRows - 1) * dotSpacing) / 2 + dr * dotSpacing;

                  const dist = Math.sqrt((dx - cx) ** 2 + (dy - cy) ** 2);
                  const maxDist = hexSize * 0.75;
                  if (dist > maxDist) continue; // clip to hex boundary

                  const fade = 1 - dist / maxDist;
                  const r = 1.6 * fade + 0.4;

                  ctx.beginPath();
                  ctx.arc(dx, dy, r, 0, Math.PI * 2);
                  // Derive dot color from primary (darkened)
                  const pr = parseInt(primaryColor.slice(1, 3), 16);
                  const pg = parseInt(primaryColor.slice(3, 5), 16);
                  const pb = parseInt(primaryColor.slice(5, 7), 16);
                  const dr3 = Math.round(pr * 0.7);
                  const dg3 = Math.round(pg * 0.7);
                  const db3 = Math.round(pb * 0.7);
                  ctx.fillStyle = `rgba(${dr3}, ${dg3}, ${db3}, ${0.55 * fade + 0.15})`;
                  ctx.fill();
                }
              }
            }
          }

          // 3. Optional radial vignette overlay
          const vignette = ctx.createRadialGradient(
            size / 2,
            size / 2,
            size * 0.2,
            size / 2,
            size / 2,
            size * 0.85,
          );
          vignette.addColorStop(0, "rgba(0,0,0,0)");
          vignette.addColorStop(1, "rgba(0,0,0,0.22)");
          ctx.fillStyle = vignette;
          ctx.fillRect(0, 0, size, size);

          break;
        }

        case "BlueGrungeJersey": {
          const W = ctx.canvas.width;
          const H = ctx.canvas.height;

          // ── Parse primaryColor into RGB components ──────────────────
          const pr = parseInt(primaryColor.slice(1, 3), 16);
          const pg = parseInt(primaryColor.slice(3, 5), 16);
          const pb = parseInt(primaryColor.slice(5, 7), 16);

          // Light side color: blend primary with white (60% white)
          const lr = Math.round(pr * 0.4 + 255 * 0.6);
          const lg = Math.round(pg * 0.4 + 255 * 0.6);
          const lb = Math.round(pb * 0.4 + 255 * 0.6);
          const lightSide = `rgb(${lr}, ${lg}, ${lb})`;

          // Dark center stripe: 45% of primary
          const darkR = Math.round(pr * 0.45);
          const darkG = Math.round(pg * 0.45);
          const darkB = Math.round(pb * 0.45);
          const darkStripe = `rgb(${darkR}, ${darkG}, ${darkB})`;

          // Deep dark: 35% of primary — for triangles, dots, scratches
          const deepR = Math.round(pr * 0.35);
          const deepG = Math.round(pg * 0.35);
          const deepB = Math.round(pb * 0.35);

          // ── 1. BASE BACKGROUND ──────────────────────────────────────
          ctx.fillStyle = primaryColor;
          ctx.fillRect(0, 0, W, H);

          // ── 2. LIGHT SIDE PANELS ─────────────────────────────────────
          ctx.fillStyle = lightSide;
          ctx.fillRect(0, 0, W * 0.38, H);
          ctx.fillRect(W * 0.62, 0, W * 0.38, H);

          // ── 3. RANDOM GRUNGE TRIANGLES (left & right panels) ────────
          const bgjSeed = (s: number) => {
            const x = Math.sin(s) * 10000;
            return x - Math.floor(x);
          };

          const drawGrungeTriangles = (
            areaX: number,
            areaW: number,
            count: number,
            seedOffset: number,
          ) => {
            for (let i = 0; i < count; i++) {
              const r1 = bgjSeed(i * 3 + seedOffset);
              const r2 = bgjSeed(i * 3 + 1 + seedOffset);
              const r3 = bgjSeed(i * 3 + 2 + seedOffset);
              const r4 = bgjSeed(i * 3 + 3 + seedOffset);
              const r5 = bgjSeed(i * 3 + 4 + seedOffset);
              const r6 = bgjSeed(i * 3 + 5 + seedOffset);

              const x1 = areaX + r1 * areaW;
              const y1 = r2 * H;
              const triSize = 40 + r3 * 120;
              const angle = r4 * Math.PI * 2;

              const x2 = x1 + Math.cos(angle) * triSize;
              const y2 = y1 + Math.sin(angle) * triSize;
              const x3 = x1 + Math.cos(angle + 2.3) * triSize * 0.7;
              const y3 = y1 + Math.sin(angle + 2.3) * triSize * 0.7;

              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.lineTo(x3, y3);
              ctx.closePath();

              if (r5 > 0.5) {
                ctx.fillStyle = `rgba(${deepR}, ${deepG}, ${deepB}, 0.75)`;
                ctx.fill();
              } else {
                ctx.strokeStyle = `rgba(${deepR}, ${deepG}, ${deepB}, 0.85)`;
                ctx.lineWidth = 2 + r6 * 4;
                ctx.stroke();
              }

              if (r5 > 0.3) {
                ctx.save();
                ctx.strokeStyle = `rgba(${deepR}, ${deepG}, ${deepB}, 0.5)`;
                ctx.lineWidth = 0.8;
                for (let sc = 0; sc < 5; sc++) {
                  const sx = x1 + (bgjSeed(i * 10 + sc) - 0.5) * triSize;
                  const sy = y1 + (bgjSeed(i * 10 + sc + 1) - 0.5) * triSize;
                  const ex = sx + (bgjSeed(i * 10 + sc + 2) - 0.5) * 30;
                  const ey = sy + (bgjSeed(i * 10 + sc + 3) - 0.5) * 30;
                  ctx.beginPath();
                  ctx.moveTo(sx, sy);
                  ctx.lineTo(ex, ey);
                  ctx.stroke();
                }
                ctx.restore();
              }
            }
          };

          drawGrungeTriangles(0, W * 0.4, 60, 1);
          drawGrungeTriangles(W * 0.6, W * 0.4, 60, 99);

          // ── 4. HALFTONE DOTS (transition zones near center) ─────────
          const drawHalftone = (
            startX: number,
            endX: number,
            startY: number,
            endY: number,
            invertFade: boolean,
          ) => {
            const spacing = 18;
            for (let hy = startY; hy < endY; hy += spacing) {
              for (let hx = startX; hx < endX; hx += spacing) {
                const distFromCenter = Math.abs(hx - W / 2) / (W / 2);
                const fade = invertFade ? 1 - distFromCenter : distFromCenter;
                const dotR = 6 * fade;
                if (dotR < 0.5) continue;
                ctx.beginPath();
                ctx.arc(hx, hy, dotR, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${deepR}, ${deepG}, ${deepB}, ${0.5 * fade + 0.1})`;
                ctx.fill();
              }
            }
          };

          drawHalftone(0, W, 0, H * 0.15, false);
          drawHalftone(0, W, H * 0.82, H, false);
          drawHalftone(W * 0.3, W * 0.7, 0, H, true);

          // ── 5. CENTER DARK STRIPE ────────────────────────────────────
          const stripeX = W * 0.33;
          const stripeW = W * 0.34;

          ctx.fillStyle = darkStripe;
          ctx.fillRect(stripeX, 0, stripeW, H);

          ctx.save();
          ctx.strokeStyle = `rgba(${darkR}, ${darkG}, ${darkB}, 0.6)`;
          for (let i = 0; i < 120; i++) {
            const sx = stripeX + bgjSeed(i * 2) * stripeW;
            const sy = bgjSeed(i * 2 + 1) * H;
            const len = 40 + bgjSeed(i * 3) * 100;
            const ang = -0.2 + bgjSeed(i * 4) * 0.4;
            ctx.lineWidth = 0.5 + bgjSeed(i * 5) * 1.5;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
            ctx.stroke();
          }
          ctx.restore();

          const leftEdge = ctx.createLinearGradient(
            stripeX - 10,
            0,
            stripeX + 20,
            0,
          );
          leftEdge.addColorStop(0, `rgba(${lr}, ${lg}, ${lb}, 0.0)`);
          leftEdge.addColorStop(1, `rgba(${darkR}, ${darkG}, ${darkB}, 0.9)`);
          ctx.fillStyle = leftEdge;
          ctx.fillRect(stripeX - 10, 0, 30, H);

          const rightEdge = ctx.createLinearGradient(
            stripeX + stripeW - 20,
            0,
            stripeX + stripeW + 10,
            0,
          );
          rightEdge.addColorStop(0, `rgba(${darkR}, ${darkG}, ${darkB}, 0.9)`);
          rightEdge.addColorStop(1, `rgba(${lr}, ${lg}, ${lb}, 0.0)`);
          ctx.fillStyle = rightEdge;
          ctx.fillRect(stripeX + stripeW - 20, 0, 30, H);

          // ── 6. VIGNETTE ───────────────────────────────────────────
          const vig = ctx.createRadialGradient(
            W / 2,
            H / 2,
            H * 0.2,
            W / 2,
            H / 2,
            H * 0.9,
          );
          vig.addColorStop(0, "rgba(0,0,0,0)");
          vig.addColorStop(1, "rgba(0,0,0,0.25)");
          ctx.fillStyle = vig;
          ctx.fillRect(0, 0, W, H);

          break;
        }

        case "GreenChevronJersey": {
          const W = ctx.canvas.width;
          const H = ctx.canvas.height;

          // ── Parse primaryColor into RGB for dynamic shades ──────────
          const gcR = parseInt(primaryColor.slice(1, 3), 16);
          const gcG = parseInt(primaryColor.slice(3, 5), 16);
          const gcB = parseInt(primaryColor.slice(5, 7), 16);

          // Dark chevron outline: 40% of primary
          const dkR = Math.round(gcR * 0.4);
          const dkG = Math.round(gcG * 0.4);
          const dkB = Math.round(gcB * 0.4);

          // Deeper dark for halftone / small chevrons: 30%
          const dpR = Math.round(gcR * 0.3);
          const dpG = Math.round(gcG * 0.3);
          const dpB = Math.round(gcB * 0.3);

          // ── 1. BASE BACKGROUND ──────────────────────────────────────
          ctx.fillStyle = primaryColor;
          ctx.fillRect(0, 0, W, H);

          // ── 2. CHEVRON / ZIGZAG PATTERN ─────────────────────────────
          const chevW = 48;
          const chevH = 28;
          const cols = Math.ceil(W / chevW) + 2;
          const rows = Math.ceil(H / chevH) + 2;

          for (let row = 0; row < rows; row++) {
            for (let col = -1; col < cols; col++) {
              const cx = col * chevW;
              const cy = row * chevH;

              ctx.beginPath();
              ctx.moveTo(cx, cy + chevH);
              ctx.lineTo(cx + chevW / 2, cy);
              ctx.lineTo(cx + chevW, cy + chevH);
              ctx.strokeStyle = `rgba(${dkR}, ${dkG}, ${dkB}, 0.55)`;
              ctx.lineWidth = 2.2;
              ctx.lineJoin = "round";
              ctx.stroke();

              const tickCount = 6;
              for (let t = 1; t <= tickCount; t++) {
                const frac = t / (tickCount + 1);
                const tx = cx + frac * (chevW / 2);
                const ty = cy + chevH - frac * chevH;
                const tickLen = (1 - frac) * (chevH * 0.55) + 2;
                ctx.beginPath();
                ctx.moveTo(tx, ty);
                ctx.lineTo(tx, ty + tickLen);
                ctx.strokeStyle = `rgba(${dkR}, ${dkG}, ${dkB}, ${0.25 + frac * 0.2})`;
                ctx.lineWidth = 0.7;
                ctx.stroke();
              }
              for (let t = 1; t <= tickCount; t++) {
                const frac = t / (tickCount + 1);
                const tx = cx + chevW / 2 + frac * (chevW / 2);
                const ty = cy + frac * chevH;
                const tickLen = frac * (chevH * 0.55) + 2;
                ctx.beginPath();
                ctx.moveTo(tx, ty);
                ctx.lineTo(tx, ty + tickLen);
                ctx.strokeStyle = `rgba(${dkR}, ${dkG}, ${dkB}, ${0.45 - frac * 0.2})`;
                ctx.lineWidth = 0.7;
                ctx.stroke();
              }
            }
          }

          // ── 3. SECONDARY SMALLER CHEVRON LAYER (depth effect) ───────
          const sChevW = 24;
          const sChevH = 14;
          const sCols = Math.ceil(W / sChevW) + 2;
          const sRows = Math.ceil(H / sChevH) + 2;

          for (let sRow = 0; sRow < sRows; sRow++) {
            for (let sCol = -1; sCol < sCols; sCol++) {
              const sx = sCol * sChevW + (sRow % 2 === 0 ? 0 : sChevW / 2);
              const sy = sRow * sChevH;
              ctx.beginPath();
              ctx.moveTo(sx, sy + sChevH);
              ctx.lineTo(sx + sChevW / 2, sy);
              ctx.lineTo(sx + sChevW, sy + sChevH);
              ctx.strokeStyle = `rgba(${dpR}, ${dpG}, ${dpB}, 0.18)`;
              ctx.lineWidth = 1.0;
              ctx.lineJoin = "round";
              ctx.stroke();
            }
          }

          // ── 4. HALFTONE FADE OVERLAY (bottom corners) ───────────────
          const dotSpacing = 14;
          for (let hy = 0; hy < H; hy += dotSpacing) {
            for (let hx = 0; hx < W; hx += dotSpacing) {
              const distLeft = Math.sqrt(hx ** 2 + (H - hy) ** 2);
              const distRight = Math.sqrt((W - hx) ** 2 + (H - hy) ** 2);
              const minDist = Math.min(distLeft, distRight);
              const maxDist = Math.sqrt((W / 2) ** 2 + H ** 2);
              const fade = 1 - Math.min(minDist / (maxDist * 0.65), 1);
              if (fade < 0.05) continue;
              const dotR = 3.5 * fade;
              ctx.beginPath();
              ctx.arc(hx, hy, dotR, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${dpR}, ${dpG}, ${dpB}, ${fade * 0.35})`;
              ctx.fill();
            }
          }

          // ── 5. CENTER VERTICAL SUBTLE LIGHTER STRIP ─────────────────
          const centerGrad = ctx.createLinearGradient(W * 0.35, 0, W * 0.65, 0);
          centerGrad.addColorStop(0, "rgba(255,255,255,0)");
          centerGrad.addColorStop(0.5, "rgba(255,255,255,0.08)");
          centerGrad.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = centerGrad;
          ctx.fillRect(0, 0, W, H);

          // ── 6. VIGNETTE ──────────────────────────────────────────────
          const gcVig = ctx.createRadialGradient(
            W / 2,
            H / 2,
            H * 0.25,
            W / 2,
            H / 2,
            H * 0.85,
          );
          gcVig.addColorStop(0, "rgba(0,0,0,0)");
          gcVig.addColorStop(1, "rgba(0,0,0,0.15)");
          ctx.fillStyle = gcVig;
          ctx.fillRect(0, 0, W, H);

          break;
        }

        case "RedCarbonJersey": {
          const W = ctx.canvas.width;
          const H = ctx.canvas.height;

          // Parse primaryColor
          const rcR = parseInt(primaryColor.slice(1, 3), 16) || 0;
          const rcG = parseInt(primaryColor.slice(3, 5), 16) || 0;
          const rcB = parseInt(primaryColor.slice(5, 7), 16) || 0;

          // Dark base (10% of primary)
          const baseR = Math.round(rcR * 0.1);
          const baseG = Math.round(rcG * 0.1);
          const baseB = Math.round(rcB * 0.1);
          ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
          ctx.fillRect(0, 0, W, H);

          // Carbon fiber weave
          const tileSize = 16;
          for (let y = 0; y < H; y += tileSize) {
            for (let x = 0; x < W; x += tileSize) {
              const isEven = (x / tileSize + y / tileSize) % 2 === 0;

              // Horizontal fiber
              const hGrad = ctx.createLinearGradient(x, y, x, y + tileSize / 2);
              const h0 = isEven ? 0.7 : 0.45;
              const h1 = isEven ? 0.85 : 0.6;
              const h2 = isEven ? 0.6 : 0.4;

              hGrad.addColorStop(
                0,
                `rgba(${Math.round(rcR * h0)}, ${Math.round(rcG * h0)}, ${Math.round(rcB * h0)}, 0.9)`,
              );
              hGrad.addColorStop(
                0.5,
                `rgba(${Math.round(rcR * h1)}, ${Math.round(rcG * h1)}, ${Math.round(rcB * h1)}, 1)`,
              );
              hGrad.addColorStop(
                1,
                `rgba(${Math.round(rcR * h2)}, ${Math.round(rcG * h2)}, ${Math.round(rcB * h2)}, 0.8)`,
              );
              ctx.fillStyle = hGrad;
              ctx.fillRect(x, y, tileSize, tileSize / 2);

              // Vertical fiber
              const vGrad = ctx.createLinearGradient(
                x,
                y + tileSize / 2,
                x,
                y + tileSize,
              );
              const v0 = isEven ? 0.45 : 0.7;
              const v1 = isEven ? 0.6 : 0.85;
              const v2 = isEven ? 0.4 : 0.6;

              vGrad.addColorStop(
                0,
                `rgba(${Math.round(rcR * v0)}, ${Math.round(rcG * v0)}, ${Math.round(rcB * v0)}, 0.9)`,
              );
              vGrad.addColorStop(
                0.5,
                `rgba(${Math.round(rcR * v1)}, ${Math.round(rcG * v1)}, ${Math.round(rcB * v1)}, 1)`,
              );
              vGrad.addColorStop(
                1,
                `rgba(${Math.round(rcR * v2)}, ${Math.round(rcG * v2)}, ${Math.round(rcB * v2)}, 0.8)`,
              );
              ctx.fillStyle = vGrad;
              ctx.fillRect(x, y + tileSize / 2, tileSize, tileSize / 2);

              // Grid lines
              ctx.strokeStyle = "rgba(0,0,0,0.8)";
              ctx.lineWidth = 0.8;
              ctx.strokeRect(x, y, tileSize, tileSize / 2);
              ctx.strokeRect(x, y + tileSize / 2, tileSize, tileSize / 2);
            }
          }

          // Diagonal speed slash — left
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(0, H * 0.3);
          ctx.lineTo(W * 0.45, 0);
          ctx.lineTo(W * 0.55, 0);
          ctx.lineTo(W * 0.1, H);
          ctx.lineTo(0, H);
          ctx.closePath();
          const slashL = ctx.createLinearGradient(0, 0, W * 0.5, 0);
          slashL.addColorStop(0, `rgba(${rcR}, ${rcG}, ${rcB}, 0.22)`);
          slashL.addColorStop(1, `rgba(${rcR}, ${rcG}, ${rcB}, 0)`);
          ctx.fillStyle = slashL;
          ctx.fill();
          ctx.restore();

          // Diagonal speed slash — right
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(W, H * 0.3);
          ctx.lineTo(W * 0.55, 0);
          ctx.lineTo(W * 0.45, 0);
          ctx.lineTo(W * 0.9, H);
          ctx.lineTo(W, H);
          ctx.closePath();
          const slashR = ctx.createLinearGradient(W, 0, W * 0.5, 0);
          slashR.addColorStop(0, `rgba(${rcR}, ${rcG}, ${rcB}, 0.22)`);
          slashR.addColorStop(1, `rgba(${rcR}, ${rcG}, ${rcB}, 0)`);
          ctx.fillStyle = slashR;
          ctx.fill();
          ctx.restore();

          // Horizontal scan lines
          for (let y = 0; y < H; y += 3) {
            ctx.fillStyle = "rgba(0,0,0,0.12)";
            ctx.fillRect(0, y, W, 1);
          }

          // Center bright stripe
          const centerGlow = ctx.createLinearGradient(W * 0.42, 0, W * 0.58, 0);
          const glowColorStr = `rgba(${Math.min(255, rcR + 30)}, ${Math.min(255, rcG + 30)}, ${Math.min(255, rcB + 30)}, 0.12)`;
          centerGlow.addColorStop(0, "rgba(255,255,255,0)");
          centerGlow.addColorStop(0.5, glowColorStr);
          centerGlow.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = centerGlow;
          ctx.fillRect(0, 0, W, H);

          // Vignette
          const vig = ctx.createRadialGradient(
            W / 2,
            H / 2,
            H * 0.15,
            W / 2,
            H / 2,
            H * 0.9,
          );
          vig.addColorStop(0, "rgba(0,0,0,0)");
          vig.addColorStop(1, "rgba(0,0,0,0.55)");
          ctx.fillStyle = vig;
          ctx.fillRect(0, 0, W, H);

          break;
        }

        case "GoldDiamondJersey": {
          const W = ctx.canvas.width;
          const H = ctx.canvas.height;

          // Parse primaryColor
          const gdR = parseInt(primaryColor.slice(1, 3), 16) || 0;
          const gdG = parseInt(primaryColor.slice(3, 5), 16) || 0;
          const gdB = parseInt(primaryColor.slice(5, 7), 16) || 0;

          const gdSeed = (s: number) => {
            const x = Math.sin(s) * 10000;
            return x - Math.floor(x);
          };

          // Deep base (10% of primary)
          ctx.fillStyle = `rgb(${Math.round(gdR * 0.1)}, ${Math.round(gdG * 0.1)}, ${Math.round(gdB * 0.1)})`;
          ctx.fillRect(0, 0, W, H);

          // Diamond grid (accent colors derived from primary)
          const dSize = 36;
          const cols = Math.ceil(W / dSize) + 2;
          const rows = Math.ceil(H / (dSize * 0.5)) + 2;

          for (let row = -1; row < rows; row++) {
            for (let col = -1; col < cols; col++) {
              const cx = col * dSize + (row % 2 === 0 ? 0 : dSize / 2);
              const cy = row * dSize * 0.5;

              // Diamond shape
              ctx.beginPath();
              ctx.moveTo(cx, cy - dSize * 0.45); // top
              ctx.lineTo(cx + dSize * 0.45, cy); // right
              ctx.lineTo(cx, cy + dSize * 0.45); // bottom
              ctx.lineTo(cx - dSize * 0.45, cy); // left
              ctx.closePath();

              const dGrad = ctx.createRadialGradient(
                cx,
                cy,
                0,
                cx,
                cy,
                dSize * 0.45,
              );
              dGrad.addColorStop(0, `rgba(${gdR}, ${gdG}, ${gdB}, 0.18)`);
              dGrad.addColorStop(
                0.6,
                `rgba(${Math.round(gdR * 0.8)}, ${Math.round(gdG * 0.8)}, ${Math.round(gdB * 0.8)}, 0.10)`,
              );
              dGrad.addColorStop(
                1,
                `rgba(${Math.round(gdR * 0.6)}, ${Math.round(gdG * 0.6)}, ${Math.round(gdB * 0.6)}, 0.05)`,
              );
              ctx.fillStyle = dGrad;
              ctx.fill();

              ctx.strokeStyle = `rgba(${gdR}, ${gdG}, ${gdB}, 0.40)`;
              ctx.lineWidth = 0.9;
              ctx.stroke();

              // Inner small diamond
              ctx.beginPath();
              ctx.moveTo(cx, cy - dSize * 0.18);
              ctx.lineTo(cx + dSize * 0.18, cy);
              ctx.lineTo(cx, cy + dSize * 0.18);
              ctx.lineTo(cx - dSize * 0.18, cy);
              ctx.closePath();
              ctx.strokeStyle = `rgba(${gdR}, ${gdG}, ${gdB}, 0.25)`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }

          // Scattered flare dots
          for (let i = 0; i < 200; i++) {
            const x = gdSeed(i * 7) * W;
            const y = gdSeed(i * 7 + 1) * H;
            const r = gdSeed(i * 7 + 2) * 1.8 + 0.3;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${gdR}, ${gdG}, ${gdB}, ${0.1 + gdSeed(i * 7 + 3) * 0.35})`;
            ctx.fill();
          }

          // Left diagonal band
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(W * 0.18, 0);
          ctx.lineTo(0, H * 0.35);
          ctx.closePath();
          const bandL = ctx.createLinearGradient(0, 0, W * 0.18, H * 0.35);
          bandL.addColorStop(0, `rgba(${gdR}, ${gdG}, ${gdB}, 0.35)`);
          bandL.addColorStop(1, `rgba(${gdR}, ${gdG}, ${gdB}, 0)`);
          ctx.fillStyle = bandL;
          ctx.fill();
          ctx.restore();

          // Right diagonal band
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(W, 0);
          ctx.lineTo(W * 0.82, 0);
          ctx.lineTo(W, H * 0.35);
          ctx.closePath();
          const bandR = ctx.createLinearGradient(W, 0, W * 0.82, H * 0.35);
          bandR.addColorStop(0, `rgba(${gdR}, ${gdG}, ${gdB}, 0.35)`);
          bandR.addColorStop(1, `rgba(${gdR}, ${gdG}, ${gdB}, 0)`);
          ctx.fillStyle = bandR;
          ctx.fill();
          ctx.restore();

          // Bottom shimmer
          const bottomShimmer = ctx.createLinearGradient(0, H * 0.7, 0, H);
          bottomShimmer.addColorStop(0, `rgba(${gdR}, ${gdG}, ${gdB}, 0)`);
          bottomShimmer.addColorStop(1, `rgba(${gdR}, ${gdG}, ${gdB}, 0.12)`);
          ctx.fillStyle = bottomShimmer;
          ctx.fillRect(0, H * 0.7, W, H * 0.3);

          // Vignette
          const vig = ctx.createRadialGradient(
            W / 2,
            H * 0.4,
            H * 0.1,
            W / 2,
            H / 2,
            H * 0.9,
          );
          vig.addColorStop(0, "rgba(0,0,0,0)");
          vig.addColorStop(1, "rgba(0,0,0,0.6)");
          ctx.fillStyle = vig;
          ctx.fillRect(0, 0, W, H);

          break;
        }

        case "PurpleHexTechJersey": {
          const W = ctx.canvas.width;
          const H = ctx.canvas.height;

          // Parse primaryColor
          const phR = parseInt(primaryColor.slice(1, 3), 16) || 0;
          const phG = parseInt(primaryColor.slice(3, 5), 16) || 0;
          const phB = parseInt(primaryColor.slice(5, 7), 16) || 0;

          const phSeed = (s: number) => {
            const x = Math.sin(s) * 10000;
            return x - Math.floor(x);
          };

          // Dark base (10% of primary)
          ctx.fillStyle = `rgb(${Math.round(phR * 0.1)}, ${Math.round(phG * 0.1)}, ${Math.round(phB * 0.1)})`;
          ctx.fillRect(0, 0, W, H);

          // Hex grid
          const hexR = 28;
          const hexW = hexR * 2;
          const hexH = Math.sqrt(3) * hexR;
          const cols = Math.ceil(W / (hexW * 0.75)) + 2;
          const rows = Math.ceil(H / hexH) + 2;

          const hexPath = (cx: number, cy: number, r: number) => {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i - Math.PI / 6;
              const px = cx + r * Math.cos(angle);
              const py = cy + r * Math.sin(angle);
              if (i === 0) {
                ctx.moveTo(px, py);
              } else {
                ctx.lineTo(px, py);
              }
            }
            ctx.closePath();
          };

          for (let row = -1; row < rows; row++) {
            for (let col = -1; col < cols; col++) {
              const cx = col * hexW * 0.75;
              const cy = row * hexH + (col % 2 === 0 ? 0 : hexH / 2);

              // Outer hex
              hexPath(cx, cy, hexR * 0.92);
              const hGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, hexR);
              hGrad.addColorStop(0, `rgba(${phR}, ${phG}, ${phB}, 0.12)`);
              hGrad.addColorStop(
                1,
                `rgba(${Math.round(phR * 0.5)}, ${Math.round(phG * 0.5)}, ${Math.round(phB * 0.5)}, 0.04)`,
              );
              ctx.fillStyle = hGrad;
              ctx.fill();
              ctx.strokeStyle = `rgba(${phR}, ${phG}, ${phB}, 0.45)`;
              ctx.lineWidth = 0.9;
              ctx.stroke();

              // Inner hex
              hexPath(cx, cy, hexR * 0.55);
              ctx.strokeStyle = `rgba(${phR}, ${phG}, ${phB}, 0.20)`;
              ctx.lineWidth = 0.5;
              ctx.stroke();

              // Center dot — random intensity
              const intensity = phSeed(row * 100 + col);
              if (intensity > 0.6) {
                ctx.beginPath();
                ctx.arc(
                  cx,
                  cy,
                  2.5 * (intensity - 0.6) * 2.5 + 0.5,
                  0,
                  Math.PI * 2,
                );
                ctx.fillStyle = `rgba(${phR}, ${phG}, ${phB}, ${(intensity - 0.6) * 1.5})`;
                ctx.fill();
              }
            }
          }

          // Diagonal light streaks
          for (let i = 0; i < 8; i++) {
            const sx = phSeed(i * 4) * W;
            const angle = -0.6 + phSeed(i * 4 + 1) * 0.3;
            const len = H * 1.5;
            const thick = 1 + phSeed(i * 4 + 2) * 3;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx + Math.tan(angle) * len, len);
            ctx.strokeStyle = `rgba(${phR}, ${phG}, ${phB}, ${0.05 + phSeed(i * 4 + 3) * 0.12})`;
            ctx.lineWidth = thick;
            ctx.stroke();
            ctx.restore();
          }

          // Bottom to top gradient glow
          const glow = ctx.createLinearGradient(0, H, 0, 0);
          glow.addColorStop(0, `rgba(${phR}, ${phG}, ${phB}, 0.30)`);
          glow.addColorStop(0.5, `rgba(${phR}, ${phG}, ${phB}, 0.08)`);
          glow.addColorStop(1, `rgba(${phR}, ${phG}, ${phB}, 0.0)`);
          ctx.fillStyle = glow;
          ctx.fillRect(0, 0, W, H);

          // Horizontal scan lines
          for (let y = 0; y < H; y += 4) {
            ctx.fillStyle = "rgba(0,0,0,0.08)";
            ctx.fillRect(0, y, W, 1.5);
          }

          // Vignette
          const vig = ctx.createRadialGradient(
            W / 2,
            H / 2,
            H * 0.1,
            W / 2,
            H / 2,
            H * 0.85,
          );
          vig.addColorStop(0, "rgba(0,0,0,0)");
          vig.addColorStop(1, "rgba(0,0,0,0.65)");
          ctx.fillStyle = vig;
          ctx.fillRect(0, 0, W, H);

          break;
        }

        case "OrangeCamoWaveJersey": {
          const W = ctx.canvas.width;
          const H = ctx.canvas.height;

          // Parse primaryColor
          const ocR = parseInt(primaryColor.slice(1, 3), 16) || 0;
          const ocG = parseInt(primaryColor.slice(3, 5), 16) || 0;
          const ocB = parseInt(primaryColor.slice(5, 7), 16) || 0;

          const ocSeed = (s: number) => {
            const x = Math.sin(s) * 10000;
            return x - Math.floor(x);
          };

          // Deep base (15% of primary)
          ctx.fillStyle = `rgb(${Math.round(ocR * 0.15)}, ${Math.round(ocG * 0.15)}, ${Math.round(ocB * 0.15)})`;
          ctx.fillRect(0, 0, W, H);

          // Wavy camo blobs
          const camoColors = [
            `rgba(${ocR}, ${ocG}, ${ocB}, 0.55)`,
            `rgba(${Math.round(ocR * 0.85)}, ${Math.round(ocG * 0.85)}, ${Math.round(ocB * 0.85)}, 0.45)`,
            `rgba(${Math.min(255, Math.round(ocR * 1.15))}, ${Math.min(255, Math.round(ocG * 1.15))}, ${Math.min(255, Math.round(ocB * 1.15))}, 0.35)`,
            `rgba(${Math.round(ocR * 0.7)}, ${Math.round(ocG * 0.7)}, ${Math.round(ocB * 0.7)}, 0.50)`,
            `rgba(${Math.min(255, Math.round(ocR * 1.05))}, ${Math.min(255, Math.round(ocG * 1.05))}, ${Math.min(255, Math.round(ocB * 1.05))}, 0.40)`,
          ];

          for (let i = 0; i < 55; i++) {
            const cx = ocSeed(i * 5) * W;
            const cy = ocSeed(i * 5 + 1) * H;
            const rx = 30 + ocSeed(i * 5 + 2) * 100;
            const ry = 20 + ocSeed(i * 5 + 3) * 70;
            const rot = ocSeed(i * 5 + 4) * Math.PI;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rot);

            ctx.beginPath();
            const pts = 7;
            for (let p = 0; p < pts; p++) {
              const a = (p / pts) * Math.PI * 2;
              const jitter = 0.6 + ocSeed(i * 20 + p) * 0.8;
              const bx = Math.cos(a) * rx * jitter;
              const by = Math.sin(a) * ry * jitter;
              const cpx = Math.cos(a - 0.4) * rx * (jitter + 0.2);
              const cpy = Math.sin(a - 0.4) * ry * (jitter + 0.2);
              if (p === 0) {
                ctx.moveTo(bx, by);
              } else {
                ctx.quadraticCurveTo(cpx, cpy, bx, by);
              }
            }
            ctx.closePath();
            ctx.fillStyle = camoColors[i % camoColors.length];
            ctx.fill();
            ctx.restore();
          }

          // Horizontal wave lines
          for (let y = 0; y < H; y += 10) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            for (let x = 0; x <= W; x += 8) {
              const waveY = y + Math.sin((x / W) * Math.PI * 6 + y * 0.05) * 3;
              ctx.lineTo(x, waveY);
            }
            ctx.strokeStyle = `rgba(${ocR}, ${ocG}, ${ocB}, ${0.04 + (y / H) * 0.06})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }

          // Scattered pixel noise
          for (let i = 0; i < 800; i++) {
            const px = ocSeed(i * 3) * W;
            const py = ocSeed(i * 3 + 1) * H;
            const ps = ocSeed(i * 3 + 2) * 2.5 + 0.5;
            ctx.fillStyle = `rgba(${ocR}, ${ocG}, ${ocB}, ${ocSeed(i * 3 + 3) * 0.3})`;
            ctx.fillRect(px, py, ps, ps);
          }

          // Two diagonal dark slash bands
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(W * 0.25, 0);
          ctx.lineTo(W * 0.35, 0);
          ctx.lineTo(W * 0.1, H);
          ctx.lineTo(0, H);
          ctx.closePath();
          ctx.fillStyle = "rgba(0,0,0,0.25)";
          ctx.fill();
          ctx.restore();

          // Another diagonal dark slash band
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(W * 0.65, 0);
          ctx.lineTo(W * 0.75, 0);
          ctx.lineTo(W * 0.9, H);
          ctx.lineTo(W * 1.0, H);
          ctx.closePath();
          ctx.fillStyle = "rgba(0,0,0,0.25)";
          ctx.fill();
          ctx.restore();

          // Glow center
          const glowCenter = ctx.createRadialGradient(
            W / 2,
            H * 0.45,
            0,
            W / 2,
            H * 0.45,
            W * 0.55,
          );
          glowCenter.addColorStop(0, `rgba(${ocR}, ${ocG}, ${ocB}, 0.18)`);
          glowCenter.addColorStop(1, `rgba(${ocR}, ${ocG}, ${ocB}, 0)`);
          ctx.fillStyle = glowCenter;
          ctx.fillRect(0, 0, W, H);

          // Vignette
          const vig = ctx.createRadialGradient(
            W / 2,
            H / 2,
            H * 0.15,
            W / 2,
            H / 2,
            H * 0.9,
          );
          vig.addColorStop(0, "rgba(0,0,0,0)");
          vig.addColorStop(1, "rgba(0,0,0,0.60)");
          ctx.fillStyle = vig;
          ctx.fillRect(0, 0, W, H);

          break;
        }

        // ============================================================
        // 1. RED SHARD ENERGY JERSEY
        // ============================================================

        case "RedShardEnergy": {
          const W = ctx.canvas.width;
          const H = ctx.canvas.height;

          // Parse primaryColor
          const rcR = parseInt(primaryColor.slice(1, 3), 16) || 0;
          const rcG = parseInt(primaryColor.slice(3, 5), 16) || 0;
          const rcB = parseInt(primaryColor.slice(5, 7), 16) || 0;

          // Base (20% of primary)
          ctx.fillStyle = `rgb(${Math.round(rcR * 0.2)}, ${Math.round(rcG * 0.2)}, ${Math.round(rcB * 0.2)})`;
          ctx.fillRect(0, 0, W, H);

          // Side panels
          const sideGrad = ctx.createLinearGradient(0, 0, W, 0);
          sideGrad.addColorStop(0, `rgb(${rcR}, ${rcG}, ${rcB})`);
          sideGrad.addColorStop(
            0.5,
            `rgb(${Math.round(rcR * 0.35)}, ${Math.round(rcG * 0.35)}, ${Math.round(rcB * 0.35)})`,
          );
          sideGrad.addColorStop(1, `rgb(${rcR}, ${rcG}, ${rcB})`);
          ctx.fillStyle = sideGrad;
          ctx.fillRect(0, 0, W, H);

          // Central dark strip
          ctx.fillStyle = `rgb(${Math.round(rcR * 0.12)}, ${Math.round(rcG * 0.12)}, ${Math.round(rcB * 0.12)})`;
          ctx.fillRect(W * 0.32, 0, W * 0.36, H);

          // Random angular shards
          for (let i = 0; i < 120; i++) {
            const x = Math.random() * W;
            const y = Math.random() * H;
            const size = 20 + Math.random() * 120;
            const angle = Math.random() * Math.PI * 2;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
            ctx.lineTo(
              x + Math.cos(angle + 0.8) * size * 0.5,
              y + Math.sin(angle + 0.8) * size * 0.5,
            );
            ctx.closePath();

            if (Math.random() > 0.5) {
              ctx.fillStyle = "rgba(255,255,255,0.08)";
              ctx.fill();
            } else {
              ctx.strokeStyle = "rgba(255,255,255,0.12)";
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }

          // Energy streaks
          ctx.save();
          ctx.strokeStyle = `rgba(${Math.min(255, rcR + 50)}, ${Math.min(255, rcG + 50)}, ${Math.min(255, rcB + 50)}, 0.18)`;
          for (let i = 0; i < 80; i++) {
            const x = Math.random() * W;
            ctx.lineWidth = 1 + Math.random() * 2;

            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 100, H);
            ctx.stroke();
          }
          ctx.restore();

          // Vignette
          const vg = ctx.createRadialGradient(
            W / 2,
            H / 2,
            H * 0.2,
            W / 2,
            H / 2,
            H,
          );
          vg.addColorStop(0, "rgba(0,0,0,0)");
          vg.addColorStop(1, "rgba(0,0,0,0.4)");

          ctx.fillStyle = vg;
          ctx.fillRect(0, 0, W, H);

          break;
        }

        // ============================================================
        // 2. NEON CYBER GRID JERSEY
        // ============================================================

        case "NeonCyberGrid": {
          const W = ctx.canvas.width;
          const H = ctx.canvas.height;

          // Parse primaryColor
          const ncR = parseInt(primaryColor.slice(1, 3), 16) || 0;
          const ncG = parseInt(primaryColor.slice(3, 5), 16) || 0;
          const ncB = parseInt(primaryColor.slice(5, 7), 16) || 0;

          // Background (extremely dark primary blend)
          ctx.fillStyle = `rgb(${Math.round(ncR * 0.05 + 5)}, ${Math.round(ncG * 0.05 + 10)}, ${Math.round(ncB * 0.05 + 20)})`;
          ctx.fillRect(0, 0, W, H);

          // Neon side glow
          const glow = ctx.createLinearGradient(0, 0, W, 0);
          glow.addColorStop(0, `rgb(${ncR}, ${ncG}, ${ncB})`);
          glow.addColorStop(
            0.5,
            `rgb(${Math.round(ncR * 0.05 + 5)}, ${Math.round(ncG * 0.05 + 10)}, ${Math.round(ncB * 0.05 + 20)})`,
          );
          glow.addColorStop(
            1,
            `rgb(${Math.min(255, ncR + 80)}, ${Math.min(255, ncG + 80)}, ${Math.min(255, ncB + 80)})`,
          ); // Lighter tint of primary

          ctx.fillStyle = glow;
          ctx.globalAlpha = 0.18;
          ctx.fillRect(0, 0, W, H);
          ctx.globalAlpha = 1;

          // Grid lines
          ctx.strokeStyle = `rgba(${ncR}, ${ncG}, ${ncB}, 0.08)`;
          ctx.lineWidth = 1;

          for (let x = 0; x < W; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
          }

          for (let y = 0; y < H; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
          }

          // Hexagon pattern helper
          const drawHex = (hx: number, hy: number, hr: number) => {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const a = (Math.PI / 3) * i;
              const px = hx + Math.cos(a) * hr;
              const py = hy + Math.sin(a) * hr;
              if (i === 0) {
                ctx.moveTo(px, py);
              } else {
                ctx.lineTo(px, py);
              }
            }
            ctx.closePath();
          };

          for (let y = 0; y < H; y += 70) {
            for (let x = 0; x < W; x += 70) {
              drawHex(x, y, 24);

              ctx.strokeStyle =
                Math.random() > 0.5
                  ? `rgba(${ncR}, ${ncG}, ${ncB}, 0.14)`
                  : `rgba(${Math.min(255, ncR + 80)}, ${Math.min(255, ncG + 80)}, ${Math.min(255, ncB + 80)}, 0.14)`;

              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          }

          // Center stripe
          ctx.fillStyle = "rgba(255,255,255,0.04)";
          ctx.fillRect(W * 0.42, 0, W * 0.16, H);

          break;
        }

        // ============================================================
        // 3. GREEN TOXIC SMOKE JERSEY
        // ============================================================

        case "GreenToxicSmoke": {
          const W = ctx.canvas.width;
          const H = ctx.canvas.height;

          // Parse primaryColor
          const tsR = parseInt(primaryColor.slice(1, 3), 16) || 0;
          const tsG = parseInt(primaryColor.slice(3, 5), 16) || 0;
          const tsB = parseInt(primaryColor.slice(5, 7), 16) || 0;

          // Base (10% of primary)
          ctx.fillStyle = `rgb(${Math.round(tsR * 0.1)}, ${Math.round(tsG * 0.1)}, ${Math.round(tsB * 0.1)})`;
          ctx.fillRect(0, 0, W, H);

          // Toxic gradients
          const grad = ctx.createLinearGradient(0, 0, W, H);
          grad.addColorStop(
            0,
            `rgb(${Math.min(255, Math.round(tsR * 1.3))}, ${Math.min(255, Math.round(tsG * 1.3))}, ${Math.min(255, Math.round(tsB * 1.3))})`,
          );
          grad.addColorStop(
            0.5,
            `rgb(${Math.round(tsR * 0.18)}, ${Math.round(tsG * 0.18)}, ${Math.round(tsB * 0.18)})`,
          );
          grad.addColorStop(
            1,
            `rgb(${Math.min(255, Math.round(tsR * 1.1))}, ${Math.min(255, Math.round(tsG * 1.1))}, ${Math.min(255, Math.round(tsB * 1.1))})`,
          );

          ctx.globalAlpha = 0.25;
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, W, H);
          ctx.globalAlpha = 1;

          // Smoke blobs
          for (let i = 0; i < 80; i++) {
            const x = Math.random() * W;
            const y = Math.random() * H;
            const r = 40 + Math.random() * 140;

            const smoke = ctx.createRadialGradient(x, y, 0, x, y, r);
            smoke.addColorStop(0, `rgba(${tsR}, ${tsG}, ${tsB}, 0.18)`);
            smoke.addColorStop(1, `rgba(${tsR}, ${tsG}, ${tsB}, 0)`);

            ctx.fillStyle = smoke;

            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
          }

          // Acid scratches
          ctx.strokeStyle = `rgba(${Math.min(255, tsR + 80)}, ${Math.min(255, tsG + 80)}, ${Math.min(255, tsB + 80)}, 0.15)`;

          for (let i = 0; i < 150; i++) {
            const x = Math.random() * W;
            const y = Math.random() * H;

            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(
              x + (Math.random() - 0.5) * 120,
              y + (Math.random() - 0.5) * 120,
            );
            ctx.stroke();
          }

          // Dark center panel
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.fillRect(W * 0.3, 0, W * 0.4, H);

          break;
        }

        // ============================================================
        // 4. PURPLE WAVE MOTION JERSEY
        // ============================================================

        case "PurpleWaveMotion": {
          const W = ctx.canvas.width;
          const H = ctx.canvas.height;

          // Parse primaryColor
          const wmR = parseInt(primaryColor.slice(1, 3), 16) || 0;
          const wmG = parseInt(primaryColor.slice(3, 5), 16) || 0;
          const wmB = parseInt(primaryColor.slice(5, 7), 16) || 0;

          // Background (8% of primary)
          ctx.fillStyle = `rgb(${Math.round(wmR * 0.08)}, ${Math.round(wmG * 0.08)}, ${Math.round(wmB * 0.08)})`;
          ctx.fillRect(0, 0, W, H);

          // Side lighting
          const lg = ctx.createLinearGradient(0, 0, W, 0);
          lg.addColorStop(0, `rgb(${wmR}, ${wmG}, ${wmB})`);
          lg.addColorStop(
            0.5,
            `rgb(${Math.round(wmR * 0.08)}, ${Math.round(wmG * 0.08)}, ${Math.round(wmB * 0.08)})`,
          );
          lg.addColorStop(
            1,
            `rgb(${Math.min(255, wmR + 80)}, ${Math.min(255, wmG + 80)}, ${Math.min(255, wmB + 80)})`,
          ); // Lighter tint of primary

          ctx.globalAlpha = 0.3;
          ctx.fillStyle = lg;
          ctx.fillRect(0, 0, W, H);
          ctx.globalAlpha = 1;

          // Flowing waves
          for (let i = 0; i < 18; i++) {
            const offset = i * 40;

            ctx.beginPath();

            for (let x = 0; x <= W; x += 10) {
              const y = H / 2 + Math.sin((x + offset) * 0.015) * 40 + i * 18;

              if (x === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }

            ctx.strokeStyle =
              i % 2 === 0
                ? "rgba(255,255,255,0.08)"
                : `rgba(${Math.min(255, wmR + 80)}, ${Math.min(255, wmG + 80)}, ${Math.min(255, wmB + 80)}, 0.12)`;

            ctx.lineWidth = 2;
            ctx.stroke();
          }

          // Dots overlay
          for (let i = 0; i < 500; i++) {
            const x = Math.random() * W;
            const y = Math.random() * H;

            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 2, 0, Math.PI * 2);

            ctx.fillStyle = "rgba(255,255,255,0.12)";
            ctx.fill();
          }

          // Vertical center fade
          const center = ctx.createLinearGradient(W * 0.3, 0, W * 0.7, 0);

          center.addColorStop(0, "rgba(0,0,0,0)");
          center.addColorStop(0.5, "rgba(255,255,255,0.05)");
          center.addColorStop(1, "rgba(0,0,0,0)");

          ctx.fillStyle = center;
          ctx.fillRect(0, 0, W, H);

          break;
        }

        case "FlameStripeJersey": {
          const W = ctx.canvas.width;
          const H = ctx.canvas.height;

          // Parse primaryColor
          const fsR = parseInt(primaryColor.slice(1, 3), 16) || 0;
          const fsG = parseInt(primaryColor.slice(3, 5), 16) || 0;
          const fsB = parseInt(primaryColor.slice(5, 7), 16) || 0;

          // Derived colors
          const lightBase = `rgb(${Math.min(255, Math.round(fsR * 0.12 + 230))}, ${Math.min(255, Math.round(fsG * 0.12 + 235))}, ${Math.min(255, Math.round(fsB * 0.12 + 240))})`;
          const spikeColor = `rgb(${fsR}, ${fsG}, ${fsB})`; // primary color spikes
          const darkColor = `rgb(${Math.round(fsR * 0.15)}, ${Math.round(fsG * 0.15)}, ${Math.round(fsB * 0.15)})`; // very dark accent spikes

          // Light base
          ctx.fillStyle = lightBase;
          ctx.fillRect(0, 0, W, H);

          // Flame / Spike generator (arrow function — valid inside case block)
          const drawSpike = (
            cx: number,
            topY: number,
            botY: number,
            maxW: number,
            color: string,
            pointUp: boolean,
          ) => {
            const midY = topY + (botY - topY) * 0.35;

            ctx.beginPath();
            if (!pointUp) {
              // Wide at top, tapers to point at bottom
              ctx.moveTo(cx, botY);
              ctx.bezierCurveTo(
                cx - maxW * 0.3,
                botY - (botY - topY) * 0.3,
                cx - maxW,
                midY,
                cx - maxW * 0.8,
                topY,
              );
              ctx.bezierCurveTo(
                cx - maxW * 0.3,
                topY,
                cx + maxW * 0.3,
                topY,
                cx + maxW * 0.8,
                topY,
              );
              ctx.bezierCurveTo(
                cx + maxW,
                midY,
                cx + maxW * 0.3,
                botY - (botY - topY) * 0.3,
                cx,
                botY,
              );
            } else {
              // Wide at bottom, tapers to point at top
              const midY2 = topY + (botY - topY) * 0.65;
              ctx.moveTo(cx, topY);
              ctx.bezierCurveTo(
                cx - maxW * 0.3,
                topY + (botY - topY) * 0.3,
                cx - maxW,
                midY2,
                cx - maxW * 0.8,
                botY,
              );
              ctx.bezierCurveTo(
                cx - maxW * 0.3,
                botY,
                cx + maxW * 0.3,
                botY,
                cx + maxW * 0.8,
                botY,
              );
              ctx.bezierCurveTo(
                cx + maxW,
                midY2,
                cx + maxW * 0.3,
                topY + (botY - topY) * 0.3,
                cx,
                topY,
              );
            }
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
          };

          // Column layout: primary | dark | primary | primary | dark | ...
          const colW = W / 11;

          const colPattern = [
            spikeColor, // primary
            darkColor, // dark accent
            spikeColor,
            spikeColor,
            darkColor,
            spikeColor,
            spikeColor,
            darkColor,
            spikeColor,
            spikeColor,
            darkColor,
          ];

          const fsSeed = (s: number) => {
            const x = Math.sin(s) * 10000;
            return x - Math.floor(x);
          };

          // Downward spikes (tip points down)
          for (let col = 0; col < colPattern.length; col++) {
            const cx = (col + 0.5) * colW;
            const color = colPattern[col];
            const spikeCount = 4 + Math.floor(fsSeed(col * 3) * 3);

            for (let s = 0; s < spikeCount; s++) {
              const topY = -20 + fsSeed(col * 10 + s) * H * 0.15;
              const height = H * 0.45 + fsSeed(col * 10 + s + 1) * H * 0.45;
              const botY = topY + height;
              const maxW = colW * (0.35 + fsSeed(col * 10 + s + 2) * 0.3);

              drawSpike(cx, topY, Math.min(botY, H + 20), maxW, color, false);
            }
          }

          // Upward spikes (tip points up)
          for (let col = 0; col < colPattern.length; col++) {
            const cx = (col + 0.5) * colW;
            const color = colPattern[col];
            const spikeCount = 3 + Math.floor(fsSeed(col * 7 + 50) * 3);

            for (let s = 0; s < spikeCount; s++) {
              const botY = H + 20 - fsSeed(col * 10 + s + 30) * H * 0.15;
              const height = H * 0.35 + fsSeed(col * 10 + s + 31) * H * 0.4;
              const topY = botY - height;
              const maxW = colW * (0.3 + fsSeed(col * 10 + s + 32) * 0.28);

              drawSpike(cx, Math.max(topY, -20), botY, maxW, color, true);
            }
          }

          // Half-column offset layer (fills gaps)
          for (let col = 0; col < colPattern.length - 1; col++) {
            const cx = (col + 1.0) * colW;
            const color = colPattern[(col + 1) % colPattern.length];
            const spikeCount = 2 + Math.floor(fsSeed(col * 13 + 200) * 2);

            for (let s = 0; s < spikeCount; s++) {
              const topY = -10 + fsSeed(col * 13 + s + 200) * H * 0.2;
              const height = H * 0.3 + fsSeed(col * 13 + s + 201) * H * 0.35;
              const botY = topY + height;
              const maxW = colW * (0.18 + fsSeed(col * 13 + s + 202) * 0.15);
              drawSpike(cx, topY, Math.min(botY, H + 10), maxW, color, false);
            }

            for (let s = 0; s < spikeCount; s++) {
              const botY = H + 10 - fsSeed(col * 13 + s + 210) * H * 0.15;
              const height = H * 0.25 + fsSeed(col * 13 + s + 211) * H * 0.3;
              const topY = botY - height;
              const maxW = colW * (0.18 + fsSeed(col * 13 + s + 212) * 0.15);
              drawSpike(cx, Math.max(topY, -10), botY, maxW, color, true);
            }
          }

          // Thin vertical base lines (between spikes)
          for (let col = 0; col < colPattern.length; col++) {
            const cx = (col + 0.5) * colW;
            ctx.beginPath();
            ctx.moveTo(cx, 0);
            ctx.lineTo(cx, H);
            ctx.strokeStyle =
              colPattern[col] === darkColor
                ? `rgba(${Math.round(fsR * 0.15)}, ${Math.round(fsG * 0.15)}, ${Math.round(fsB * 0.15)}, 0.15)`
                : `rgba(${fsR}, ${fsG}, ${fsB}, 0.12)`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }

          break;
        }

        case "GrungeTriangleJersey": {
          const W = ctx.canvas.width;
          const H = ctx.canvas.height;

          // ── Parse primaryColor into RGB ──────────────────────────────
          const pr = parseInt(primaryColor.slice(1, 3), 16);
          const pg = parseInt(primaryColor.slice(3, 5), 16);
          const pb = parseInt(primaryColor.slice(5, 7), 16);

          // Light side: 60% white blend
          const lr = Math.round(pr * 0.4 + 255 * 0.6);
          const lg = Math.round(pg * 0.4 + 255 * 0.6);
          const lb = Math.round(pb * 0.4 + 255 * 0.6);

          // Dark stripe: 40% of primary
          const darkR = Math.round(pr * 0.4);
          const darkG = Math.round(pg * 0.4);
          const darkB = Math.round(pb * 0.4);

          // Deep dark: 28% — triangles, dots, scratches
          const deepR = Math.round(pr * 0.28);
          const deepG = Math.round(pg * 0.28);
          const deepB = Math.round(pb * 0.28);

          const gtSeed = (s: number) => {
            const x = Math.sin(s) * 10000;
            return x - Math.floor(x);
          };

          // ── 1. BASE BACKGROUND ───────────────────────────────────────
          ctx.fillStyle = `rgb(${lr}, ${lg}, ${lb})`;
          ctx.fillRect(0, 0, W, H);

          // ── 2. SHARP TRIANGLE + GRUNGE SHAPES (full canvas) ─────────
          const drawSharpTriangles = (
            areaX: number,
            areaW: number,
            count: number,
            seedOffset: number,
          ) => {
            for (let i = 0; i < count; i++) {
              const r1 = gtSeed(i * 7 + seedOffset);
              const r2 = gtSeed(i * 7 + 1 + seedOffset);
              const r3 = gtSeed(i * 7 + 2 + seedOffset);
              const r4 = gtSeed(i * 7 + 3 + seedOffset);
              const r5 = gtSeed(i * 7 + 4 + seedOffset);
              const r6 = gtSeed(i * 7 + 5 + seedOffset);
              const r7 = gtSeed(i * 7 + 6 + seedOffset);

              const x1 = areaX + r1 * areaW;
              const y1 = r2 * H;

              // Sharp elongated triangles — like shattered glass
              const longSide = 30 + r3 * 130;
              const shortSide = 8 + r4 * 35;
              const angle = r5 * Math.PI * 2;

              const x2 = x1 + Math.cos(angle) * longSide;
              const y2 = y1 + Math.sin(angle) * longSide;
              const x3 = x1 + Math.cos(angle + 0.25) * shortSide;
              const y3 = y1 + Math.sin(angle + 0.25) * shortSide;

              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.lineTo(x3, y3);
              ctx.closePath();

              if (r6 > 0.45) {
                // Filled triangle
                ctx.fillStyle = `rgba(${deepR}, ${deepG}, ${deepB}, ${0.55 + r7 * 0.3})`;
                ctx.fill();
              } else {
                // Outlined triangle
                ctx.strokeStyle = `rgba(${deepR}, ${deepG}, ${deepB}, ${0.7 + r7 * 0.25})`;
                ctx.lineWidth = 1.0 + r6 * 2.5;
                ctx.stroke();
              }

              // Extra sharp shard lines radiating from triangle
              if (r6 > 0.2) {
                ctx.save();
                ctx.strokeStyle = `rgba(${deepR}, ${deepG}, ${deepB}, ${0.35 + r7 * 0.25})`;
                for (let sc = 0; sc < 4; sc++) {
                  const sx = x1 + (gtSeed(i * 15 + sc) - 0.5) * longSide * 0.8;
                  const sy =
                    y1 + (gtSeed(i * 15 + sc + 1) - 0.5) * longSide * 0.8;
                  const ex = sx + (gtSeed(i * 15 + sc + 2) - 0.5) * 45;
                  const ey = sy + (gtSeed(i * 15 + sc + 3) - 0.5) * 45;
                  ctx.lineWidth = 0.6 + gtSeed(i * 15 + sc + 4) * 1.2;
                  ctx.beginPath();
                  ctx.moveTo(sx, sy);
                  ctx.lineTo(ex, ey);
                  ctx.stroke();
                }
                ctx.restore();
              }

              // Grunge brush stroke blobs
              if (r7 > 0.55) {
                ctx.save();
                ctx.globalAlpha = 0.18 + r6 * 0.22;
                ctx.fillStyle = `rgb(${deepR}, ${deepG}, ${deepB})`;
                const blobX = x1 + (gtSeed(i * 9 + 1) - 0.5) * longSide;
                const blobY = y1 + (gtSeed(i * 9 + 2) - 0.5) * longSide;
                const blobW = 10 + gtSeed(i * 9 + 3) * 40;
                const blobH = 4 + gtSeed(i * 9 + 4) * 15;
                const blobA = gtSeed(i * 9 + 5) * Math.PI;
                ctx.translate(blobX, blobY);
                ctx.rotate(blobA);
                ctx.beginPath();
                ctx.ellipse(0, 0, blobW, blobH, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
              }
            }
          };

          // Draw triangles all over — dense coverage like image
          drawSharpTriangles(0, W * 0.42, 80, 1);
          drawSharpTriangles(W * 0.58, W * 0.42, 80, 77);
          // Extra layer for density
          drawSharpTriangles(0, W * 0.42, 40, 200);
          drawSharpTriangles(W * 0.58, W * 0.42, 40, 300);

          // ── 3. HALFTONE DOTS — transition into center stripe ─────────
          const drawHalftone = (
            startX: number,
            endX: number,
            startY: number,
            endY: number,
            fadeToCenter: boolean,
          ) => {
            const spacing = 16;
            for (let hy = startY; hy < endY; hy += spacing) {
              for (let hx = startX; hx < endX; hx += spacing) {
                const distFromCenter = Math.abs(hx - W / 2) / (W / 2);
                const fade = fadeToCenter ? 1 - distFromCenter : distFromCenter;
                const dotR = 5.5 * fade;
                if (dotR < 0.4) continue;
                ctx.beginPath();
                ctx.arc(hx, hy, dotR, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${deepR}, ${deepG}, ${deepB}, ${0.45 * fade + 0.08})`;
                ctx.fill();
              }
            }
          };

          // Top halftone band
          drawHalftone(0, W, 0, H * 0.12, false);
          // Bottom halftone band
          drawHalftone(0, W, H * 0.8, H, false);
          // Flanking the center stripe
          drawHalftone(W * 0.28, W * 0.72, 0, H, true);

          // ── 4. CENTER DARK STRIPE ────────────────────────────────────
          const stripeX = W * 0.32;
          const stripeW = W * 0.36;

          ctx.fillStyle = `rgb(${darkR}, ${darkG}, ${darkB})`;
          ctx.fillRect(stripeX, 0, stripeW, H);

          // Grunge scratch lines on stripe — near-vertical
          ctx.save();
          for (let i = 0; i < 150; i++) {
            const sx = stripeX + gtSeed(i * 2) * stripeW;
            const sy = gtSeed(i * 2 + 1) * H;
            const len = 30 + gtSeed(i * 3) * 110;
            const ang = -0.15 + gtSeed(i * 4) * 0.3;
            ctx.strokeStyle = `rgba(${(darkR * 0.6) | 0}, ${(darkG * 0.6) | 0}, ${(darkB * 0.6) | 0}, 0.55)`;
            ctx.lineWidth = 0.4 + gtSeed(i * 5) * 1.8;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
            ctx.stroke();
          }
          ctx.restore();

          // Stripe soft left edge
          const leftEdge = ctx.createLinearGradient(
            stripeX - 12,
            0,
            stripeX + 18,
            0,
          );
          leftEdge.addColorStop(0, `rgba(${lr}, ${lg}, ${lb}, 0.0)`);
          leftEdge.addColorStop(1, `rgba(${darkR}, ${darkG}, ${darkB}, 1.0)`);
          ctx.fillStyle = leftEdge;
          ctx.fillRect(stripeX - 12, 0, 30, H);

          // Stripe soft right edge
          const rightEdge = ctx.createLinearGradient(
            stripeX + stripeW - 18,
            0,
            stripeX + stripeW + 12,
            0,
          );
          rightEdge.addColorStop(0, `rgba(${darkR}, ${darkG}, ${darkB}, 1.0)`);
          rightEdge.addColorStop(1, `rgba(${lr}, ${lg}, ${lb}, 0.0)`);
          ctx.fillStyle = rightEdge;
          ctx.fillRect(stripeX + stripeW - 18, 0, 30, H);

          // ── 5. HALFTONE DOTS ON STRIPE (top & bottom) ────────────────
          drawHalftone(stripeX, stripeX + stripeW, 0, H * 0.14, false);
          drawHalftone(stripeX, stripeX + stripeW, H * 0.78, H, false);

          // ── 6. VIGNETTE ──────────────────────────────────────────────
          const vig = ctx.createRadialGradient(
            W / 2,
            H / 2,
            H * 0.18,
            W / 2,
            H / 2,
            H * 0.92,
          );
          vig.addColorStop(0, "rgba(0,0,0,0)");
          vig.addColorStop(1, "rgba(0,0,0,0.30)");
          ctx.fillStyle = vig;
          ctx.fillRect(0, 0, W, H);

          break;
        }

        case "Stripes": {
          ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
          for (let i = 0; i < size; i += 64) {
            ctx.fillRect(i, 0, 24, size);
            ctx.fillRect(i + 36, 0, 4, size);
          }
          ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
          for (let i = 24; i < size; i += 64) {
            ctx.fillRect(i, 0, 8, size);
          }
          break;
        }
        case "Diagonal": {
          ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
          ctx.lineWidth = 14;
          for (let i = -size; i < size * 2; i += 80) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + size, size);
            ctx.stroke();
          }
          ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
          ctx.lineWidth = 5;
          for (let i = -size + 20; i < size * 2; i += 80) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + size, size);
            ctx.stroke();
          }
          break;
        }
        case "Lightning": {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
          ctx.lineWidth = 4;
          for (let x = -50; x < size; x += 120) {
            ctx.beginPath();
            let curX = x;
            let curY = -20;
            ctx.moveTo(curX, curY);
            while (curY < size + 50) {
              const nextX = curX + (Math.random() > 0.5 ? 35 : -35);
              const nextY = curY + 45;
              ctx.lineTo(nextX, nextY);
              curX = nextX;
              curY = nextY;
            }
            ctx.stroke();
          }
          break;
        }
        case "Abstract": {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
          ctx.lineWidth = 4;
          for (let i = 0; i < size + 100; i += 40) {
            ctx.beginPath();
            for (let x = 0; x <= size; x += 10) {
              const y = i - 50 + Math.sin(x * 0.025 + i * 0.06) * 25;
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
          break;
        }
        case "Geometric": {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
          ctx.lineWidth = 2.5;
          const hexRadius = 24;
          const h = hexRadius * Math.sqrt(3);
          for (let y = -h; y < size + h; y += h) {
            for (
              let x = -hexRadius;
              x < size + hexRadius * 3;
              x += hexRadius * 3
            ) {
              ctx.beginPath();
              for (let angle = 0; angle < 360; angle += 60) {
                const rad = (angle * Math.PI) / 180;
                const px =
                  x +
                  hexRadius * Math.cos(rad) +
                  (y % (2 * h) === 0 ? 0 : hexRadius * 1.5);
                const py = y + hexRadius * Math.sin(rad);
                if (angle === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
              ctx.closePath();
              ctx.stroke();
            }
          }
          break;
        }
        case "Camouflage": {
          ctx.fillStyle = "rgba(0, 0, 0, 0.14)";
          for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            const cx = Math.random() * size;
            const cy = Math.random() * size;
            ctx.arc(cx, cy, 35, 0, Math.PI * 2);
            ctx.arc(cx + 20, cy + 10, 25, 0, Math.PI * 2);
            ctx.arc(cx - 15, cy + 20, 30, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
          for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            const cx = Math.random() * size;
            const cy = Math.random() * size;
            ctx.arc(cx, cy, 25, 0, Math.PI * 2);
            ctx.arc(cx - 15, cy - 10, 20, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        case "Minimal": {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
          ctx.lineWidth = 1.5;
          for (let x = 32; x < size; x += 64) {
            for (let y = 32; y < size; y += 64) {
              ctx.beginPath();
              ctx.moveTo(x - 6, y);
              ctx.lineTo(x + 6, y);
              ctx.moveTo(x, y - 6);
              ctx.lineTo(x, y + 6);
              ctx.stroke();
            }
          }
          break;
        }
        case "Gradient": {
          const grad = ctx.createLinearGradient(0, 0, size, size);
          grad.addColorStop(0, "rgba(255, 255, 255, 0.25)");
          grad.addColorStop(0.5, "rgba(0, 0, 0, 0.0)");
          grad.addColorStop(1, "rgba(0, 0, 0, 0.35)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, size, size);
          break;
        }
        case "Diamond": {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
          ctx.lineWidth = 2.5;
          const w = 40;
          const h = 60;
          for (let x = 0; x < size + w; x += w) {
            for (let y = 0; y < size + h; y += h) {
              ctx.beginPath();
              ctx.moveTo(x, y - h / 2);
              ctx.lineTo(x + w / 2, y);
              ctx.lineTo(x, y + h / 2);
              ctx.lineTo(x - w / 2, y);
              ctx.closePath();
              ctx.stroke();
            }
          }
          break;
        }
        default:
          break;
      }
      ctx.restore();
    };

    const drawFabricPattern = (
      ctx: CanvasRenderingContext2D,
      patternName: string,
      isFront: boolean,
    ) => {
      if (!patternName || patternName === "None") return;
      const loadedImg = state.loadedPatterns?.[patternName];
      if (loadedImg) {
        const customize = isFront
          ? state.fabricPatternCustomizeFront
          : state.fabricPatternCustomizeBack;

        if (!customize) {
          ctx.save();
          ctx.drawImage(loadedImg, 0, 0, size, size);
          ctx.restore();
          return;
        }

        const fgColor = isFront
          ? state.fabricPatternColorFront
          : state.fabricPatternColorBack;
        const bgColor = isFront
          ? state.fabricPatternBgFront
          : state.fabricPatternBgBack;

        const hexToRgb = (hex: string) => {
          const cleanHex = hex.replace("#", "");
          const num = parseInt(cleanHex, 16);
          return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255,
          };
        };

        const bgIsTransparent =
          bgColor.toLowerCase() === "transparent" || bgColor === "";
        const fgRgb = hexToRgb(fgColor);

        // Process pixel data to extract foreground shapes with transparency
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = size;
        tempCanvas.height = size;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return;

        tempCtx.drawImage(loadedImg, 0, 0, size, size);
        const imgData = tempCtx.getImageData(0, 0, size, size);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Calculate distance from white (255, 255, 255)
          const dist = Math.sqrt(
            (255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2,
          );

          // Interpolation factor t:
          // dist < 30 -> background
          // dist > 90 -> foreground
          const t = Math.max(0, Math.min(1, (dist - 30) / 60));

          data[i] = fgRgb.r;
          data[i + 1] = fgRgb.g;
          data[i + 2] = fgRgb.b;
          data[i + 3] = Math.round(a * t);
        }

        tempCtx.putImageData(imgData, 0, 0);

        ctx.save();
        if (!bgIsTransparent) {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, size, size);
        }
        ctx.drawImage(tempCanvas, 0, 0, size, size);
        ctx.restore();
      }
    };

    // ── Separate full-body pattern canvases (large decals) ─────────────────
    const isSplit = state.primaryColorSide && state.primaryColorSide !== "Both";

    const showFrontDecal =
      isSplit ||
      (state.designPattern &&
        state.designPattern !== "plain" &&
        (state.designSide === "Front" ||
          state.designSide === "Both" ||
          !state.designSide)) ||
      (state.fabricPatternFront && state.fabricPatternFront !== "None");

    const showBackDecal =
      isSplit ||
      (state.designPattern &&
        state.designPattern !== "plain" &&
        (state.designSide === "Back" ||
          state.designSide === "Both" ||
          !state.designSide)) ||
      (state.fabricPatternBack && state.fabricPatternBack !== "None");

    const patternFront = showFrontDecal
      ? makeCanvas((ctx) => {
          // 1. Draw base color / fabric pattern first
          if (state.fabricPatternFront && state.fabricPatternFront !== "None") {
            drawFabricPattern(ctx, state.fabricPatternFront, true);
          } else {
            // Fill with front primary color
            ctx.fillStyle = state.primaryFront || state.primary;
            ctx.fillRect(0, 0, size, size);
          }
          // 2. Draw design pattern on top
          if (
            state.designPattern &&
            state.designPattern !== "plain" &&
            (state.designSide === "Front" ||
              state.designSide === "Both" ||
              !state.designSide)
          ) {
            drawPattern(ctx);
          }
        })
      : null;

    const patternBack = showBackDecal
      ? makeCanvas((ctx) => {
          // 1. Draw base color / fabric pattern first
          if (state.fabricPatternBack && state.fabricPatternBack !== "None") {
            drawFabricPattern(ctx, state.fabricPatternBack, false);
          } else {
            // Fill with back primary color
            ctx.fillStyle = state.primaryBack || state.primary;
            ctx.fillRect(0, 0, size, size);
          }
          // 2. Draw design pattern on top
          if (
            state.designPattern &&
            state.designPattern !== "plain" &&
            (state.designSide === "Back" ||
              state.designSide === "Both" ||
              !state.designSide)
          ) {
            drawPattern(ctx);
          }
        })
      : null;

    if (patternFront) patternFront.anisotropy = 16;
    if (patternBack) patternBack.anisotropy = 16;

    // ── Text / number canvases (smaller decals, on top) ───────────────────────
    const drawSideLayers = (
      ctx: CanvasRenderingContext2D,
      side: "Front" | "Back",
    ) => {
      const sideTextLayers = (state.textLayers || []).filter(
        (l: any) => l.side === side,
      );
      // Logos (type === "logo" or unset) are rendered as separate 3D decals — exclude from flat canvas
      // Images (type === "image") stay on the flat canvas texture as before
      const sideLogoLayers = (state.logoLayers || []).filter(
        (l: any) => l.side === side && l.type === "image",
      );

      const allSideLayers = [
        ...sideTextLayers.map((l: any) => ({ ...l, layerType: "text" })),
        ...sideLogoLayers.map((l: any) => ({ ...l, layerType: "logo" })),
      ];

      const order = state.layersOrder || [];

      allSideLayers.sort((a, b) => {
        const indexA = order.indexOf(a.id);
        const indexB = order.indexOf(b.id);

        const getPriority = (l: any) => {
          if (l.layerType === "text") return 1;
          if (l.type === "image") {
            return l.zOrder === "above-text" ? 2 : 0;
          }
          return 3;
        };

        const valA = indexA !== -1 ? indexA : getPriority(a) * 1000;
        const valB = indexB !== -1 ? indexB : getPriority(b) * 1000;
        return valA - valB;
      });

      allSideLayers.forEach((layer: any) => {
        if (layer.layerType === "text") {
          ctx.save();
          ctx.translate(layer.x, layer.y);
          ctx.rotate((layer.rotation * Math.PI) / 180);
          ctx.scale(layer.scale, layer.scale);

          const isOutline = layer.font === "Outline";
          const strokeColor =
            side === "Front"
              ? state.primaryFront || state.primary
              : state.primaryBack || state.primary;

          drawTextWithSpacing(
            ctx,
            layer.text,
            0,
            0,
            layer.font,
            layer.textSize || 80,
            layer.color,
            isOutline,
            strokeColor,
            layer.letterSpacing || 0,
            layer.lineSpacing || 1.15,
            layer.curveRadius || 0,
            layer.shadowEnabled,
            layer.shadowColor,
            layer.shadowBlur,
            layer.shadowOffsetX,
            layer.shadowOffsetY,
            layer.outlineEnabled,
            layer.outlineColor,
            layer.outlineWidth,
          );
          ctx.restore();
        } else {
          drawLayerOnCtx(ctx, layer);
        }
      });
    };

    const front = makeCanvas((ctx) => {
      drawSideLayers(ctx, "Front");
    });

    const back = makeCanvas((ctx) => {
      drawSideLayers(ctx, "Back");
    });

    if (front) front.anisotropy = 16;
    if (back) back.anisotropy = 16;

    return { front, back, patternFront, patternBack };
  }, [state]);
}

const ERASER_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M20 20H7L3 16c-1-1-1-3 0-4L12 3c1-1 3-1 4 0l5 5c1 1 1 3 0 4l-5 5z' fill='%23fca5a5'/><path d='M12 3l4 4'/></svg>") 3 17, auto`;

function LogoCanvasPreview({
  layer,
  editorScale,
  preloadedImage,
}: {
  layer: LogoLayer;
  editorScale: number;
  preloadedImage?: HTMLImageElement;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const imgWidth = preloadedImage?.naturalWidth || preloadedImage?.width || 200;
  const imgHeight =
    preloadedImage?.naturalHeight || preloadedImage?.height || 200;
  const drawWidth = imgWidth * layer.scale * editorScale;
  const drawHeight = imgHeight * layer.scale * editorScale;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = drawWidth;
    canvas.height = drawHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = (img: HTMLImageElement) => {
      ctx.clearRect(0, 0, drawWidth, drawHeight);
      ctx.save();

      // Draw the logo image
      ctx.drawImage(img, 0, 0, drawWidth, drawHeight);

      // Apply eraser strokes
      if (layer.eraserPaths && layer.eraserPaths.length > 0) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "rgba(0,0,0,1)";

        layer.eraserPaths.forEach((path) => {
          ctx.lineWidth = path.size * layer.scale * editorScale;
          ctx.beginPath();
          path.points.forEach((pt, index) => {
            const x = pt.x * layer.scale * editorScale;
            const y = pt.y * layer.scale * editorScale;
            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.stroke();
        });
      }
      ctx.restore();
    };

    if (preloadedImage) {
      draw(preloadedImage);
    } else {
      const img = new Image();
      img.src = layer.src;
      img.crossOrigin = "anonymous";
      img.onload = () => draw(img);
    }
  }, [layer, editorScale, preloadedImage, drawWidth, drawHeight]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${drawWidth}px`,
        height: `${drawHeight}px`,
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}

// ─── Mini Pattern Preview SVG Component ─────────────────────────────────────
function MiniPatternSVG({
  pattern,
  primary,
}: {
  pattern: string;
  primary: string;
}) {
  const secondary = "rgba(0,0,0,0.15)";
  const white = "rgba(255,255,255,0.2)";

  const getPatternContent = () => {
    switch (pattern) {
      case "BlueGrungeJersey":
        return (
          <>
            {/* Left/right side panels */}
            <rect
              x="0"
              y="0"
              width="32"
              height="100"
              fill="rgba(26,179,232,0.5)"
            />
            <rect
              x="68"
              y="0"
              width="32"
              height="100"
              fill="rgba(26,179,232,0.5)"
            />
            {/* Center dark stripe */}
            <rect x="33" y="0" width="34" height="100" fill={secondary} />
            {/* Grunge triangle hints */}
            <polygon points="5,10 20,5 18,22" fill="rgba(0,0,0,0.25)" />
            <polygon points="8,55 22,48 20,68" fill="rgba(0,0,0,0.18)" />
            <polygon points="75,20 90,12 88,32" fill="rgba(0,0,0,0.25)" />
            <polygon points="80,65 95,58 93,78" fill="rgba(0,0,0,0.18)" />
            {/* Halftone dot hints */}
            <circle cx="30" cy="25" r="1.5" fill={white} />
            <circle cx="30" cy="50" r="2" fill={white} />
            <circle cx="30" cy="75" r="1.5" fill={white} />
            <circle cx="70" cy="25" r="1.5" fill={white} />
            <circle cx="70" cy="50" r="2" fill={white} />
            <circle cx="70" cy="75" r="1.5" fill={white} />
          </>
        );
      case "GreenChevronJersey":
        return (
          <>
            {/* Chevron path hints */}
            <path
              d="M 10,30 L 30,15 L 50,30 L 70,15 L 90,30"
              fill="none"
              stroke={white}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="M 10,55 L 30,40 L 50,55 L 70,40 L 90,55"
              fill="none"
              stroke={secondary}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M 10,80 L 30,65 L 50,80 L 70,65 L 90,80"
              fill="none"
              stroke={white}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* Dots fading in bottom corners */}
            <circle cx="15" cy="85" r="2.5" fill={secondary} />
            <circle cx="28" cy="85" r="1.5" fill={secondary} />
            <circle cx="15" cy="72" r="1.5" fill={secondary} />
            <circle cx="85" cy="85" r="2.5" fill={secondary} />
            <circle cx="72" cy="85" r="1.5" fill={secondary} />
            <circle cx="85" cy="72" r="1.5" fill={secondary} />
          </>
        );
      case "RedCarbonJersey":
        return (
          <>
            {/* Carbon weave tile previews */}
            <rect
              x="10"
              y="20"
              width="35"
              height="25"
              fill={secondary}
              stroke={white}
              strokeWidth="1"
            />
            <rect
              x="55"
              y="20"
              width="35"
              height="25"
              fill={secondary}
              stroke={white}
              strokeWidth="1"
            />
            <rect
              x="10"
              y="55"
              width="35"
              height="25"
              fill={secondary}
              stroke={white}
              strokeWidth="1"
            />
            <rect
              x="55"
              y="55"
              width="35"
              height="25"
              fill={secondary}
              stroke={white}
              strokeWidth="1"
            />
            {/* Diagonal slashes */}
            <line
              x1="0"
              y1="30"
              x2="40"
              y2="0"
              stroke={white}
              strokeWidth="3"
              opacity="0.6"
            />
            <line
              x1="60"
              y1="100"
              x2="100"
              y2="70"
              stroke={white}
              strokeWidth="3"
              opacity="0.6"
            />
          </>
        );
      case "GoldDiamondJersey":
        return (
          <>
            <polygon
              points="50,15 75,50 50,85 25,50"
              fill="none"
              stroke={white}
              strokeWidth="2.5"
            />
            <polygon
              points="50,30 63,50 50,70 37,50"
              fill="none"
              stroke={white}
              strokeWidth="1.2"
              opacity="0.7"
            />
            {/* Some flare dots */}
            <circle cx="20" cy="20" r="1.5" fill={white} />
            <circle cx="80" cy="20" r="1.5" fill={white} />
            <circle cx="20" cy="80" r="2" fill={white} />
            <circle cx="80" cy="80" r="1.5" fill={white} />
            {/* Corner triangles */}
            <polygon points="0,0 25,0 0,25" fill={secondary} />
            <polygon points="100,0 75,0 100,25" fill={secondary} />
          </>
        );
      case "PurpleHexTechJersey":
        return (
          <>
            {/* Multiple hexagons */}
            <path
              d="M 50,25 L 72,37 L 72,63 L 50,75 L 28,63 L 28,37 Z"
              fill="none"
              stroke={white}
              strokeWidth="2.2"
            />
            <path
              d="M 50,35 L 63,42 L 63,58 L 50,65 L 37,58 L 37,42 Z"
              fill="none"
              stroke={secondary}
              strokeWidth="1"
            />
            <circle cx="50" cy="50" r="3.5" fill={white} />
            {/* Streaks */}
            <line
              x1="10"
              y1="10"
              x2="25"
              y2="90"
              stroke={secondary}
              strokeWidth="1.5"
            />
            <line
              x1="90"
              y1="10"
              x2="75"
              y2="90"
              stroke={secondary}
              strokeWidth="1.5"
            />
          </>
        );
      case "OrangeCamoWaveJersey":
        return (
          <>
            {/* Camo blobs */}
            <path d="M 15,20 Q 30,10 40,25 T 25,50 Z" fill={secondary} />
            <path d="M 60,60 Q 80,45 90,65 T 75,85 Z" fill={secondary} />
            <path
              d="M 70,20 Q 85,15 80,35 T 55,30 Z"
              fill={white}
              opacity="0.6"
            />
            {/* Waves */}
            <path
              d="M 0,35 Q 25,30 50,35 T 100,35"
              fill="none"
              stroke={white}
              strokeWidth="1"
            />
            <path
              d="M 0,65 Q 25,60 50,65 T 100,65"
              fill="none"
              stroke={white}
              strokeWidth="1"
            />
          </>
        );
      case "RedShardEnergy":
        return (
          <>
            {/* Side panels */}
            <rect x="0" y="0" width="28" height="100" fill={secondary} />
            <rect x="72" y="0" width="28" height="100" fill={secondary} />
            {/* Shard hints */}
            <polygon points="35,20 45,15 48,25 38,30" fill={white} />
            <polygon points="55,50 68,45 62,60 52,65" fill={white} />
            {/* Streaks */}
            <line
              x1="30"
              y1="0"
              x2="60"
              y2="100"
              stroke={white}
              strokeWidth="1"
              opacity="0.4"
            />
            <line
              x1="50"
              y1="0"
              x2="80"
              y2="100"
              stroke={white}
              strokeWidth="1.5"
              opacity="0.4"
            />
          </>
        );
      case "NeonCyberGrid":
        return (
          <>
            {/* Grid */}
            <line
              x1="25"
              y1="0"
              x2="25"
              y2="100"
              stroke={white}
              strokeWidth="0.8"
              opacity="0.25"
            />
            <line
              x1="50"
              y1="0"
              x2="50"
              y2="100"
              stroke={white}
              strokeWidth="0.8"
              opacity="0.25"
            />
            <line
              x1="75"
              y1="0"
              x2="75"
              y2="100"
              stroke={white}
              strokeWidth="0.8"
              opacity="0.25"
            />
            <line
              x1="0"
              y1="30"
              x2="100"
              y2="30"
              stroke={white}
              strokeWidth="0.8"
              opacity="0.25"
            />
            <line
              x1="0"
              y1="65"
              x2="100"
              y2="65"
              stroke={white}
              strokeWidth="0.8"
              opacity="0.25"
            />
            {/* Hexagons */}
            <path
              d="M 50,35 L 63,42 L 63,58 L 50,65 L 37,58 L 37,42 Z"
              fill="none"
              stroke={white}
              strokeWidth="1.5"
            />
            <path
              d="M 15,10 L 25,16 L 25,28 L 15,34 L 5,28 L 5,16 Z"
              fill="none"
              stroke={secondary}
              strokeWidth="1"
            />
            <path
              d="M 85,70 L 95,76 L 95,88 L 85,94 L 75,88 L 75,76 Z"
              fill="none"
              stroke={secondary}
              strokeWidth="1"
            />
          </>
        );
      case "GreenToxicSmoke":
        return (
          <>
            {/* Smoke circles */}
            <circle cx="25" cy="30" r="18" fill={white} opacity="0.25" />
            <circle cx="75" cy="40" r="22" fill={white} opacity="0.2" />
            <circle cx="45" cy="70" r="25" fill={secondary} opacity="0.5" />
            {/* Acid scratches */}
            <line
              x1="15"
              y1="15"
              x2="35"
              y2="25"
              stroke={white}
              strokeWidth="1"
            />
            <line
              x1="65"
              y1="75"
              x2="85"
              y2="65"
              stroke={white}
              strokeWidth="1"
            />
            {/* Dark center panel */}
            <rect
              x="35"
              y="0"
              width="30"
              height="100"
              fill={secondary}
              opacity="0.4"
            />
          </>
        );
      case "PurpleWaveMotion":
        return (
          <>
            {/* Waves */}
            <path
              d="M 0,25 Q 25,10 50,25 T 100,25"
              fill="none"
              stroke={white}
              strokeWidth="2"
            />
            <path
              d="M 0,50 Q 25,35 50,50 T 100,50"
              fill="none"
              stroke={secondary}
              strokeWidth="1.5"
            />
            <path
              d="M 0,75 Q 25,60 50,75 T 100,75"
              fill="none"
              stroke={white}
              strokeWidth="2"
            />
            {/* Scattered dots */}
            <circle cx="20" cy="15" r="1" fill={white} />
            <circle cx="80" cy="15" r="1" fill={white} />
            <circle cx="45" cy="35" r="1.5" fill={white} />
            <circle cx="15" cy="65" r="1.5" fill={white} />
            <circle cx="85" cy="65" r="1" fill={white} />
            {/* Center glow hint */}
            <rect
              x="30"
              y="0"
              width="40"
              height="100"
              fill={white}
              opacity="0.08"
            />
          </>
        );
      case "FlameStripeJersey":
        return (
          <>
            {/* Vertical spike columns */}
            <rect
              x="0"
              y="0"
              width="8"
              height="55"
              rx="2"
              fill={white}
              opacity="0.8"
            />
            <rect
              x="0"
              y="45"
              width="8"
              height="55"
              rx="2"
              fill={white}
              opacity="0.8"
            />
            <rect
              x="18"
              y="0"
              width="6"
              height="40"
              rx="2"
              fill={secondary}
              opacity="0.7"
            />
            <rect
              x="18"
              y="60"
              width="6"
              height="40"
              rx="2"
              fill={secondary}
              opacity="0.7"
            />
            <rect
              x="32"
              y="0"
              width="8"
              height="60"
              rx="2"
              fill={white}
              opacity="0.8"
            />
            <rect
              x="32"
              y="50"
              width="8"
              height="50"
              rx="2"
              fill={white}
              opacity="0.8"
            />
            <rect
              x="48"
              y="0"
              width="8"
              height="50"
              rx="2"
              fill={white}
              opacity="0.8"
            />
            <rect
              x="48"
              y="55"
              width="8"
              height="45"
              rx="2"
              fill={white}
              opacity="0.8"
            />
            <rect
              x="64"
              y="0"
              width="6"
              height="40"
              rx="2"
              fill={secondary}
              opacity="0.7"
            />
            <rect
              x="64"
              y="62"
              width="6"
              height="38"
              rx="2"
              fill={secondary}
              opacity="0.7"
            />
            <rect
              x="78"
              y="0"
              width="8"
              height="65"
              rx="2"
              fill={white}
              opacity="0.8"
            />
            <rect
              x="78"
              y="52"
              width="8"
              height="48"
              rx="2"
              fill={white}
              opacity="0.8"
            />
            <rect
              x="92"
              y="0"
              width="8"
              height="50"
              rx="2"
              fill={white}
              opacity="0.8"
            />
            <rect
              x="92"
              y="60"
              width="8"
              height="40"
              rx="2"
              fill={white}
              opacity="0.8"
            />
          </>
        );

      case "GrungeTriangleJersey":
        return (
          <>
            {/* ── SIDE GRUNGE TRIANGLES ───────────────────────── */}

            {/* Left Side */}
            <polygon
              points="8,10 42,70 20,78"
              fill={secondary}
              opacity="0.45"
            />
            <polygon
              points="20,120 78,190 32,198"
              fill={secondary}
              opacity="0.38"
            />
            <polygon
              points="55,40 120,92 72,102"
              fill="none"
              stroke={secondary}
              strokeWidth="2"
              opacity="0.55"
            />
            <polygon
              points="70,230 132,310 88,320"
              fill={secondary}
              opacity="0.42"
            />
            <polygon
              points="28,340 82,410 38,422"
              fill="none"
              stroke={secondary}
              strokeWidth="2"
              opacity="0.5"
            />

            {/* Extra shard scratches */}
            <path
              d="M18 65 L52 32"
              stroke={secondary}
              strokeWidth="1.5"
              opacity="0.35"
            />
            <path
              d="M36 160 L74 118"
              stroke={secondary}
              strokeWidth="1"
              opacity="0.28"
            />
            <path
              d="M58 285 L108 248"
              stroke={secondary}
              strokeWidth="1.3"
              opacity="0.32"
            />

            {/* Grunge blobs */}
            <ellipse
              cx="42"
              cy="95"
              rx="18"
              ry="6"
              fill={secondary}
              opacity="0.18"
              transform="rotate(-18 42 95)"
            />
            <ellipse
              cx="82"
              cy="355"
              rx="26"
              ry="8"
              fill={secondary}
              opacity="0.14"
              transform="rotate(24 82 355)"
            />

            {/* ── RIGHT SIDE ─────────────────────────────────── */}

            <polygon
              points="930,20 980,88 946,98"
              fill={secondary}
              opacity="0.45"
            />
            <polygon
              points="870,130 960,210 902,218"
              fill={secondary}
              opacity="0.38"
            />
            <polygon
              points="845,52 928,112 872,122"
              fill="none"
              stroke={secondary}
              strokeWidth="2"
              opacity="0.55"
            />
            <polygon
              points="882,260 962,340 912,352"
              fill={secondary}
              opacity="0.42"
            />
            <polygon
              points="918,370 982,438 944,448"
              fill="none"
              stroke={secondary}
              strokeWidth="2"
              opacity="0.5"
            />

            {/* Scratch lines */}
            <path
              d="M948 72 L982 38"
              stroke={secondary}
              strokeWidth="1.5"
              opacity="0.35"
            />
            <path
              d="M902 192 L958 148"
              stroke={secondary}
              strokeWidth="1"
              opacity="0.28"
            />
            <path
              d="M914 312 L968 276"
              stroke={secondary}
              strokeWidth="1.3"
              opacity="0.32"
            />

            {/* Blob textures */}
            <ellipse
              cx="930"
              cy="120"
              rx="22"
              ry="7"
              fill={secondary}
              opacity="0.18"
              transform="rotate(16 930 120)"
            />
            <ellipse
              cx="888"
              cy="388"
              rx="28"
              ry="9"
              fill={secondary}
              opacity="0.14"
              transform="rotate(-22 888 388)"
            />

            {/* ── CENTER STRIPE ──────────────────────────────── */}
            <rect
              x="320"
              y="0"
              width="360"
              height="500"
              fill={primary}
              opacity="0.88"
            />

            {/* Stripe edge fades */}
            <rect
              x="305"
              y="0"
              width="18"
              height="500"
              fill={white}
              opacity="0.08"
            />
            <rect
              x="677"
              y="0"
              width="18"
              height="500"
              fill={white}
              opacity="0.08"
            />

            {/* Vertical grunge scratches */}
            <path
              d="M362 20 L378 168"
              stroke={white}
              strokeWidth="1"
              opacity="0.12"
            />
            <path
              d="M418 60 L440 242"
              stroke={white}
              strokeWidth="1.5"
              opacity="0.1"
            />
            <path
              d="M520 10 L548 212"
              stroke={white}
              strokeWidth="1.2"
              opacity="0.11"
            />
            <path
              d="M610 80 L632 282"
              stroke={white}
              strokeWidth="1.4"
              opacity="0.1"
            />

            {/* ── HALFTONE DOTS ─────────────────────────────── */}

            {/* Top */}
            <circle cx="250" cy="22" r="5" fill={secondary} opacity="0.22" />
            <circle cx="320" cy="32" r="4" fill={secondary} opacity="0.18" />
            <circle cx="420" cy="18" r="6" fill={secondary} opacity="0.24" />
            <circle cx="520" cy="28" r="5" fill={secondary} opacity="0.2" />
            <circle cx="650" cy="20" r="6" fill={secondary} opacity="0.24" />
            <circle cx="760" cy="34" r="4" fill={secondary} opacity="0.18" />

            {/* Bottom */}
            <circle cx="240" cy="462" r="5" fill={secondary} opacity="0.22" />
            <circle cx="352" cy="478" r="4" fill={secondary} opacity="0.18" />
            <circle cx="448" cy="468" r="6" fill={secondary} opacity="0.24" />
            <circle cx="548" cy="482" r="5" fill={secondary} opacity="0.2" />
            <circle cx="662" cy="472" r="6" fill={secondary} opacity="0.24" />
            <circle cx="742" cy="486" r="4" fill={secondary} opacity="0.18" />

            {/* ── VIGNETTE OVERLAY ───────────────────────────── */}
            <rect
              x="0"
              y="0"
              width="1000"
              height="500"
              fill="url(#grungeVignette)"
              opacity="0.22"
            />
          </>
        );
      case "JerseyHexDot":
        return (
          <>
            <path
              d="M 50,15 L 80,32 L 80,67 L 50,85 L 20,67 L 20,32 Z"
              stroke={white}
              strokeWidth="2"
              fill="none"
            />
            <circle cx="50" cy="35" r="2" fill={white} />
            <circle cx="50" cy="50" r="3" fill={white} />
            <circle cx="50" cy="65" r="2" fill={white} />
            <circle cx="35" cy="42" r="2.5" fill={white} />
            <circle cx="35" cy="58" r="2.5" fill={white} />
            <circle cx="65" cy="42" r="2.5" fill={white} />
            <circle cx="65" cy="58" r="2.5" fill={white} />
          </>
        );
      case "Street Shard":
        return (
          <>
            {/* Shard shapes */}
            <polygon points="10,15 25,5 30,25 15,30" fill={secondary} />
            <polygon points="5,55 20,45 28,60 10,70" fill={white} />
            <polygon points="80,15 95,5 98,25 75,30" fill={secondary} />
            <polygon points="70,55 90,45 95,65 80,75" fill={white} />

            {/* Center Band */}
            <rect
              x="36"
              y="0"
              width="28"
              height="100"
              fill={secondary}
              opacity="0.6"
            />

            {/* Halftone dots indicators */}
            <circle cx="33" cy="20" r="1.5" fill={white} />
            <circle cx="33" cy="40" r="1.5" fill={white} />
            <circle cx="33" cy="60" r="1.5" fill={white} />
            <circle cx="33" cy="80" r="1.5" fill={white} />
            <circle cx="67" cy="20" r="1.5" fill={white} />
            <circle cx="67" cy="40" r="1.5" fill={white} />
            <circle cx="67" cy="60" r="1.5" fill={white} />
            <circle cx="67" cy="80" r="1.5" fill={white} />
          </>
        );
      case "Stripes":
        return (
          <>
            <rect x="15" y="0" width="8" height="100" fill={white} />
            <rect x="27" y="0" width="2" height="100" fill={white} />
            <rect x="45" y="0" width="8" height="100" fill={white} />
            <rect x="57" y="0" width="2" height="100" fill={white} />
            <rect x="75" y="0" width="8" height="100" fill={white} />
            <rect x="87" y="0" width="2" height="100" fill={white} />
          </>
        );
      case "Diagonal":
        return (
          <>
            <line
              x1="-20"
              y1="20"
              x2="40"
              y2="-40"
              stroke={secondary}
              strokeWidth="6"
            />
            <line
              x1="10"
              y1="50"
              x2="70"
              y2="-10"
              stroke={secondary}
              strokeWidth="6"
            />
            <line
              x1="40"
              y1="80"
              x2="100"
              y2="20"
              stroke={secondary}
              strokeWidth="6"
            />
            <line
              x1="70"
              y1="110"
              x2="130"
              y2="50"
              stroke={secondary}
              strokeWidth="6"
            />

            <line
              x1="-15"
              y1="25"
              x2="45"
              y2="-35"
              stroke={white}
              strokeWidth="2"
            />
            <line
              x1="15"
              y1="55"
              x2="75"
              y2="-5"
              stroke={white}
              strokeWidth="2"
            />
            <line
              x1="45"
              y1="85"
              x2="105"
              y2="25"
              stroke={white}
              strokeWidth="2"
            />
            <line
              x1="75"
              y1="115"
              x2="135"
              y2="55"
              stroke={white}
              strokeWidth="2"
            />
          </>
        );
      case "Lightning":
        return (
          <path
            d="M20,10 L10,50 L25,50 L12,90 M50,10 L40,50 L55,50 L42,90 M80,10 L70,50 L85,50 L72,90"
            stroke={white}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case "Abstract":
        return (
          <path
            d="M-10,30 Q20,10 50,30 T110,30 M-10,50 Q20,30 50,50 T110,50 M-10,70 Q20,50 50,70 T110,70"
            stroke={white}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        );
      case "Geometric":
        return (
          <path
            d="M 0,0 L 20,20 L 40,0 L 60,20 L 80,0 L 100,20 M 0,20 L 20,40 L 40,20 L 60,40 L 80,20 L 100,40 M 0,40 L 20,60 L 40,40 L 60,60 L 80,40 L 100,60 M 0,60 L 20,80 L 40,60 L 60,80 L 80,60 L 100,80"
            stroke={white}
            strokeWidth="1.5"
            fill="none"
          />
        );
      case "Camouflage":
        return (
          <>
            <path
              d="M 10,20 Q 20,5 35,15 T 60,10 T 80,30 T 40,45 Z"
              fill={secondary}
            />
            <path
              d="M 20,60 Q 40,45 55,65 T 80,50 T 90,80 T 50,90 Z"
              fill={white}
            />
          </>
        );
      case "Minimal":
        return (
          <>
            <circle cx="20" cy="20" r="2.5" fill={white} />
            <circle cx="50" cy="20" r="2.5" fill={white} />
            <circle cx="80" cy="20" r="2.5" fill={white} />
            <circle cx="20" cy="50" r="2.5" fill={white} />
            <circle cx="50" cy="50" r="2.5" fill={white} />
            <circle cx="80" cy="50" r="2.5" fill={white} />
            <circle cx="20" cy="80" r="2.5" fill={white} />
            <circle cx="50" cy="80" r="2.5" fill={white} />
            <circle cx="80" cy="80" r="2.5" fill={white} />
          </>
        );
      case "Gradient":
        return (
          <defs>
            <linearGradient id="miniGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={primary} />
              <stop offset="100%" stopColor="#111111" stopOpacity="0.6" />
            </linearGradient>
          </defs>
        );
      case "Diamond":
        return (
          <path
            d="M 50,10 L 70,30 L 50,50 L 30,30 Z M 20,40 L 40,60 L 20,80 L 0,60 Z M 80,40 L 100,60 L 80,80 L 60,60 Z"
            stroke={white}
            strokeWidth="1.5"
            fill="none"
          />
        );
      default:
        return null;
    }
  };

  const isGradient = pattern === "Gradient";

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full bg-zinc-200"
      style={{ backgroundColor: isGradient ? undefined : primary }}
    >
      {getPatternContent()}
      {isGradient && <rect width="100" height="100" fill="url(#miniGrad)" />}
      {pattern === "None" && (
        <text
          x="50"
          y="55"
          textAnchor="middle"
          fill="rgba(0,0,0,0.3)"
          fontSize="14"
          fontWeight="bold"
        >
          Solid
        </text>
      )}
    </svg>
  );
}

// Preload the model to prevent popping
useGLTF.preload("/models/shirt_baked.glb");

// Procedural texture generators for fabrics
function createMeshNormalMap() {
  if (typeof window === "undefined") return null;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Fill with flat normal map color (128, 128, 255)
  ctx.fillStyle = "rgb(128, 128, 255)";
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  // Staggered honeycomb pores
  const tileSize = 32; // size of one tile
  const halfTile = tileSize / 2;
  const radius = 6; // radius of the pore

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let minDist = Infinity;
      let dxMin = 0;
      let dyMin = 0;

      const cx1 = Math.floor(x / tileSize) * tileSize;
      const cy1 = Math.floor(y / tileSize) * tileSize;

      const centers = [
        [cx1, cy1],
        [cx1 + tileSize, cy1],
        [cx1, cy1 + tileSize],
        [cx1 + tileSize, cy1 + tileSize],
        [cx1 + halfTile, cy1 + halfTile],
        [cx1 - halfTile, cy1 + halfTile],
        [cx1 + halfTile, cy1 - halfTile],
        [cx1 + tileSize + halfTile, cy1 + halfTile],
        [cx1 + halfTile, cy1 + tileSize + halfTile],
      ];

      for (const [cx, cy] of centers) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          dxMin = dx;
          dyMin = dy;
        }
      }

      if (minDist < radius) {
        const nx = dxMin / radius;
        const ny = dyMin / radius;
        const nzSquare = 1 - nx * nx - ny * ny;
        const nz = nzSquare > 0 ? Math.sqrt(nzSquare) : 0;

        const rVal = Math.round((nx * 0.5 + 0.5) * 255);
        const gVal = Math.round((-ny * 0.5 + 0.5) * 255);
        const bVal = Math.round((nz * 0.8 + 0.2) * 255);

        const idx = (y * size + x) * 4;
        data[idx] = rVal;
        data[idx + 1] = gVal;
        data[idx + 2] = bVal;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(30, 30); // Dense micro-mesh honeycomb
  texture.needsUpdate = true;
  return texture;
}

function createFlexNormalMap() {
  if (typeof window === "undefined") return null;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "rgb(128, 128, 255)";
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  // Very subtle micro-rib texture
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = Math.sin(x * 1.5) * 0.04;
      const ny = Math.sin(y * 1.5) * 0.04;
      const rVal = Math.round((nx * 0.5 + 0.5) * 255);
      const gVal = Math.round((ny * 0.5 + 0.5) * 255);
      const bVal = 255;

      const idx = (y * size + x) * 4;
      data[idx] = rVal;
      data[idx + 1] = gVal;
      data[idx + 2] = bVal;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(80, 80); // Dense micro-texture
  texture.needsUpdate = true;
  return texture;
}

function ThreeGrabber({
  threeRef,
}: {
  threeRef: React.MutableRefObject<{
    gl: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.Camera;
  } | null>;
}) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    threeRef.current = { gl, scene, camera };
    return () => {
      threeRef.current = null;
    };
  }, [gl, scene, camera, threeRef]);
  return null;
}

// ─── LogoDecal: Renders a single logo layer as a 3D surface decal ──────────────
// Only used for layers with type === "logo" (or no type set).
// Image (Wrap/BG) layers are NOT affected by this component.
interface LogoDecalProps {
  layer: any;
  loadedLogoImages: any;
  roughness: number;
  fabricConfig: any;
}

function LogoDecal({ layer, loadedLogoImages, roughness, fabricConfig }: LogoDecalProps) {
  const img = loadedLogoImages[layer.src];
  const texture = useMemo(() => {
    if (!img) return null;
    const canvas = document.createElement("canvas");
    const imgWidth = img.naturalWidth || img.width || 200;
    const imgHeight = img.naturalHeight || img.height || 200;
    canvas.width = imgWidth;
    canvas.height = imgHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.clearRect(0, 0, imgWidth, imgHeight);
    ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

    if (layer.eraserPaths && layer.eraserPaths.length > 0) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      layer.eraserPaths.forEach((path: any) => {
        ctx.lineWidth = path.size;
        ctx.beginPath();
        path.points.forEach((pt: any, idx: number) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      });
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    return tex;
  }, [img, layer.eraserPaths]);

  if (!texture || !img) return null;

  const isFront = layer.side === "Front";
  const x = layer.x;
  const y = layer.y;
  const rotRad = (layer.rotation * Math.PI) / 180;

  const Rx = 0.187;
  const Rz = 0.135;
  const maxSweep = (70 * Math.PI) / 180;
  const sleeveW = 260;

  // Sleeve classification: tighter bounds + Y threshold so waist isn't misclassified
  const isSleeve = (x < sleeveW || x > 1024 - sleeveW) && y < 460;

  // Vertical mapping
  const py = -(y / 1024 - 0.5) * 0.64 - 0.0175;

  // Small surface-normal shift to keep decal flush on curved surface
  const shiftD = 0.02;

  // Decal projection depth — scales with logo size so large logos never get clipped
  const depth = isSleeve
    ? Math.max(0.08, layer.scale * 0.09)
    : Math.max(0.2, layer.scale * 0.18);

  let px = 0;
  let pz = 0;
  let rx = 0;
  let ry = 0;
  let rz = 0;

  if (isFront) {
    if (isSleeve) {
      if (x < sleeveW) {
        // Front-Left Sleeve
        const t = x / sleeveW;
        const px_c = -0.276 + t * 0.10;
        const pz_c = -0.04 + t * 0.086;
        ry = -maxSweep;
        px = px_c + shiftD * Math.sin(ry);
        pz = pz_c + shiftD * Math.cos(ry);
        rz = 0.35 - rotRad;
      } else {
        // Front-Right Sleeve
        const t = (1024 - x) / sleeveW;
        const px_c = 0.276 - t * 0.10;
        const pz_c = -0.04 + t * 0.086;
        ry = maxSweep;
        px = px_c + shiftD * Math.sin(ry);
        pz = pz_c + shiftD * Math.cos(ry);
        rz = -0.35 - rotRad;
      }
    } else {
      // Torso Front — cylindrical projection
      const tTorso = (x - sleeveW) / (1024 - 2 * sleeveW);
      const theta = (tTorso - 0.5) * (2 * maxSweep);
      px = Rx * Math.sin(theta);
      pz = Rz * Math.cos(theta) + shiftD;
      ry = theta;
      rz = -rotRad;
    }
  } else {
    // Back side
    if (isSleeve) {
      if (x < sleeveW) {
        // Back-Left Sleeve (wearer's left arm = positive X on 3D)
        const t = x / sleeveW;
        const px_c = 0.276 - t * 0.10;
        const pz_c = -0.04 + t * 0.086;
        ry = Math.PI - maxSweep;
        px = px_c + shiftD * Math.sin(ry);
        pz = pz_c + shiftD * Math.cos(ry);
        rz = -0.35 + rotRad;
      } else {
        // Back-Right Sleeve (wearer's right arm = negative X on 3D)
        const t = (1024 - x) / sleeveW;
        const px_c = -0.276 + t * 0.10;
        const pz_c = -0.04 + t * 0.086;
        ry = -Math.PI + maxSweep;
        px = px_c + shiftD * Math.sin(ry);
        pz = pz_c + shiftD * Math.cos(ry);
        rz = 0.35 + rotRad;
      }
    } else {
      // Torso Back — non-mirrored cylindrical projection
      const tTorso = (x - sleeveW) / (1024 - 2 * sleeveW);
      const theta = Math.PI + (tTorso - 0.5) * (2 * maxSweep);
      px = Rx * Math.sin(theta);
      pz = Rz * Math.cos(theta) - shiftD;
      ry = theta;
      rz = rotRad;
    }
  }

  const imgWidth = img.naturalWidth || img.width || 200;
  const imgHeight = img.naturalHeight || img.height || 200;
  const size = 0.15;
  const aspect = imgWidth / imgHeight;

  const decalScale: [number, number, number] = [
    size * layer.scale * aspect,
    size * layer.scale,
    depth,
  ];

  return (
    <Decal
      position={[px, py, pz]}
      rotation={[rx, ry, rz]}
      scale={decalScale}
      renderOrder={20}
    >
      <meshStandardMaterial
        map={texture}
        transparent
        alphaTest={0.5}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-8}
        roughness={roughness}
        normalMap={fabricConfig.normalMap || undefined}
        normalScale={fabricConfig.normalScale}
        envMapIntensity={0.2}
      />
    </Decal>
  );
}

function Jersey3D({
  colors,
  collar,
  texturesRef,
}: {
  colors: any;
  collar: boolean;
  texturesRef?: React.MutableRefObject<{
    front: THREE.CanvasTexture | null;
    back: THREE.CanvasTexture | null;
    patternFront?: THREE.CanvasTexture | null;
    patternBack?: THREE.CanvasTexture | null;
  }>;
}) {
  const { nodes } = useGLTF("/models/shirt_baked.glb") as any;
  const { front, back, patternFront, patternBack } = useJerseyDecals(colors);

  useEffect(() => {
    if (texturesRef) {
      texturesRef.current = { front, back, patternFront, patternBack };
    }
  }, [front, back, patternFront, patternBack, texturesRef]);
  const { collarDecal } = useStyleDecals(colors);

  const [logoTexture, setLogoTexture] = useState<THREE.Texture | null>(null);
  const [logoAspect, setLogoAspect] = useState(1);

  useEffect(() => {
    if (!colors.logo) {
      setLogoTexture(null);
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.load(
      colors.logo,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = 16;
        tex.needsUpdate = true;
        const img = tex.image;
        if (img) {
          setLogoAspect(img.width / img.height);
        }
        setLogoTexture(tex);
      },
      undefined,
      (err) => {
        console.error("Error loading logo texture:", err);
      },
    );
  }, [colors.logo]);

  const logoParams = useMemo(() => {
    if (!logoTexture) return null;
    const size = colors.logoSize || 0.15;
    const aspect = logoAspect || 1.0;

    switch (colors.logoPosition) {
      case "Left Chest":
        return {
          position: [0.062, 0.16, 0.138] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: [size * aspect * 0.75, size * 0.75, 0.2] as [
            number,
            number,
            number,
          ],
        };
      case "Right Chest":
        return {
          position: [-0.062, 0.16, 0.138] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: [size * aspect * 0.75, size * 0.75, 0.2] as [
            number,
            number,
            number,
          ],
        };
      case "Center":
        return {
          position: [0.0, 0.08, 0.15] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: [size * aspect * 1.3, size * 1.3, 0.2] as [
            number,
            number,
            number,
          ],
        };
      case "Back Top":
        return {
          position: [0.0, 0.23, -0.135] as [number, number, number],
          rotation: [0, Math.PI, 0] as [number, number, number],
          scale: [size * aspect * 0.9, size * 0.9, 0.2] as [
            number,
            number,
            number,
          ],
        };
      case "Back Center":
        return {
          position: [0.0, 0.05, -0.15] as [number, number, number],
          rotation: [0, Math.PI, 0] as [number, number, number],
          scale: [size * aspect * 1.3, size * 1.3, 0.2] as [
            number,
            number,
            number,
          ],
        };
      case "Sleeve":
        return {
          position: [0.22, 0.16, 0.0] as [number, number, number],
          rotation: [0, Math.PI / 2, 0] as [number, number, number],
          scale: [size * aspect, size, 0.2] as [number, number, number],
        };
      default:
        return null;
    }
  }, [logoTexture, logoAspect, colors.logoPosition, colors.logoSize]);

  // Pre-generate normal map textures procedurally
  const meshNormalMap = useMemo(() => {
    return createMeshNormalMap();
  }, []);

  const flexNormalMap = useMemo(() => {
    return createFlexNormalMap();
  }, []);

  const fabricConfig = useMemo(() => {
    if (colors.fabric === "Flex") {
      return {
        roughness: 0.4,
        normalMap: flexNormalMap,
        normalScale: new THREE.Vector2(0.15, 0.15),
      };
    } else {
      // Default to Mesh (our standard)
      return {
        roughness: 0.8,
        normalMap: meshNormalMap,
        normalScale: new THREE.Vector2(0.4, 0.4),
      };
    }
  }, [colors.fabric, meshNormalMap, flexNormalMap]);

  const shirtMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: colors.primaryFront || colors.primary,
      roughness: fabricConfig.roughness,
      metalness: 0.04,
      normalMap: fabricConfig.normalMap || undefined,
      normalScale: fabricConfig.normalScale,
      envMapIntensity: 0.25,
    });
  }, [fabricConfig, colors.primaryFront, colors.primary]);

  let scaleX = 2.2;
  let scaleZ = 2.2;
  if (colors.cutFit === "Slim Fit") {
    scaleX = 2.05;
    scaleZ = 2.05;
  } else if (colors.cutFit === "Relaxed") {
    scaleX = 2.35;
    scaleZ = 2.35;
  }

  // ── Sleeve geometry pre-computation ─────────────────────────────────────────
  // The base GLB short sleeve seam sits at ≈ (±0.187, 0.087) in local space.
  // For rotation.z = -ROT_Z, the cylinder axis (from Y=[0,1,0]) rotates to:
  //   axis = (-sin(-ROT_Z), cos(-ROT_Z)) = (sin(ROT_Z), cos(ROT_Z))
  //   where ROT_Z = π/2 + 0.35:
  //     AX = sin(π/2+0.35) = cos(0.35) ≈ +0.939  →  pointing right ✓
  //     AY = cos(π/2+0.35) = -sin(0.35) ≈ -0.342 →  pointing downward ✓
  const SLEEVE_SEAM_X = 0.187;
  const SLEEVE_SEAM_Y = 0.087;
  const SLEEVE_ROT_Z = Math.PI / 2 + 0.35; // ≈ 1.921 rad
  const SLEEVE_AX = Math.sin(SLEEVE_ROT_Z); // ≈ +0.939 (rightward)
  const SLEEVE_AY = Math.cos(SLEEVE_ROT_Z); // ≈ -0.342 (downward) ← no minus needed!

  const sleeveLen = colors.sleeve === "Long" ? 0.34 : 0.17;
  const sleeveHalf = sleeveLen / 2;
  // Cylinder center = seam + halfLen × axisDir  (top cap flush with seam)
  const sleeveCX = SLEEVE_SEAM_X + sleeveHalf * SLEEVE_AX;
  const sleeveCY = SLEEVE_SEAM_Y + sleeveHalf * SLEEVE_AY;
  // Wrist = seam + fullLen × axisDir
  const sleeveWristX = SLEEVE_SEAM_X + sleeveLen * SLEEVE_AX;
  const sleeveWristY = SLEEVE_SEAM_Y + sleeveLen * SLEEVE_AY;

  const trimColor = colors.designColor || colors.secondary || "#ffffff";
  const roughness = fabricConfig.roughness;

  return (
    <group scale={[scaleX, 2.2, scaleZ]} position={[0, -0.1, 0]}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.T_Shirt_male.geometry}
        material={shirtMat}
        dispose={null}
      >
        {/* ── Full-body pattern decals (rendered first, underneath text) ── */}
        {patternFront && (
          <Decal
            position={[0, 0.0, 0.155]}
            rotation={[0, 0, 0]}
            scale={[0.54, 0.7, 0.32]}
            renderOrder={1}
          >
            <meshStandardMaterial
              map={patternFront}
              transparent
              alphaTest={0.01}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-3}
              roughness={roughness}
              normalMap={fabricConfig.normalMap || undefined}
              normalScale={fabricConfig.normalScale}
              envMapIntensity={0.2}
            />
          </Decal>
        )}
        {patternBack && (
          <Decal
            position={[0, 0.0, -0.155]}
            rotation={[0, Math.PI, 0]}
            scale={[0.54, 0.7, 0.32]}
            renderOrder={1}
          >
            <meshStandardMaterial
              map={patternBack}
              transparent
              alphaTest={0.01}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-3}
              roughness={roughness}
              normalMap={fabricConfig.normalMap || undefined}
              normalScale={fabricConfig.normalScale}
              envMapIntensity={0.2}
            />
          </Decal>
        )}

        {/* ── Text / number decals (on top of pattern) ── */}
        {front && (
          <Decal
            position={[0, 0.0, 0.155]}
            rotation={[0, 0, 0]}
            scale={[0.54, 0.7, 0.32]}
            renderOrder={10}
          >
            <meshStandardMaterial
              map={front}
              transparent
              alphaTest={0.02}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-4}
              roughness={roughness}
              normalMap={fabricConfig.normalMap || undefined}
              normalScale={fabricConfig.normalScale}
              envMapIntensity={0.2}
            />
          </Decal>
        )}
        {back && (
          <Decal
            position={[0, 0.0, -0.155]}
            rotation={[0, Math.PI, 0]}
            scale={[0.54, 0.7, 0.32]}
            renderOrder={10}
          >
            <meshStandardMaterial
              map={back}
              transparent
              alphaTest={0.02}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-4}
              roughness={roughness}
              normalMap={fabricConfig.normalMap || undefined}
              normalScale={fabricConfig.normalScale}
              envMapIntensity={0.2}
            />
          </Decal>
        )}
        {logoTexture && logoParams && (
          <Decal
            position={logoParams.position}
            rotation={logoParams.rotation}
            scale={logoParams.scale}
            renderOrder={20}
          >
            <meshStandardMaterial
              map={logoTexture}
              transparent
              alphaTest={0.002}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-8}
              roughness={roughness}
              normalMap={fabricConfig.normalMap || undefined}
              normalScale={fabricConfig.normalScale}
              envMapIntensity={0.2}
            />
          </Decal>
        )}

        {/* ── Collar Decal: wrapped flat onto the chest/neckline surface ── */}
        {collarDecal && (
          <Decal
            position={[0.0, 0.19, 0.118]}
            rotation={[0.15, 0, 0]}
            scale={[0.22, 0.22, 0.12]}
            renderOrder={30}
          >
            <meshStandardMaterial
              map={collarDecal}
              transparent
              alphaTest={0.008}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-7}
              roughness={roughness}
              normalMap={fabricConfig.normalMap || undefined}
              normalScale={fabricConfig.normalScale}
              envMapIntensity={0.2}
            />
          </Decal>
        )}

        {/* ── Logo Layers: rendered as independent 3D decals with cylindrical surface mapping ── */}
        {(colors.logoLayers || []).filter((l: any) => l.type === "logo" || !l.type).map((layer: any) => (
          <LogoDecal
            key={layer.id}
            layer={layer}
            loadedLogoImages={colors.loadedLogoImages || {}}
            roughness={roughness}
            fabricConfig={fabricConfig}
          />
        ))}
      </mesh>

      {/* ── Dynamic Collar Elements (Polo 3D Wings, now flush and realistic) ── */}
      {colors.collar && colors.collarType === "Polo" && (
        <group>
          {/* Folded Wings - perfectly scaled and nested into the neckbed */}
          <mesh
            castShadow
            receiveShadow
            position={[-0.038, 0.198, 0.045]}
            rotation={[0.35, -0.35, -0.4]}
          >
            <boxGeometry args={[0.055, 0.004, 0.065]} />
            <meshStandardMaterial
              color={colors.designColor || colors.secondary || "#ffffff"}
              roughness={0.7}
            />
          </mesh>
          <mesh
            castShadow
            receiveShadow
            position={[0.038, 0.198, 0.045]}
            rotation={[0.35, 0.35, 0.4]}
          >
            <boxGeometry args={[0.055, 0.004, 0.065]} />
            <meshStandardMaterial
              color={colors.designColor || colors.secondary || "#ffffff"}
              roughness={0.7}
            />
          </mesh>
        </group>
      )}

      {/* ── Long / 3/4 Sleeve Extensions ─────────────────────────────────── */}
      {/* One arm cylinder per side, center-placed so the top cap sits exactly   */}
      {/* on the base-model's short-sleeve seam at (SLEEVE_SEAM_X, SLEEVE_SEAM_Y) */}
      {(colors.sleeve === "Long" || colors.sleeve === "3/4") && (
        <group>
          {/* Right viewer side (+x = wearer's left arm) */}
          <mesh
            castShadow
            receiveShadow
            position={[sleeveCX, sleeveCY, -0.01]}
            rotation={[0, 0, -SLEEVE_ROT_Z]}
          >
            <cylinderGeometry
              args={[
                0.042,
                colors.sleeve === "Long" ? 0.028 : 0.034,
                sleeveLen,
                32,
              ]}
            />
            <meshStandardMaterial
              color={colors.primaryFront || colors.primary}
              roughness={roughness}
              normalMap={fabricConfig.normalMap || undefined}
              normalScale={fabricConfig.normalScale}
              metalness={0.03}
              envMapIntensity={1.1}
            />
          </mesh>
          {/* Wrist cuff highlight — Long only */}
          {colors.sleeve === "Long" && (
            <mesh
              castShadow
              receiveShadow
              position={[sleeveWristX, sleeveWristY, -0.01]}
              rotation={[0, 0, -SLEEVE_ROT_Z]}
            >
              <cylinderGeometry args={[0.029, 0.028, 0.018, 32]} />
              <meshStandardMaterial
                color={trimColor}
                roughness={0.5}
                metalness={0.02}
              />
            </mesh>
          )}

          {/* Left viewer side (-x = wearer's right arm) */}
          <mesh
            castShadow
            receiveShadow
            position={[-sleeveCX, sleeveCY, -0.01]}
            rotation={[0, 0, SLEEVE_ROT_Z]}
          >
            <cylinderGeometry
              args={[
                0.042,
                colors.sleeve === "Long" ? 0.028 : 0.034,
                sleeveLen,
                32,
              ]}
            />
            <meshStandardMaterial
              color={colors.primaryFront || colors.primary}
              roughness={roughness}
              normalMap={fabricConfig.normalMap || undefined}
              normalScale={fabricConfig.normalScale}
              metalness={0.03}
              envMapIntensity={1.1}
            />
          </mesh>
          {/* Wrist cuff highlight — Long only */}
          {colors.sleeve === "Long" && (
            <mesh
              castShadow
              receiveShadow
              position={[-sleeveWristX, sleeveWristY, -0.01]}
              rotation={[0, 0, SLEEVE_ROT_Z]}
            >
              <cylinderGeometry args={[0.029, 0.028, 0.018, 32]} />
              <meshStandardMaterial
                color={trimColor}
                roughness={0.5}
                metalness={0.02}
              />
            </mesh>
          )}
        </group>
      )}

      {/* ── Sleeveless: armhole trim ring ─────────────────────────────────── */}
      {colors.sleeve === "Sleeveless" && (
        <group>
          <mesh
            castShadow
            receiveShadow
            position={[SLEEVE_SEAM_X, SLEEVE_SEAM_Y, -0.01]}
            rotation={[0, 0, -SLEEVE_ROT_Z]}
          >
            <torusGeometry args={[0.042, 0.006, 16, 48]} />
            <meshStandardMaterial color={trimColor} roughness={0.55} />
          </mesh>
          <mesh
            castShadow
            receiveShadow
            position={[-SLEEVE_SEAM_X, SLEEVE_SEAM_Y, -0.01]}
            rotation={[0, 0, SLEEVE_ROT_Z]}
          >
            <torusGeometry args={[0.042, 0.006, 16, 48]} />
            <meshStandardMaterial color={trimColor} roughness={0.55} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ─── Jersey SVG Thumbnails ──────────────────────────────────────────────────
function JerseySVG({
  primary = "#2196F3",
  secondary = "#1A1A2E",
  pattern = "plain",
  selected = false,
}: {
  primary?: string;
  secondary?: string;
  pattern?: string;
  selected?: boolean;
}) {
  const patterns: Record<string, JSX.Element> = {
    plain: <></>,
    strike: (
      <>
        <polygon points="60,10 80,10 50,90 30,90" fill={secondary} />
      </>
    ),
    save: (
      <>
        <rect x="0" y="0" width="45" height="100" fill={secondary} />
      </>
    ),
    fastbreak: (
      <>
        <polygon points="0,0 30,0 0,50" fill={secondary} />
        <polygon points="100,50 100,100 70,100" fill={secondary} />
      </>
    ),
    final: (
      <>
        <rect x="0" y="0" width="35" height="100" fill={secondary} />
        <rect x="65" y="0" width="35" height="100" fill={secondary} />
      </>
    ),
    victory: (
      <>
        <polygon points="0,0 40,0 20,100 0,100" fill={secondary} />
      </>
    ),
    city: (
      <>
        <line
          x1="0"
          y1="25"
          x2="100"
          y2="25"
          stroke={secondary}
          strokeWidth="4"
        />
        <line
          x1="0"
          y1="50"
          x2="100"
          y2="50"
          stroke={secondary}
          strokeWidth="4"
        />
        <line
          x1="0"
          y1="75"
          x2="100"
          y2="75"
          stroke={secondary}
          strokeWidth="4"
        />
      </>
    ),
    pure: (
      <>
        <polygon points="70,0 100,0 100,40" fill={secondary} />
      </>
    ),
    level: (
      <>
        <polygon points="0,0 55,0 0,70" fill={secondary} />
      </>
    ),
    vivo: (
      <>
        <polygon points="60,100 100,0 100,100" fill={secondary} />
      </>
    ),
    orion: (
      <>
        <polygon
          points="30,20 70,20 90,60 50,90 10,60"
          fill="white"
          opacity="0.18"
        />
        <polygon points="40,30 60,30 70,55 50,72 30,55" fill={secondary} />
      </>
    ),
    animal: (
      <>
        <path
          d="M0,0 Q25,40 50,10 Q75,40 100,0 L100,50 Q75,80 50,55 Q25,80 0,50 Z"
          fill={secondary}
        />
      </>
    ),
    avatar: (
      <>
        <polygon points="0,100 45,0 55,0 0,100" fill={secondary} />
      </>
    ),
    league: (
      <>
        <rect x="0" y="0" width="50" height="100" fill={secondary} />
        <rect
          x="50"
          y="0"
          width="50"
          height="100"
          fill={primary}
          opacity="0.3"
        />
      </>
    ),
    magic: (
      <>
        <radialGradient id="mg" cx="50%" cy="40%">
          <stop offset="0%" stopColor={secondary} stopOpacity="1" />
          <stop offset="100%" stopColor={secondary} stopOpacity="0" />
        </radialGradient>
        <rect x="0" y="0" width="100" height="100" fill="url(#mg)" />
      </>
    ),
    raid: (
      <>
        <rect x="0" y="0" width="100" height="50" fill={secondary} />
      </>
    ),
    rush: (
      <>
        <polygon points="0,0 0,100 40,100" fill={secondary} />
      </>
    ),
    score: (
      <>
        <polygon points="0,0 100,0 100,100" fill={secondary} />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* jersey body */}
      <path
        d="M20,8 L0,28 L18,35 L18,90 L82,90 L82,35 L100,28 L80,8 L65,18 Q50,24 35,18 Z"
        fill={primary}
      />
      {/* pattern overlay */}
      <clipPath id="jerseyClip">
        <path d="M20,8 L0,28 L18,35 L18,90 L82,90 L82,35 L100,28 L80,8 L65,18 Q50,24 35,18 Z" />
      </clipPath>
      <g clipPath="url(#jerseyClip)">{patterns[pattern] ?? <></>}</g>
      {/* collar */}
      <path
        d="M38,18 Q50,30 62,18"
        fill="none"
        stroke={secondary}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* outline */}
      <path
        d="M20,8 L0,28 L18,35 L18,90 L82,90 L82,35 L100,28 L80,8 L65,18 Q50,24 35,18 Z"
        fill="none"
        stroke={selected ? "#E63946" : "rgba(0,0,0,0.18)"}
        strokeWidth={selected ? 3 : 1.5}
      />
    </svg>
  );
}

// ─── Design Templates ───────────────────────────────────────────────────────
const JERSEY_DESIGNS = [
  { id: "throw", label: "Throw", pattern: "plain" },
  { id: "strike", label: "Strike", pattern: "strike" },
  { id: "save", label: "Save", pattern: "save" },
  { id: "fastbreak", label: "Fast Break", pattern: "fastbreak" },
  { id: "final", label: "Final", pattern: "final" },
  { id: "victory", label: "Victory", pattern: "victory" },
  { id: "city", label: "City", pattern: "city" },
  { id: "pure", label: "Pure", pattern: "pure" },
  { id: "level", label: "Level", pattern: "level" },
  { id: "vivo", label: "Vivo", pattern: "vivo" },
  { id: "orion", label: "Orion", pattern: "orion" },
  { id: "animal", label: "Animal", pattern: "animal" },
  { id: "avatar", label: "Avatar", pattern: "avatar" },
  { id: "league", label: "League", pattern: "league" },
  { id: "magic", label: "Magic", pattern: "magic" },
  { id: "raid", label: "Raid", pattern: "raid" },
  { id: "rush", label: "Rush", pattern: "rush" },
  { id: "score", label: "Score", pattern: "score" },
];

// ─── Toggle Switch ──────────────────────────────────────────────────────────
function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${value ? "bg-zinc-900" : "bg-zinc-300"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${value ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

// ─── Sidebar Tabs ───────────────────────────────────────────────────────────
const TABS = [
  { id: "designs", icon: LayoutTemplate, label: "Designs" },
  { id: "colors", icon: Palette, label: "Colors" },
  { id: "patterns", icon: Grid, label: "Patterns" },
  { id: "text", icon: Type, label: "Text" },
  // { id: "logos", icon: ImageIcon, label: "Uploads" },
  { id: "style", icon: Scissors, label: "Style" },
  { id: "fabric", icon: Box, label: "Fabric" },
];

// ─── View Handler ───────────────────────────────────────────────────────────
function ViewHandler({ currentView }: { currentView: string }) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (!controlsRef.current) return;

    let shouldUpdate = false;
    if (currentView === "front") {
      camera.position.set(0, 0.1, 4);
      shouldUpdate = true;
    } else if (currentView === "back") {
      camera.position.set(0, 0.1, -4);
      shouldUpdate = true;
    } else if (currentView === "sleeves") {
      camera.position.set(4, 0.1, 0); // Side view
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      controlsRef.current.target.set(0, 0.1, 0);
      controlsRef.current.update();
    }
  }, [currentView, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI * 0.75}
      minDistance={1}
      maxDistance={7}
      autoRotate={currentView === "360"}
      autoRotateSpeed={5}
    />
  );
}

interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  font: string;
  color: string;
  textSize: number;
  side: "Front" | "Back";
  letterSpacing?: number;
  lineSpacing?: number;
  curveRadius?: number;
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  outlineEnabled?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
}

interface LogoLayer {
  id: string;
  src: string; // data URL or preset URL
  x: number; // coordinate X on canvas (0-1024)
  y: number; // coordinate Y on canvas (0-1024)
  scale: number; // scale factor
  rotation: number; // rotation in degrees
  side: "Front" | "Back";
  baseSize: number; // base size (default 200px)
  opacity?: number; // opacity between 0.0 and 1.0 (default 1.0)
  eraserPaths?: Array<{
    points: Array<{ x: number; y: number }>;
    size: number;
  }>;
  type?: "logo" | "image"; // logo = always on top; image = background wrap
  zOrder?: "bottom" | "above-text"; // only used when type === "image"
}

const getFontFamily = (font: string) => {
  if (font === "Script") return '"Brush Script MT", cursive';
  if (font === "Block") return '"Courier New", monospace';
  if (font === "Varsity") return '"Arial Black", sans-serif';
  if (font === "Serif Athletic") return '"Alfa Slab One", serif';
  if (font === "Cyberpunk") return '"Orbitron", sans-serif';
  if (font === "Grunge") return '"Rubik Glitch", display';
  if (font === "Neon Glow") return '"Monoton", sans-serif';
  if (font === "Gothic") return '"UnifrakturMaguntia", serif';
  return "Impact, sans-serif";
};

const getFontWeight = (font: string) => {
  if (font === "Grunge" || font === "Neon Glow" || font === "Gothic")
    return "400";
  return "900";
};

const getFontStyle = (font: string) => {
  return font === "Italic" ? "italic" : "normal";
};

// ─── Main Component ─────────────────────────────────────────────────────────
export default function CustomizerLayout() {
  const [activeTab, setActiveTab] = useState("designs");
  const [qty, setQty] = useState(1);
  const [selectedDesign, setSelectedDesign] = useState("throw");
  const [currentView, setCurrentView] = useState("front");
  const [uploadedLogos, setUploadedLogos] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadSubTab, setUploadSubTab] = useState<"logo" | "image">("logo");

  const threeRef = useRef<{
    gl: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.Camera;
  } | null>(null);

  const texturesRef = useRef<{
    front: THREE.CanvasTexture | null;
    back: THREE.CanvasTexture | null;
    patternFront?: THREE.CanvasTexture | null;
    patternBack?: THREE.CanvasTexture | null;
  }>({ front: null, back: null, patternFront: null, patternBack: null });

  const editorWidth = 280;
  const canvasSize = 1024;
  const editorScale = editorWidth / canvasSize; // 0.2734

  const renderTextLayer = (
    layer: TextLayer,
    isHidden = false,
    children?: React.ReactNode,
  ) => {
    const isOutline = layer.font === "Outline";
    const letterSpacing = layer.letterSpacing || 0;
    const lineSpacing = layer.lineSpacing || 1.15;
    const curveVal = layer.curveRadius || 0;
    const fontSize = layer.textSize * layer.scale * editorScale;

    // Standard styling for both straight & curved text containers
    const baseStyle: React.CSSProperties = {
      position: "relative",
      padding: "6px 10px",
      fontFamily: getFontFamily(layer.font),
      fontWeight: getFontWeight(layer.font),
      fontStyle: getFontStyle(layer.font),
      userSelect: "none",
      visibility: isHidden ? "hidden" : "visible",
    };

    if (curveVal === 0) {
      return (
        <div
          style={{
            ...baseStyle,
            fontSize: `${fontSize}px`,
            whiteSpace: "pre-line",
            textAlign: "center",
            letterSpacing: `${letterSpacing * editorScale}px`,
            lineHeight: lineSpacing,
            WebkitTextStroke:
              layer.outlineEnabled && layer.outlineWidth
                ? `${layer.outlineWidth * editorScale}px ${layer.outlineColor || "#FFFFFF"}`
                : isOutline
                  ? `1px ${layer.color}`
                  : "none",
            color: isOutline ? "transparent" : layer.color,
            textShadow: layer.shadowEnabled
              ? `${(layer.shadowOffsetX ?? 4) * editorScale}px ${(layer.shadowOffsetY ?? 4) * editorScale}px ${(layer.shadowBlur ?? 10) * editorScale}px ${layer.shadowColor || "#000000"}`
              : undefined,
          }}
        >
          {layer.text}
          {children}
        </div>
      );
    }

    // Curved text rendering
    const lines = layer.text.split("\n");
    const lineSpacingHeight = fontSize * lineSpacing;
    const totalHeight = (lines.length - 1) * lineSpacingHeight;
    const verticalOffset = -totalHeight / 2;

    // Estimate character widths for each line to find the max width
    const lineTotalWidths = lines.map((line) => {
      const chars = Array.from(line);
      const charWidths = chars.map((c) => {
        if (c === "I" || c === "i" || c === "l" || c === "1" || c === " ")
          return fontSize * 0.25;
        if (c === "M" || c === "W" || c === "m" || c === "w")
          return fontSize * 0.8;
        return fontSize * 0.55;
      });
      return (
        charWidths.reduce((a, b) => a + b, 0) +
        (chars.length - 1) * letterSpacing * editorScale
      );
    });

    const maxLineWidth = Math.max(...lineTotalWidths);

    return (
      <div
        style={{
          ...baseStyle,
          position: "relative",
          width: `${maxLineWidth}px`,
          height: `${totalHeight + fontSize}px`,
        }}
      >
        {lines.map((line, lineIndex) => {
          const curY = verticalOffset + lineIndex * lineSpacingHeight;
          const chars = Array.from(line);

          // Estimate character widths for the 2D layout.
          const charWidths = chars.map((c) => {
            if (c === "I" || c === "i" || c === "l" || c === "1" || c === " ")
              return fontSize * 0.25;
            if (c === "M" || c === "W" || c === "m" || c === "w")
              return fontSize * 0.8;
            return fontSize * 0.55;
          });

          const lineTotalWidth =
            charWidths.reduce((a, b) => a + b, 0) +
            (chars.length - 1) * letterSpacing * editorScale;

          const totalAngle = (curveVal * Math.PI) / 180;
          const R = lineTotalWidth / totalAngle;

          let currentS = 0;

          return (
            <div
              key={lineIndex}
              style={{
                position: "absolute",
                width: "100%",
                height: `${fontSize}px`,
                top: `calc(50% + ${curY}px)`,
                left: 0,
              }}
            >
              {chars.map((char, charIdx) => {
                const charW = charWidths[charIdx];
                const charCenterS = currentS + charW / 2;
                const angle = (charCenterS - lineTotalWidth / 2) / R;

                const cx = R * Math.sin(angle);
                const cy = R * (1 - Math.cos(angle));

                currentS += charW + letterSpacing * editorScale;

                return (
                  <span
                    key={charIdx}
                    style={{
                      position: "absolute",
                      left: `calc(50% + ${cx}px)`,
                      top: `calc(50% + ${cy}px)`,
                      transform: `translate(-50%, -50%) rotate(${angle}rad)`,
                      fontSize: `${fontSize}px`,
                      fontFamily: getFontFamily(layer.font),
                      fontWeight: getFontWeight(layer.font),
                      fontStyle: getFontStyle(layer.font),
                      whiteSpace: "nowrap",
                      WebkitTextStroke:
                        layer.outlineEnabled && layer.outlineWidth
                          ? `${layer.outlineWidth * editorScale}px ${layer.outlineColor || "#FFFFFF"}`
                          : isOutline
                            ? `1px ${layer.color}`
                            : "none",
                      color: isOutline ? "transparent" : layer.color,
                      textShadow: layer.shadowEnabled
                        ? `${(layer.shadowOffsetX ?? 4) * editorScale}px ${(layer.shadowOffsetY ?? 4) * editorScale}px ${(layer.shadowBlur ?? 10) * editorScale}px ${layer.shadowColor || "#000000"}`
                        : undefined,
                    }}
                  >
                    {char}
                  </span>
                );
              })}
            </div>
          );
        })}
        {children}
      </div>
    );
  };

  const renderLogoLayer = (
    layer: LogoLayer,
    isHidden = false,
    children?: React.ReactNode,
  ) => {
    const img = loadedLogoImages[layer.src];
    const imgWidth = img ? img.naturalWidth || img.width || 200 : 200;
    const imgHeight = img ? img.naturalHeight || img.height || 200 : 200;
    const drawWidth = imgWidth * layer.scale * editorScale;
    const drawHeight = imgHeight * layer.scale * editorScale;

    return (
      <div
        style={{
          position: "relative",
          width: `${drawWidth}px`,
          height: `${drawHeight}px`,
          visibility: isHidden ? "hidden" : "visible",
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!isHidden && (
          <div
            style={{
              opacity: typeof layer.opacity === "number" ? layer.opacity : 1.0,
              width: "100%",
              height: "100%",
            }}
          >
            <LogoCanvasPreview
              layer={layer}
              editorScale={editorScale}
              preloadedImage={img}
            />
          </div>
        )}
        {children}
      </div>
    );
  };

  const [textLayers, setTextLayers] = useState<TextLayer[]>([
    // {
    //   id: "front-text",
    //   text: "VALKYRIE",
    //   x: 512,
    //   y: 370,
    //   scale: 1.0,
    //   rotation: 0,
    //   font: "Varsity",
    //   color: "#FFFFFF",
    //   textSize: 80,
    //   side: "Front",
    //   letterSpacing: 0,
    //   lineSpacing: 1.15,
    //   curveRadius: 0,
    // },
    // {
    //   id: "front-number",
    //   text: "10",
    //   x: 512,
    //   y: 500,
    //   scale: 1.0,
    //   rotation: 0,
    //   font: "Bold",
    //   color: "#111111",
    //   textSize: 120,
    //   side: "Front",
    //   letterSpacing: 0,
    //   lineSpacing: 1.15,
    //   curveRadius: 0,
    // },
    // {
    //   id: "back-text",
    //   text: "PLAYER",
    //   x: 512,
    //   y: 330,
    //   scale: 1.0,
    //   rotation: 0,
    //   font: "Varsity",
    //   color: "#FFFFFF",
    //   textSize: 80,
    //   side: "Back",
    //   letterSpacing: 0,
    //   lineSpacing: 1.15,
    //   curveRadius: 0,
    // },
    // {
    //   id: "back-number",
    //   text: "10",
    //   x: 512,
    //   y: 494,
    //   scale: 1.0,
    //   rotation: 0,
    //   font: "Bold",
    //   color: "#111111",
    //   textSize: 150,
    //   side: "Back",
    //   letterSpacing: 0,
    //   lineSpacing: 1.15,
    //   curveRadius: 0,
    // },
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    "front-text",
  );

  const [logoLayers, setLogoLayers] = useState<LogoLayer[]>([]);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const [loadedLogoImages, setLoadedLogoImages] = useState<
    Record<string, HTMLImageElement>
  >({});
  const [isEraserMode, setIsEraserMode] = useState<boolean>(false);
  const [eraserBrushSize, setEraserBrushSize] = useState<number>(20);

  const [layersOrder, setLayersOrder] = useState<string[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Keep layersOrder in sync with all active layers (Text layers + Logo/Image layers)
  useEffect(() => {
    const textIds = textLayers.map((l) => l.id);
    const logoIds = logoLayers.map((l) => l.id);
    const allIds = [...textIds, ...logoIds];

    setLayersOrder((prev) => {
      // Filter out any IDs that no longer exist
      const existing = prev.filter((id) => allIds.includes(id));
      // Add any new IDs that are not yet in the order list
      const newIds = allIds.filter((id) => !existing.includes(id));

      if (existing.length === prev.length && newIds.length === 0) {
        return prev;
      }

      // Default priority sorting for new layers
      const sortedNew = [...newIds].sort((a, b) => {
        const getPriority = (id: string) => {
          if (id.includes("text") || id.includes("number")) return 1;
          const logo = logoLayers.find((l) => l.id === id);
          if (logo) {
            if (logo.type === "image") {
              return logo.zOrder === "above-text" ? 2 : 0;
            }
            return 3;
          }
          return 3;
        };
        return getPriority(a) - getPriority(b);
      });

      return [...existing, ...sortedNew];
    });
  }, [textLayers, logoLayers]);

  const reorderLayers = (fromUIIndex: number, toUIIndex: number) => {
    const sideTextLayers = textLayers.filter((l) => l.side === activeSide);
    const sideLogoLayers = logoLayers.filter((l) => l.side === activeSide);
    const activeSideLayers = [
      ...sideTextLayers.map((l) => ({ ...l, layerType: "text" })),
      ...sideLogoLayers.map((l) => ({ ...l, layerType: "logo" })),
    ];

    const sortedActiveSideLayers = [...activeSideLayers].sort((a, b) => {
      const idxA = layersOrder.indexOf(a.id);
      const idxB = layersOrder.indexOf(b.id);
      const getPriority = (l: any) => {
        if (l.layerType === "text") return 1;
        if (l.type === "image") {
          return l.zOrder === "above-text" ? 2 : 0;
        }
        return 3;
      };
      const valA = idxA !== -1 ? idxA : getPriority(a) * 1000;
      const valB = idxB !== -1 ? idxB : getPriority(b) * 1000;
      // DESCENDING order for UI list (highest draw index = top of list)
      return valB - valA;
    });

    const reorderedSideLayers = [...sortedActiveSideLayers];
    const [movedItem] = reorderedSideLayers.splice(fromUIIndex, 1);
    reorderedSideLayers.splice(toUIIndex, 0, movedItem);

    // Map new UI order back into layersOrder
    setLayersOrder((prev) => {
      const newOrder = [...prev];
      const sideLayerIds = sortedActiveSideLayers.map((l) => l.id);
      const newDrawOrderSideIds = [...reorderedSideLayers]
        .reverse()
        .map((l) => l.id);

      const indices = newOrder
        .map((id, index) => (sideLayerIds.includes(id) ? index : -1))
        .filter((index) => index !== -1);

      indices.forEach((indexInOrder, idx) => {
        newOrder[indexInOrder] = newDrawOrderSideIds[idx];
      });

      return newOrder;
    });
  };

  useEffect(() => {
    logoLayers.forEach((layer) => {
      if (loadedLogoImages[layer.src]) return;
      const img = new Image();
      img.src = layer.src;
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setLoadedLogoImages((prev) => ({
          ...prev,
          [layer.src]: img,
        }));
      };
    });
  }, [logoLayers, loadedLogoImages]);

  useEffect(() => {
    if (!selectedLogoId) {
      setIsEraserMode(false);
    }
  }, [selectedLogoId]);

  const handleDragStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setSelectedLayerId(id);

    const layer = textLayers.find((l) => l.id === id);
    if (!layer) return;

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startX = layer.x;
    const startY = layer.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startMouseX) / editorScale;
      const deltaY = (moveEvent.clientY - startMouseY) / editorScale;

      setTextLayers((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                x: startX + deltaX,
                y: startY + deltaY,
              }
            : l,
        ),
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleRotateStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    const layer = textLayers.find((l) => l.id === id);
    if (!layer) return;

    const target = (e.currentTarget as HTMLElement).parentElement
      ?.parentElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startAngle = Math.atan2(startMouseY - centerY, startMouseX - centerX);
    const startRotation = layer.rotation;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentAngle = Math.atan2(
        moveEvent.clientY - centerY,
        moveEvent.clientX - centerX,
      );
      const angleDiff = currentAngle - startAngle;
      let newRotation = startRotation + angleDiff * (180 / Math.PI);

      newRotation = ((newRotation % 360) + 360) % 360;

      setTextLayers((prev) =>
        prev.map((l) => (l.id === id ? { ...l, rotation: newRotation } : l)),
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleScaleStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    const layer = textLayers.find((l) => l.id === id);
    if (!layer) return;

    const target = (e.currentTarget as HTMLElement).parentElement
      ?.parentElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startDist = Math.sqrt(
      Math.pow(startMouseX - centerX, 2) + Math.pow(startMouseY - centerY, 2),
    );
    const startScale = layer.scale;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const curDist = Math.sqrt(
        Math.pow(moveEvent.clientX - centerX, 2) +
          Math.pow(moveEvent.clientY - centerY, 2),
      );
      const newScale = Math.max(
        0.2,
        Math.min(5.0, startScale * (curDist / startDist)),
      );

      setTextLayers((prev) =>
        prev.map((l) => (l.id === id ? { ...l, scale: newScale } : l)),
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleCopy = (id: string) => {
    const layer = textLayers.find((l) => l.id === id);
    if (!layer) return;

    const newLayer: TextLayer = {
      ...layer,
      id: `${layer.id}-copy-${Date.now()}`,
      x: Math.min(1024, layer.x + 40),
      y: Math.min(1024, layer.y + 40),
    };

    setTextLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const handleDelete = (id: string) => {
    setTextLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
  };

  const activeSide =
    currentView === "back" || currentView === "back-center" ? "Back" : "Front";

  const handleAddCustomText = () => {
    const newId = `custom-text-${Date.now()}`;
    const newLayer: TextLayer = {
      id: newId,
      text: "CUSTOM TEXT",
      x: 512,
      y: 500,
      scale: 1.0,
      rotation: 0,
      font: "Varsity",
      color: "#E63946",
      textSize: 100,
      side: activeSide,
      letterSpacing: 0,
      lineSpacing: 1.15,
      curveRadius: 0,
      shadowEnabled: false,
      shadowColor: "#000000",
      shadowBlur: 10,
      shadowOffsetX: 4,
      shadowOffsetY: 4,
      outlineEnabled: false,
      outlineColor: "#FFFFFF",
      outlineWidth: 4,
    };
    setTextLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newId);
  };

  const handleExport = () => {
    const triggerLocalDownload = (dataUrl: string, fileName: string) => {
      try {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = fileName;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();

        // Clean up immediately to unblock the browser event loop
        setTimeout(() => {
          if (link.parentNode) {
            document.body.removeChild(link);
          }
          if (dataUrl.startsWith("blob:")) {
            URL.revokeObjectURL(dataUrl); // Free up client-side memory safely
          }
        }, 100);
      } catch (err) {
        console.error(`Error triggering download for ${fileName}:`, err);
      }
    };

    // 1. Client-side 3D Canvas Snapshot (Immediate)
    setTimeout(() => {
      try {
        if (threeRef.current) {
          const { gl, scene, camera } = threeRef.current;
          gl.render(scene, camera);
          const dataURL = gl.domElement.toDataURL("image/png");
          triggerLocalDownload(dataURL, "jersey-3d-preview.png");
        } else {
          console.warn("threeRef.current is null - skipping 3D snapshot");
        }
      } catch (err) {
        console.error("Error capturing 3D preview snapshot:", err);
      }
    }, 0);

    // 2. Client-side Flat Production Texture Export (Staggered by 300ms)
    setTimeout(() => {
      try {
        const activeSide =
          currentView === "back" || currentView === "back-center"
            ? "Back"
            : "Front";

        const activeDecalTexture =
          activeSide === "Back"
            ? texturesRef.current.back
            : texturesRef.current.front;
        const activePatternTexture =
          activeSide === "Back"
            ? texturesRef.current.patternBack
            : texturesRef.current.patternFront;

        if (activeDecalTexture && activeDecalTexture.image) {
          const size = 1024;
          const exportCanvas = document.createElement("canvas");
          exportCanvas.width = size;
          exportCanvas.height = size;
          const exportCtx = exportCanvas.getContext("2d");
          if (exportCtx) {
            // 1. Draw base pattern/background color if pattern exists
            if (activePatternTexture && activePatternTexture.image) {
              exportCtx.drawImage(
                activePatternTexture.image as HTMLCanvasElement,
                0,
                0,
              );
            } else {
              // Fallback: fill with active side primary color
              const fallbackColor =
                activeSide === "Front"
                  ? state.primaryFront || state.primary || "#2196F3"
                  : state.primaryBack || state.primary || "#2196F3";
              exportCtx.fillStyle = fallbackColor;
              exportCtx.fillRect(0, 0, size, size);
            }

            // 2. Draw active text/logo decals on top
            exportCtx.drawImage(
              activeDecalTexture.image as HTMLCanvasElement,
              0,
              0,
            );

            const dataURL = exportCanvas.toDataURL("image/png");
            triggerLocalDownload(dataURL, "jersey-print-template.png");
          }
        } else {
          console.warn(
            "activeDecalTexture or activeDecalTexture.image is null - skipping flat texture",
          );
        }
      } catch (err) {
        console.error("Error capturing flat print template:", err);
      }
    }, 300);

    // 3. Download Configuration State as JSON file (Staggered by 600ms)
    setTimeout(() => {
      try {
        const configData = {
          selectedDesign,
          generalState: state,
          textLayers,
          logoLayers,
          timestamp: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(configData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        triggerLocalDownload(url, "jersey-config.json");
      } catch (err) {
        console.error("Error downloading config JSON:", err);
      }
    }, 600);
  };

  const handleEraserStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const selectedLayer = logoLayers.find((l) => l.id === selectedLogoId);
    if (!selectedLayer) return;

    const container = (e.currentTarget as HTMLElement).getBoundingClientRect();

    const getCoords = (evt: MouseEvent | TouchEvent) => {
      if ("touches" in evt && evt.touches.length > 0) {
        return {
          clientX: evt.touches[0].clientX,
          clientY: evt.touches[0].clientY,
        };
      }
      const me = evt as MouseEvent;
      return { clientX: me.clientX, clientY: me.clientY };
    };

    const initCoords = "touches" in e ? e.touches[0] : e;
    const startMouseX = initCoords.clientX;
    const startMouseY = initCoords.clientY;

    const getLocalPoint = (clientX: number, clientY: number) => {
      const logoCenterX = container.left + selectedLayer.x * editorScale;
      const logoCenterY = container.top + selectedLayer.y * editorScale;

      const dx = (clientX - logoCenterX) / editorScale;
      const dy = (clientY - logoCenterY) / editorScale;

      const rad = (-selectedLayer.rotation * Math.PI) / 180;
      const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
      const localY = dx * Math.sin(rad) + dy * Math.cos(rad);

      const img = loadedLogoImages[selectedLayer.src];
      const imgWidth = img ? img.naturalWidth || img.width || 200 : 200;
      const imgHeight = img ? img.naturalHeight || img.height || 200 : 200;

      const lx = localX / selectedLayer.scale + imgWidth / 2;
      const ly = localY / selectedLayer.scale + imgHeight / 2;

      return { x: lx, y: ly };
    };

    const initialPoint = getLocalPoint(startMouseX, startMouseY);
    const localBrushSize = eraserBrushSize / selectedLayer.scale;

    const newStroke = {
      points: [initialPoint],
      size: localBrushSize,
    };

    const updatedPaths = [...(selectedLayer.eraserPaths || []), newStroke];
    setLogoLayers((prev) =>
      prev.map((l) =>
        l.id === selectedLayer.id ? { ...l, eraserPaths: updatedPaths } : l,
      ),
    );

    const handleMove = (moveEvt: MouseEvent | TouchEvent) => {
      const { clientX, clientY } = getCoords(moveEvt);
      const pt = getLocalPoint(clientX, clientY);

      setLogoLayers((prev) =>
        prev.map((l) => {
          if (l.id !== selectedLayer.id) return l;
          const paths = l.eraserPaths || [];
          if (paths.length === 0) return l;
          const lastPath = paths[paths.length - 1];
          const updatedLastPath = {
            ...lastPath,
            points: [...lastPath.points, pt],
          };
          return {
            ...l,
            eraserPaths: [...paths.slice(0, -1), updatedLastPath],
          };
        }),
      );
    };

    const handleEnd = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
  };

  const handleLogoDragStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setSelectedLogoId(id);
    setSelectedLayerId(null); // Deselect text layers

    const layer = logoLayers.find((l) => l.id === id);
    if (!layer) return;

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startX = layer.x;
    const startY = layer.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startMouseX) / editorScale;
      const deltaY = (moveEvent.clientY - startMouseY) / editorScale;

      setLogoLayers((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                x: startX + deltaX,
                y: startY + deltaY,
              }
            : l,
        ),
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleLogoRotateStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    const layer = logoLayers.find((l) => l.id === id);
    if (!layer) return;

    const target = (e.currentTarget as HTMLElement).parentElement
      ?.parentElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startAngle = Math.atan2(startMouseY - centerY, startMouseX - centerX);
    const startRotation = layer.rotation;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentAngle = Math.atan2(
        moveEvent.clientY - centerY,
        moveEvent.clientX - centerX,
      );
      const angleDiff = currentAngle - startAngle;
      let newRotation = startRotation + angleDiff * (180 / Math.PI);
      newRotation = ((newRotation % 360) + 360) % 360;

      setLogoLayers((prev) =>
        prev.map((l) => (l.id === id ? { ...l, rotation: newRotation } : l)),
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleLogoScaleStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    const layer = logoLayers.find((l) => l.id === id);
    if (!layer) return;

    const target = (e.currentTarget as HTMLElement).parentElement
      ?.parentElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startDist = Math.sqrt(
      Math.pow(startMouseX - centerX, 2) + Math.pow(startMouseY - centerY, 2),
    );
    const startScale = layer.scale;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const curDist = Math.sqrt(
        Math.pow(moveEvent.clientX - centerX, 2) +
          Math.pow(moveEvent.clientY - centerY, 2),
      );
      const newScale = Math.max(0.01, startScale * (curDist / startDist));

      setLogoLayers((prev) =>
        prev.map((l) => (l.id === id ? { ...l, scale: newScale } : l)),
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleLogoCopy = (id: string) => {
    const layer = logoLayers.find((l) => l.id === id);
    if (!layer) return;

    const newLayer: LogoLayer = {
      ...layer,
      id: `${layer.id}-copy-${Date.now()}`,
      x: Math.min(1024, layer.x + 40),
      y: Math.min(1024, layer.y + 40),
    };

    setLogoLayers((prev) => [...prev, newLayer]);
    setSelectedLogoId(newLayer.id);
    setSelectedLayerId(null);
  };

  const handleLogoDelete = (id: string) => {
    setLogoLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedLogoId === id) {
      setSelectedLogoId(null);
    }
  };

  const handleAddLogoLayer = (src: string, type: "logo" | "image" = "logo") => {
    const img = new Image();
    img.src = src;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const imgWidth = img.naturalWidth || img.width || 200;
      const imgHeight = img.naturalHeight || img.height || 200;
      const maxDim = Math.max(imgWidth, imgHeight);

      // Calculate a clean relative percentage scale so it initially fits into a 200px equivalent workspace bounding size
      const targetSize = type === "image" ? 400 : 200;
      const initialScale = targetSize / maxDim;

      const newId = `custom-logo-${Date.now()}`;
      const newLayer: LogoLayer = {
        id: newId,
        src,
        x: 512,
        y: 500,
        scale: initialScale,
        rotation: 0,
        side: activeSide,
        baseSize: 200,
        opacity: 1.0,
        type,
        zOrder: type === "image" ? "bottom" : undefined,
      };

      setLoadedLogoImages((prev) => ({
        ...prev,
        [src]: img,
      }));
      setLogoLayers((prev) => [...prev, newLayer]);
      setSelectedLogoId(newId);
      setSelectedLayerId(null);
    };
  };

  useEffect(() => {
    const sideLogos = logoLayers.filter((l) => l.side === activeSide);
    if (sideLogos.length > 0) {
      const currentSelected = logoLayers.find((l) => l.id === selectedLogoId);
      if (!currentSelected || currentSelected.side !== activeSide) {
        setSelectedLogoId(sideLogos[0].id);
      }
    } else {
      setSelectedLogoId(null);
    }
  }, [currentView, activeSide]);

  useEffect(() => {
    if (activeTab === "text") {
      setSelectedLogoId(null);
    } else if (activeTab === "logos") {
      setSelectedLayerId(null);
    }
  }, [activeTab]);

  useEffect(() => {
    const sideLayers = textLayers.filter((l) => l.side === activeSide);
    if (sideLayers.length > 0) {
      const currentSelected = textLayers.find((l) => l.id === selectedLayerId);
      if (!currentSelected || currentSelected.side !== activeSide) {
        setSelectedLayerId(sideLayers[0].id);
      }
    } else {
      setSelectedLayerId(null);
    }
  }, [currentView, activeSide]);

  useEffect(() => {
    const savedLogos = localStorage.getItem("jersey_uploaded_logos");
    if (savedLogos) {
      try {
        setUploadedLogos(JSON.parse(savedLogos));
      } catch (e) {
        console.error(e);
      }
    }
    const savedImages = localStorage.getItem("jersey_uploaded_images");
    if (savedImages) {
      try {
        setUploadedImages(JSON.parse(savedImages));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Web Font Loader to load premium fonts asynchronously
  const [fontsLoaded, setFontsLoaded] = useState(false);
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Orbitron:wght@900&family=Rubik+Glitch&family=Monoton&family=UnifrakturMaguntia&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    document.fonts.ready.then(() => {
      console.log("Premium custom fonts loaded successfully!");
      setFontsLoaded(true);
      // Force canvas texture update by copying textLayers state
      setTextLayers((prev) => [...prev]);
    });

    return () => {
      try {
        document.head.removeChild(link);
      } catch (e) {
        console.error(e);
      }
    };
  }, []);

  const [activePatternSide, setActivePatternSide] = useState<"Front" | "Back">(
    "Front",
  );
  const [state, setState] = useState({
    primary: "#2196F3",
    primaryColorSide: "Both",
    primaryFront: "#2196F3",
    primaryBack: "#2196F3",
    secondary: "#1A1A2E",
    designColor: "#1A1A2E",
    pattern: "None",
    fabricPatternFront: "None",
    fabricPatternBack: "None",
    fabricPatternCustomizeFront: false,
    fabricPatternColorFront: "#d73099",
    fabricPatternBgFront: "#FFFFFF",
    fabricPatternCustomizeBack: false,
    fabricPatternColorBack: "#d73099",
    fabricPatternBgBack: "#FFFFFF",
    frontText: "",
    frontFont: "Varsity",
    frontTextColor: "#FFFFFF",
    frontTextSize: 220,
    backText: "",
    backFont: "Varsity",
    backTextColor: "#FFFFFF",
    backTextSize: 200,
    number: "10",
    numberFont: "Bold",
    numberColor: "#111111",
    numberPosition: "Both",
    sleeve: "Short",
    collarType: "None",
    cutFit: "None",
    fabric: "Mesh",
    collar: false,
    zipper: false,
    designSide: "Both",
    logo: null as string | null,
    logoPosition: "Left Chest",
    logoSize: 0.15,
    logoPosX: 0.065,
    logoPosY: 0.16,
    logoPosZ: 0.15,
    logoRotX: 0,
    logoRotY: 0,
    logoRotZ: 0,
    logoInteractive: true,
  });

  const updateState = (key: string, value: any) =>
    setState((s) => ({ ...s, [key]: value }));

  const [loadedPatterns, setLoadedPatterns] = useState<
    Record<string, HTMLImageElement>
  >({});

  useEffect(() => {
    const activePatterns = [
      state.fabricPatternFront,
      state.fabricPatternBack,
    ].filter((p) => p && p !== "None");

    activePatterns.forEach((patternPath) => {
      if (loadedPatterns[patternPath]) return;

      const img = new Image();
      img.src = patternPath;
      img.onload = () => {
        setLoadedPatterns((prev) => ({
          ...prev,
          [patternPath]: img,
        }));
      };
    });
  }, [state.fabricPatternFront, state.fabricPatternBack, loadedPatterns]);

  const setLogoPositionPreset = (pos: string) => {
    let x = 0.065,
      y = 0.16,
      z = 0.15;
    let rx = 0,
      ry = 0,
      rz = 0;

    switch (pos) {
      case "Left Chest":
        x = 0.065;
        y = 0.16;
        z = 0.15;
        rx = 0;
        ry = 0;
        rz = 0;
        break;
      case "Right Chest":
        x = -0.065;
        y = 0.16;
        z = 0.15;
        rx = 0;
        ry = 0;
        rz = 0;
        break;
      case "Center":
        x = 0.0;
        y = 0.08;
        z = 0.15;
        rx = 0;
        ry = 0;
        rz = 0;
        break;
      case "Back Top":
        x = 0.0;
        y = 0.23;
        z = -0.15;
        rx = 0;
        ry = Math.PI;
        rz = 0;
        break;
      case "Back Center":
        x = 0.0;
        y = 0.05;
        z = -0.15;
        rx = 0;
        ry = Math.PI;
        rz = 0;
        break;
      case "Sleeve":
        x = 0.22;
        y = 0.16;
        z = 0.0;
        rx = 0;
        ry = Math.PI / 2;
        rz = 0;
        break;
    }

    setState((s) => ({
      ...s,
      logoPosition: pos,
      logoPosX: x,
      logoPosY: y,
      logoPosZ: z,
      logoRotX: rx,
      logoRotY: ry,
      logoRotZ: rz,
    }));
  };

  const handleLogoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    uploadType: "logo" | "image" = "logo",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleAddLogoLayer(dataUrl, uploadType);
      if (uploadType === "image") {
        setUploadedImages((prev) => {
          const next = [
            dataUrl,
            ...prev.filter((item) => item !== dataUrl),
          ].slice(0, 12);
          localStorage.setItem("jersey_uploaded_images", JSON.stringify(next));
          return next;
        });
      } else {
        setUploadedLogos((prev) => {
          const next = [
            dataUrl,
            ...prev.filter((item) => item !== dataUrl),
          ].slice(0, 12);
          localStorage.setItem("jersey_uploaded_logos", JSON.stringify(next));
          return next;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const calculatePrice = () => {
    let base = 49;
    if (qty >= 10 && qty < 50) base = 39;
    if (qty >= 50) base = 29;
    if (state.fabric === "Premium") base += 10;
    return base * qty;
  };

  const currentPattern =
    JERSEY_DESIGNS.find((d) => d.id === selectedDesign)?.pattern ?? "plain";

  return (
    <div
      className="flex h-screen w-full bg-white flex-col md:flex-row"
      data-lenis-prevent
    >
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200">
        <Link href="/" className="text-zinc-600">
          <ChevronLeft />
        </Link>
        <div className="font-bold">Jersey Builder</div>
      </div>

      {/* ── Icon Sidebar ── */}
      <div className="hidden md:flex w-20 flex-col items-center bg-white border-r border-zinc-200 py-6 gap-4 z-20 overflow-y-auto">
        {/* Brand Logo */}
        <Link href="/" className="mb-2">
          <img
            src={LogoImg.src}
            alt="Logo"
            width={60}
            height={40}
            className="cursor-pointer object-contain"
          />
        </Link>
        {TABS?.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative group py-2.5 rounded-xl flex flex-col items-center justify-center cursor-pointer gap-1 transition-all duration-300 w-16 ${
                isActive
                  ? "text-[#00263C]"
                  : "text-zinc-400 hover:text-[#00263C]"
              }`}
            >
              {/* Highlight background pill for active state */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-[#00263C]/5 border-l-2 border-[#00263C] rounded-xl"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <tab.icon
                className={`w-5 h-5 transition-transform duration-300 ${
                  isActive ? "scale-110" : "group-hover:scale-105"
                }`}
              />
              <span
                className={`text-[10px] tracking-wide text-center transition-all duration-300 ${
                  isActive
                    ? "font-bold"
                    : "font-medium text-zinc-500 group-hover:text-[#00263C]"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Settings Panel ── */}
      <div className="w-full md:w-80 bg-white border-r border-zinc-200 flex flex-col h-full z-10 shadow-lg">
        <div className="p-5 border-b border-zinc-200 bg-zinc-50/60">
          <h2 className="text-xl font-bold text-[#00263C] capitalize">
            {TABS.find((t) => t.id === activeTab)?.label}
          </h2>
          <p className="text-sm text-[#00263C] mt-0.5">Customize your jersey</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
            >
              {/* ── DESIGNS TAB ── */}
              {activeTab === "designs" && (
                <div className="space-y-5">
                  {/* Collar toggle */}
                  <div className="flex items-center justify-between py-3 border-b border-zinc-100">
                    <span className="text-sm font-semibold text-[#00263C]">
                      Add Collar
                    </span>
                    <Toggle
                      value={state.collar}
                      onChange={(v) => {
                        updateState("collar", v);
                        if (v && state.collarType === "None") {
                          updateState("collarType", "Polo");
                        }
                      }}
                    />
                  </div>
                  {/* Closure selection */}
                  {state.collar &&
                    (state.collarType === "Polo" ||
                      state.collarType === "Henley") && (
                      <div className="py-3 border-b border-zinc-100 space-y-2">
                        <span className="text-sm font-semibold text-zinc-800 block">
                          Closure Type
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => updateState("zipper", false)}
                            className={`p-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 duration-200 ${
                              !state.zipper
                                ? "border-red-500 bg-red-50 text-red-700 font-extrabold"
                                : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                            }`}
                          >
                            Button Placket
                          </button>
                          <button
                            onClick={() => updateState("zipper", true)}
                            className={`p-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 duration-200 ${
                              state.zipper
                                ? "border-red-500 bg-red-50 text-red-700 font-extrabold"
                                : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                            }`}
                          >
                            Zipper (+$5)
                          </button>
                        </div>
                      </div>
                    )}

                  {/* Grid of designs */}
                  <div className="grid grid-cols-4 gap-3 pt-1">
                    {JERSEY_DESIGNS.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDesign(d.id)}
                        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
                          selectedDesign === d.id
                            ? "bg-red-50 ring-2 ring-red-500"
                            : "hover:bg-zinc-50"
                        }`}
                      >
                        <div className="w-14 h-14">
                          <JerseySVG
                            primary={state.primary}
                            secondary={
                              selectedDesign === d.id
                                ? state.designColor || state.secondary
                                : state.secondary
                            }
                            pattern={d.pattern}
                            selected={selectedDesign === d.id}
                          />
                        </div>
                        <span
                          className={`text-[9px] font-bold leading-tight text-center ${selectedDesign === d.id ? "text-red-600" : "text-zinc-500"}`}
                        >
                          {d.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Design Side: Front / Back / Both & Shape Color Customization */}
                  {selectedDesign !== "throw" && (
                    <div className="pt-2 space-y-4">
                      <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
                          Apply To
                        </label>
                        <div className="flex gap-2">
                          {["Front", "Back", "Both"].map((side) => (
                            <button
                              key={side}
                              onClick={() => updateState("designSide", side)}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                                state.designSide === side
                                  ? "border-red-500 bg-red-50 text-red-600"
                                  : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                              }`}
                            >
                              {side}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
                          Design Color
                        </label>
                        <div className="flex gap-1.5 flex-wrap mb-2">
                          {[
                            "#1A1A2E",
                            "#FFFFFF",
                            "#E63946",
                            "#2196F3",
                            "#FFD166",
                            "#06D6A0",
                            "#111111",
                            "#8D99AE",
                            "#FF5E7E",
                            "#7B2CBF",
                          ].map((c) => (
                            <button
                              key={c}
                              onClick={() => updateState("designColor", c)}
                              className={`w-7 h-7 rounded-full border transition-transform ${
                                state.designColor === c
                                  ? "border-zinc-950 scale-110 ring-1 ring-offset-1 ring-zinc-400"
                                  : "border-black/10 hover:scale-105"
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={state.designColor || "#1A1A2E"}
                            onChange={(e) =>
                              updateState("designColor", e.target.value)
                            }
                            className="w-8 h-8 rounded cursor-pointer border border-zinc-200 p-0"
                          />
                          <span className="text-xs text-zinc-500 font-mono">
                            {(state.designColor || "#1A1A2E").toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── COLORS TAB ── */}
              {activeTab === "colors" && (
                <div className="space-y-6">
                  {(() => {
                    const side = state.primaryColorSide || "Both";
                    const activeColor =
                      side === "Back"
                        ? state.primaryBack || state.primary
                        : side === "Front"
                          ? state.primaryFront || state.primary
                          : state.primary;

                    const handleColorChange = (c: string) => {
                      if (side === "Both") {
                        setState((s) => ({
                          ...s,
                          primary: c,
                          primaryFront: c,
                          primaryBack: c,
                        }));
                      } else if (side === "Front") {
                        setState((s) => ({
                          ...s,
                          primaryFront: c,
                          primary: c,
                        }));
                      } else {
                        setState((s) => ({
                          ...s,
                          primaryBack: c,
                        }));
                      }
                    };

                    return (
                      <div>
                        <label className="text-sm font-bold text-zinc-900 mb-3 block">
                          Primary Color
                        </label>

                        {/* Side Selector */}
                        <div className="flex gap-1.5 p-1 bg-zinc-100 rounded border mb-4">
                          {[
                            { id: "Both", label: "Both" },
                            { id: "Front", label: "Front" },
                            { id: "Back", label: "Back" },
                          ].map((sOption) => (
                            <button
                              key={sOption.id}
                              onClick={() =>
                                updateState("primaryColorSide", sOption.id)
                              }
                              className={`flex-1 py-1.5 text-xs font-bold rounded cursor-pointer transition-all text-center ${
                                side === sOption.id
                                  ? "bg-white text-zinc-900 shadow-sm"
                                  : "text-zinc-500 hover:text-zinc-800"
                              }`}
                            >
                              {sOption.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2 flex-wrap mb-3">
                          {[
                            "#E63946",
                            "#2196F3",
                            "#111111",
                            "#FFFFFF",
                            "#CCCCCC",
                            "#457B9D",
                            "#2A9D8F",
                            "#F4A261",
                            "#726DE8",
                            "#FF6B6B",
                            "#80C670",
                            "#EFBD4E",
                          ].map((c) => (
                            <button
                              key={c}
                              onClick={() => handleColorChange(c)}
                              className={`w-9 h-9 rounded border-2 transition-transform ${
                                activeColor === c
                                  ? "border-zinc-900 scale-110 ring-2 ring-offset-1 ring-zinc-400"
                                  : "border-black/10 hover:scale-105"
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <input
                            type="color"
                            value={activeColor}
                            onChange={(e) => handleColorChange(e.target.value)}
                            className="w-9 h-9 rounded cursor-pointer border border-zinc-200"
                          />
                          <span className="text-xs text-zinc-500 font-mono">
                            {activeColor.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ── PATTERNS TAB ── */}
              {activeTab === "patterns" && (
                <div className="space-y-4">
                  {/* Pattern Side Selector */}
                  <div className="flex gap-1.5 p-1 bg-zinc-100 rounded border">
                    <button
                      onClick={() => setActivePatternSide("Front")}
                      className={`flex-1 py-2 text-xs font-bold rounded cursor-pointer transition-all text-center ${
                        activePatternSide === "Front"
                          ? "bg-white text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-800"
                      }`}
                    >
                      Front Side
                    </button>
                    <button
                      onClick={() => setActivePatternSide("Back")}
                      className={`flex-1 py-2 text-xs font-bold rounded cursor-pointer transition-all text-center ${
                        activePatternSide === "Back"
                          ? "bg-white text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-800"
                      }`}
                    >
                      Back Side
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {[
                      { id: "None", label: "Solid Color", url: "" },
                      {
                        id: "/assets/images/patterns/pattern_1.png",
                        label: "Pattern 1",
                        url: "/assets/images/patterns/pattern_1.png",
                      },
                      {
                        id: "/assets/images/patterns/pattern_2.png",
                        label: "Pattern 2",
                        url: "/assets/images/patterns/pattern_2.png",
                      },
                      {
                        id: "/assets/images/patterns/pattern_3.png",
                        label: "Pattern 3",
                        url: "/assets/images/patterns/pattern_3.png",
                      },
                      {
                        id: "/assets/images/patterns/pattern_4.png",
                        label: "Pattern 4",
                        url: "/assets/images/patterns/pattern_4.png",
                      },
                      {
                        id: "/assets/images/patterns/pattern_5.png",
                        label: "Pattern 5",
                        url: "/assets/images/patterns/pattern_5.png",
                      },
                    ].map((p) => {
                      const isSelected =
                        activePatternSide === "Front"
                          ? state.fabricPatternFront === p.id
                          : state.fabricPatternBack === p.id;

                      return (
                        <button
                          key={p.id}
                          onClick={() =>
                            updateState(
                              activePatternSide === "Front"
                                ? "fabricPatternFront"
                                : "fabricPatternBack",
                              p.id,
                            )
                          }
                          className={`flex flex-col p-2.5 rounded-lg border transition-all text-left ${
                            isSelected
                              ? "border-red-500 bg-red-50/50"
                              : "border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          <div className="w-full h-20 rounded-lg overflow-hidden mb-2 bg-zinc-100 border border-zinc-200/50 flex items-center justify-center relative">
                            {p.id === "None" ? (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-200 text-zinc-500 font-bold text-xs">
                                Solid
                              </div>
                            ) : (
                              <img
                                src={p.url}
                                alt={p.label}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <span
                            className={`text-[11px] font-medium text-center w-full ${
                              isSelected
                                ? "text-red-700 font-bold"
                                : "text-[#002337]"
                            }`}
                          >
                            {p.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Pattern Color Customizer UI */}
                  {(() => {
                    const selectedPattern =
                      activePatternSide === "Front"
                        ? state.fabricPatternFront
                        : state.fabricPatternBack;

                    if (!selectedPattern || selectedPattern === "None")
                      return null;

                    const customizeActive =
                      activePatternSide === "Front"
                        ? state.fabricPatternCustomizeFront
                        : state.fabricPatternCustomizeBack;

                    const customizeKey =
                      activePatternSide === "Front"
                        ? "fabricPatternCustomizeFront"
                        : "fabricPatternCustomizeBack";

                    const colorVal =
                      activePatternSide === "Front"
                        ? state.fabricPatternColorFront
                        : state.fabricPatternColorBack;

                    const colorKey =
                      activePatternSide === "Front"
                        ? "fabricPatternColorFront"
                        : "fabricPatternColorBack";

                    const bgVal =
                      activePatternSide === "Front"
                        ? state.fabricPatternBgFront
                        : state.fabricPatternBgBack;

                    const bgKey =
                      activePatternSide === "Front"
                        ? "fabricPatternBgFront"
                        : "fabricPatternBgBack";

                    return (
                      <div className="mt-6 p-4 rounded-xl border border-zinc-100 bg-zinc-50/50 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-zinc-800">
                              Customize Pattern Colors
                            </h4>
                            <p className="text-[10px] text-zinc-500">
                              Change pattern colors or make background
                              transparent
                            </p>
                          </div>
                          <Toggle
                            value={customizeActive}
                            onChange={(v) => {
                              updateState(customizeKey, v);
                              if (v) {
                                const defaults =
                                  PATTERN_DEFAULT_COLORS[selectedPattern];
                                if (defaults) {
                                  if (!colorVal)
                                    updateState(colorKey, defaults.design);
                                  if (!bgVal) updateState(bgKey, defaults.bg);
                                }
                              }
                            }}
                          />
                        </div>

                        {customizeActive && (
                          <div className="space-y-4 pt-2 border-t border-zinc-100">
                            {/* Design Color */}
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold text-zinc-600 block">
                                Pattern Design Color
                              </label>
                              <div className="flex gap-2 flex-wrap mb-2">
                                {[
                                  "#E63946",
                                  "#2196F3",
                                  "#111111",
                                  "#FFFFFF",
                                  "#CCCCCC",
                                  "#457B9D",
                                  "#2A9D8F",
                                  "#F4A261",
                                  "#726DE8",
                                  "#FF6B6B",
                                  "#80C670",
                                  "#EFBD4E",
                                ].map((c) => (
                                  <button
                                    key={c}
                                    onClick={() => updateState(colorKey, c)}
                                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                                      colorVal === c
                                        ? "border-zinc-900 scale-110"
                                        : "border-black/10 hover:scale-105"
                                    }`}
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                              </div>
                              <div className="flex items-center gap-3">
                                <input
                                  type="color"
                                  value={colorVal}
                                  onChange={(e) =>
                                    updateState(colorKey, e.target.value)
                                  }
                                  className="w-8 h-8 rounded cursor-pointer border border-zinc-200"
                                />
                                <span className="text-xs text-zinc-500 font-mono">
                                  {colorVal.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Background Color */}
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold text-zinc-600 block">
                                Pattern Background Color
                              </label>
                              <div className="flex gap-2 flex-wrap mb-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateState(bgKey, "transparent")
                                  }
                                  className={`h-7 px-3 rounded-full border-2 text-[10px] font-bold transition-all ${
                                    bgVal === "transparent"
                                      ? "border-zinc-900 bg-zinc-900 text-white"
                                      : "border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700"
                                  }`}
                                >
                                  Transparent
                                </button>
                                {[
                                  "#E63946",
                                  "#2196F3",
                                  "#111111",
                                  "#FFFFFF",
                                  "#CCCCCC",
                                  "#457B9D",
                                  "#2A9D8F",
                                  "#F4A261",
                                  "#726DE8",
                                  "#FF6B6B",
                                  "#80C670",
                                  "#EFBD4E",
                                ].map((c) => (
                                  <button
                                    key={c}
                                    onClick={() => updateState(bgKey, c)}
                                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                                      bgVal === c
                                        ? "border-zinc-900 scale-110"
                                        : "border-black/10 hover:scale-105"
                                    }`}
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                              </div>
                              {bgVal !== "transparent" && (
                                <div className="flex items-center gap-3">
                                  <input
                                    type="color"
                                    value={bgVal}
                                    onChange={(e) =>
                                      updateState(bgKey, e.target.value)
                                    }
                                    className="w-8 h-8 rounded cursor-pointer border border-zinc-200"
                                  />
                                  <span className="text-xs text-zinc-500 font-mono">
                                    {bgVal.toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ── TEXT TAB ── */}
              {activeTab === "text" && (
                <div className="space-y-6">
                  {/* Front/Back View Segmented Switcher */}
                  <div className="flex bg-zinc-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setCurrentView("front")}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                        activeSide === "Front"
                          ? "bg-white text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-900"
                      }`}
                    >
                      Front Side
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentView("back")}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                        activeSide === "Back"
                          ? "bg-white text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-900"
                      }`}
                    >
                      Back Side
                    </button>
                  </div>

                  {/* Visual 2D Editor Canvas representation */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                        Visual Text Editor ({activeSide} View)
                      </label>
                      <button
                        onClick={handleAddCustomText}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1 cursor-pointer"
                      >
                        <Type className="w-3.5 h-3.5" /> Add Text
                      </button>
                    </div>

                    {/* Bounding Box Customizer Canvas area (280x280) */}
                    <div
                      className="relative w-[280px] h-[280px] rounded border border-zinc-200 shadow-inner mx-auto select-none"
                      style={{
                        background:
                          "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
                      }}
                    >
                      {/* 1. Backdrop (inside overflow-hidden) */}
                      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                        {/* Jersey Silhouette Backdrop helper */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                          <svg
                            viewBox="0 0 100 100"
                            className="w-48 h-48 fill-white"
                          >
                            <path d="M 30,15 L 70,15 L 85,25 L 80,45 L 70,40 L 70,85 L 30,85 L 30,40 L 20,45 L 15,25 Z" />
                          </svg>
                        </div>
                        {/* Canvas area grid lines */}
                        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-size-[20px_20px]" />
                      </div>

                      {/* Active side text label */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-zinc-500 tracking-widest uppercase pointer-events-none">
                        {activeSide} Texture Map (1024x1024)
                      </div>

                      {/* 2. Text Content Container (Clipped at bounds) */}
                      <div className="absolute inset-0 rounded-2xl overflow-hidden">
                        {textLayers
                          .filter((layer) => layer.side === activeSide)
                          .map((layer) => {
                            const isSelected = selectedLayerId === layer.id;
                            return (
                              <div
                                key={layer.id}
                                style={{
                                  position: "absolute",
                                  left: layer.x * editorScale,
                                  top: layer.y * editorScale,
                                  transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                                  cursor: "move",
                                  zIndex: isSelected ? 40 : 10,
                                }}
                                onMouseDown={(e) =>
                                  handleDragStart(e, layer.id)
                                }
                              >
                                {renderTextLayer(layer, false)}
                              </div>
                            );
                          })}
                      </div>

                      {/* 3. Bounding Box & Handles Overlay (Visible outside bounds) */}
                      <div className="absolute inset-0 pointer-events-none">
                        {textLayers
                          .filter(
                            (layer) =>
                              layer.side === activeSide &&
                              selectedLayerId === layer.id,
                          )
                          .map((layer) => {
                            return (
                              <div
                                key={`handles-${layer.id}`}
                                style={{
                                  position: "absolute",
                                  left: layer.x * editorScale,
                                  top: layer.y * editorScale,
                                  transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                                  pointerEvents: "none",
                                  zIndex: 50,
                                }}
                              >
                                {renderTextLayer(
                                  layer,
                                  true,
                                  <>
                                    {/* Bounding Box Border */}
                                    <div
                                      className="absolute inset-0 border border-dashed border-red-500"
                                      style={{ visibility: "visible" }}
                                    />

                                    {/* Interactive Handles */}
                                    <div style={{ visibility: "visible" }}>
                                      {/* Top-Left: Duplicate */}
                                      <button
                                        className="absolute -top-3.5 -left-3.5 w-6 h-6 bg-white border border-zinc-200 hover:bg-zinc-50 shadow-md rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform pointer-events-auto"
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          handleCopy(layer.id);
                                        }}
                                        title="Duplicate"
                                      >
                                        <svg
                                          className="w-3.5 h-3.5 text-zinc-600"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2.5}
                                            d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                                          />
                                        </svg>
                                      </button>

                                      {/* Top-Right: Rotate */}
                                      <div
                                        className="absolute -top-3.5 -right-3.5 w-6 h-6 bg-white border border-zinc-200 hover:bg-zinc-50 shadow-md rounded-full flex items-center justify-center cursor-alias active:scale-90 transition-transform pointer-events-auto"
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          handleRotateStart(e, layer.id);
                                        }}
                                        title="Rotate"
                                      >
                                        <svg
                                          className="w-3.5 h-3.5 text-zinc-600"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2.5}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89"
                                          />
                                        </svg>
                                      </div>

                                      {/* Bottom-Left: Delete */}
                                      <button
                                        className="absolute -bottom-3.5 -left-3.5 w-6 h-6 bg-red-500 hover:bg-red-600 shadow-md rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform pointer-events-auto"
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          handleDelete(layer.id);
                                        }}
                                        title="Delete"
                                      >
                                        <svg
                                          className="w-3.5 h-3.5 text-white"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2.5}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                          />
                                        </svg>
                                      </button>

                                      {/* Bottom-Right: Scale */}
                                      <div
                                        className="absolute -bottom-3.5 -right-3.5 w-6 h-6 bg-blue-500 hover:bg-blue-600 shadow-md rounded-full flex items-center justify-center cursor-se-resize active:scale-90 transition-transform pointer-events-auto"
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          handleScaleStart(e, layer.id);
                                        }}
                                        title="Scale"
                                      >
                                        <svg
                                          className="w-3.5 h-3.5 text-white"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2.5}
                                            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                                          />
                                        </svg>
                                      </div>
                                    </div>
                                  </>,
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  {/* Layers List Selection */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      Text Layers List ({activeSide} Side)
                    </label>
                    <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {textLayers.filter((l) => l.side === activeSide)
                        .length === 0 ? (
                        <div className="text-xs text-zinc-400 italic text-center py-2 bg-zinc-50 rounded-xl border border-zinc-100">
                          No text layers on this side. Add one above!
                        </div>
                      ) : (
                        textLayers
                          .filter((l) => l.side === activeSide)
                          .map((layer) => {
                            const isSelected = selectedLayerId === layer.id;
                            return (
                              <div
                                key={layer.id}
                                onClick={() => setSelectedLayerId(layer.id)}
                                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                                  isSelected
                                    ? "border-red-500 bg-red-50/30"
                                    : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Type
                                    className={`w-4 h-4 ${isSelected ? "text-red-500" : "text-zinc-400"}`}
                                  />
                                  <span
                                    className={`text-xs font-bold truncate max-w-[150px] ${isSelected ? "text-red-700" : "text-zinc-700"}`}
                                  >
                                    {layer.text || "(Empty Text)"}
                                  </span>
                                </div>
                                <div
                                  className="flex items-center gap-1.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => handleCopy(layer.id)}
                                    className="p-1 hover:bg-zinc-100 rounded-md text-zinc-400 hover:text-zinc-600"
                                    title="Duplicate"
                                  >
                                    <svg
                                      className="w-3.5 h-3.5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(layer.id)}
                                    className="p-1 hover:bg-red-50 rounded-md text-zinc-400 hover:text-red-500"
                                    title="Delete"
                                  >
                                    <svg
                                      className="w-3.5 h-3.5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  {/* Properties Panel of the Selected Layer */}
                  {(() => {
                    const selectedLayer = textLayers.find(
                      (l) => l.id === selectedLayerId,
                    );
                    if (!selectedLayer) return null;

                    return (
                      <div className="space-y-4 pt-4 border-t border-zinc-100">
                        <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                          Layer Settings (
                          {selectedLayer.id.startsWith("front-") ||
                          selectedLayer.id.startsWith("back-")
                            ? "System Layer"
                            : "Custom Layer"}
                          )
                        </h4>

                        <div>
                          <label className="text-xs font-bold text-zinc-800 mb-1.5 block">
                            Text Content
                          </label>
                          <textarea
                            value={selectedLayer.text}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTextLayers((prev) =>
                                prev.map((l) =>
                                  l.id === selectedLayer.id
                                    ? { ...l, text: val }
                                    : l,
                                ),
                              );
                              if (selectedLayer.id === "front-text")
                                updateState("frontText", val);
                              if (selectedLayer.id === "back-text")
                                updateState("backText", val);
                              if (
                                selectedLayer.id === "front-number" ||
                                selectedLayer.id === "back-number"
                              ) {
                                updateState("number", val);
                              }
                            }}
                            className="w-full border border-zinc-200 rounded-xl p-3 text-zinc-900 font-medium focus:outline-none focus:border-red-500 text-sm resize-y min-h-[72px]"
                            placeholder="Enter text..."
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-zinc-800 mb-1.5 block">
                            Font Style
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              "Bold",
                              "Italic",
                              "Script",
                              "Block",
                              "Outline",
                              "Varsity",
                              "Serif Athletic",
                              "Cyberpunk",
                              "Grunge",
                              "Neon Glow",
                              "Gothic",
                            ].map((f) => (
                              <button
                                key={f}
                                onClick={() => {
                                  setTextLayers((prev) =>
                                    prev.map((l) =>
                                      l.id === selectedLayer.id
                                        ? { ...l, font: f }
                                        : l,
                                    ),
                                  );
                                  if (selectedLayer.id === "front-text")
                                    updateState("frontFont", f);
                                  if (selectedLayer.id === "back-text")
                                    updateState("backFont", f);
                                  if (
                                    selectedLayer.id === "front-number" ||
                                    selectedLayer.id === "back-number"
                                  ) {
                                    updateState("numberFont", f);
                                  }
                                }}
                                className={`p-1.5 rounded-full cursor-pointer border text-[10px] font-bold transition-all active:scale-90 duration-300 ${
                                  selectedLayer.font === f
                                    ? "border-red-500 bg-red-50 text-red-700"
                                    : "border-[#002337] text-[#002337] hover:border-zinc-300"
                                }`}
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-zinc-800 mb-1.5 block">
                            Text Color
                          </label>
                          <div className="flex gap-1.5 flex-wrap items-center">
                            {[
                              "#FFFFFF",
                              "#111111",
                              "#E63946",
                              "#2196F3",
                              "#FFD700",
                              "#2A9D8F",
                            ].map((c) => (
                              <button
                                key={c}
                                onClick={() => {
                                  setTextLayers((prev) =>
                                    prev.map((l) =>
                                      l.id === selectedLayer.id
                                        ? { ...l, color: c }
                                        : l,
                                    ),
                                  );
                                  if (selectedLayer.id === "front-text")
                                    updateState("frontTextColor", c);
                                  if (selectedLayer.id === "back-text")
                                    updateState("backTextColor", c);
                                  if (
                                    selectedLayer.id === "front-number" ||
                                    selectedLayer.id === "back-number"
                                  ) {
                                    updateState("numberColor", c);
                                  }
                                }}
                                className={`w-7 h-7 rounded-full border-2 transition-transform ${
                                  selectedLayer.color === c
                                    ? "border-zinc-900 scale-110"
                                    : "border-black/10 hover:scale-105"
                                }`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                            <div className="w-px h-4 bg-zinc-300 mx-1"></div>
                            <input
                              type="color"
                              value={selectedLayer.color}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTextLayers((prev) =>
                                  prev.map((l) =>
                                    l.id === selectedLayer.id
                                      ? { ...l, color: val }
                                      : l,
                                  ),
                                );
                                if (selectedLayer.id === "front-text")
                                  updateState("frontTextColor", val);
                                if (selectedLayer.id === "back-text")
                                  updateState("backTextColor", val);
                                if (
                                  selectedLayer.id === "front-number" ||
                                  selectedLayer.id === "back-number"
                                ) {
                                  updateState("numberColor", val);
                                }
                              }}
                              className="w-7 h-7 p-0 border-0 rounded cursor-pointer overflow-hidden"
                            />
                          </div>
                        </div>

                        {/* Base Font Size */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-800 block">
                            Base Font Size
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="15"
                              max="300"
                              value={selectedLayer.textSize}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setTextLayers((prev) =>
                                  prev.map((l) =>
                                    l.id === selectedLayer.id
                                      ? { ...l, textSize: val }
                                      : l,
                                  ),
                                );
                                if (selectedLayer.id === "front-text")
                                  updateState("frontTextSize", val);
                                if (selectedLayer.id === "back-text")
                                  updateState("backTextSize", val);
                              }}
                              className="flex-1 accent-red-600 h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="min-w-[56px] h-10 px-3 border border-zinc-200 bg-white rounded-lg flex items-center justify-center text-xs font-bold text-zinc-700">
                              {selectedLayer?.textSize}
                            </div>
                          </div>
                        </div>

                        {/* Letter spacing */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-800 block">
                            Letter spacing
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0"
                              max="500"
                              value={selectedLayer.letterSpacing || 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setTextLayers((prev) =>
                                  prev.map((l) =>
                                    l.id === selectedLayer.id
                                      ? { ...l, letterSpacing: val }
                                      : l,
                                  ),
                                );
                              }}
                              className="flex-1 accent-red-600 h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="min-w-[56px] h-10 px-3 border border-zinc-200 bg-white shadow-sm rounded-xl flex items-center justify-center text-xs font-bold text-zinc-700">
                              {selectedLayer.letterSpacing || 0}
                            </div>
                          </div>
                        </div>

                        {/* Line spacing */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-800 block">
                            Line spacing
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0.5"
                              max="3.0"
                              step="0.05"
                              value={selectedLayer.lineSpacing || 1.15}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setTextLayers((prev) =>
                                  prev.map((l) =>
                                    l.id === selectedLayer.id
                                      ? { ...l, lineSpacing: val }
                                      : l,
                                  ),
                                );
                              }}
                              className="flex-1 accent-red-600 h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="min-w-[56px] h-10 px-3 border border-zinc-200 bg-white shadow-sm rounded-xl flex items-center justify-center text-xs font-bold text-zinc-700">
                              {(selectedLayer.lineSpacing || 1.15).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Text Curve */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-800 block">
                            Text Curve
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="-120"
                              max="120"
                              value={selectedLayer.curveRadius || 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setTextLayers((prev) =>
                                  prev.map((l) =>
                                    l.id === selectedLayer.id
                                      ? { ...l, curveRadius: val }
                                      : l,
                                  ),
                                );
                              }}
                              className="flex-1 accent-red-600 h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="min-w-[56px] h-10 px-3 border border-zinc-200 bg-white shadow-sm rounded-xl flex items-center justify-center text-xs font-bold text-zinc-700">
                              {selectedLayer.curveRadius || 0}°
                            </div>
                          </div>
                        </div>

                        {/* Text Outline */}
                        <div className="space-y-3 pt-3 border-t border-zinc-100">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-zinc-800">
                              Enable Text Outline
                            </label>
                            <input
                              type="checkbox"
                              checked={!!selectedLayer.outlineEnabled}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setTextLayers((prev) =>
                                  prev.map((l) =>
                                    l.id === selectedLayer.id
                                      ? {
                                          ...l,
                                          outlineEnabled: checked,
                                          outlineColor:
                                            l.outlineColor || "#FFFFFF",
                                          outlineWidth:
                                            typeof l.outlineWidth === "number"
                                              ? l.outlineWidth
                                              : 4,
                                        }
                                      : l,
                                  ),
                                );
                              }}
                              className="w-4 h-4 text-red-600 border-zinc-300 rounded focus:ring-red-500 cursor-pointer"
                            />
                          </div>

                          {selectedLayer.outlineEnabled && (
                            <div className="space-y-3 pl-2 border-l-2 border-red-100">
                              {/* Outline Color */}
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-zinc-600">
                                  Outline Color
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="color"
                                    value={
                                      selectedLayer.outlineColor || "#FFFFFF"
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setTextLayers((prev) =>
                                        prev.map((l) =>
                                          l.id === selectedLayer.id
                                            ? { ...l, outlineColor: val }
                                            : l,
                                        ),
                                      );
                                    }}
                                    className="w-6 h-6 p-0 border-0 rounded cursor-pointer overflow-hidden"
                                  />
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase">
                                    {selectedLayer.outlineColor || "#FFFFFF"}
                                  </span>
                                </div>
                              </div>

                              {/* Outline Width */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-bold text-zinc-600">
                                  <span>Outline Width</span>
                                  <span>
                                    {selectedLayer.outlineWidth ?? 4}px
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="1"
                                  max="20"
                                  value={selectedLayer.outlineWidth ?? 4}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setTextLayers((prev) =>
                                      prev.map((l) =>
                                        l.id === selectedLayer.id
                                          ? { ...l, outlineWidth: val }
                                          : l,
                                      ),
                                    );
                                  }}
                                  className="w-full accent-red-600 h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Text Shadow */}
                        <div className="space-y-3 pt-3 border-t border-zinc-100">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-zinc-800">
                              Enable Text Shadow
                            </label>
                            <input
                              type="checkbox"
                              checked={!!selectedLayer.shadowEnabled}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setTextLayers((prev) =>
                                  prev.map((l) =>
                                    l.id === selectedLayer.id
                                      ? {
                                          ...l,
                                          shadowEnabled: checked,
                                          shadowColor:
                                            l.shadowColor || "#000000",
                                          shadowBlur:
                                            typeof l.shadowBlur === "number"
                                              ? l.shadowBlur
                                              : 10,
                                          shadowOffsetX:
                                            typeof l.shadowOffsetX === "number"
                                              ? l.shadowOffsetX
                                              : 4,
                                          shadowOffsetY:
                                            typeof l.shadowOffsetY === "number"
                                              ? l.shadowOffsetY
                                              : 4,
                                        }
                                      : l,
                                  ),
                                );
                              }}
                              className="w-4 h-4 text-red-600 border-zinc-300 rounded focus:ring-red-500 cursor-pointer"
                            />
                          </div>

                          {selectedLayer.shadowEnabled && (
                            <div className="space-y-3 pl-2 border-l-2 border-red-100">
                              {/* Shadow Color */}
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-zinc-600">
                                  Shadow Color
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="color"
                                    value={
                                      selectedLayer.shadowColor || "#000000"
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setTextLayers((prev) =>
                                        prev.map((l) =>
                                          l.id === selectedLayer.id
                                            ? { ...l, shadowColor: val }
                                            : l,
                                        ),
                                      );
                                    }}
                                    className="w-6 h-6 p-0 border-0 rounded cursor-pointer overflow-hidden"
                                  />
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase">
                                    {selectedLayer.shadowColor || "#000000"}
                                  </span>
                                </div>
                              </div>

                              {/* Shadow Blur */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-bold text-zinc-600">
                                  <span>Shadow Blur</span>
                                  <span>
                                    {selectedLayer.shadowBlur ?? 10}px
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="30"
                                  value={selectedLayer.shadowBlur ?? 10}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setTextLayers((prev) =>
                                      prev.map((l) =>
                                        l.id === selectedLayer.id
                                          ? { ...l, shadowBlur: val }
                                          : l,
                                      ),
                                    );
                                  }}
                                  className="w-full accent-red-600 h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer"
                                />
                              </div>

                              {/* Offset X */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-bold text-zinc-600">
                                  <span>Offset X</span>
                                  <span>
                                    {selectedLayer.shadowOffsetX ?? 4}px
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="-20"
                                  max="20"
                                  value={selectedLayer.shadowOffsetX ?? 4}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setTextLayers((prev) =>
                                      prev.map((l) =>
                                        l.id === selectedLayer.id
                                          ? { ...l, shadowOffsetX: val }
                                          : l,
                                      ),
                                    );
                                  }}
                                  className="w-full accent-red-600 h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer"
                                />
                              </div>

                              {/* Offset Y */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-bold text-zinc-600">
                                  <span>Offset Y</span>
                                  <span>
                                    {selectedLayer.shadowOffsetY ?? 4}px
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="-20"
                                  max="20"
                                  value={selectedLayer.shadowOffsetY ?? 4}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setTextLayers((prev) =>
                                      prev.map((l) =>
                                        l.id === selectedLayer.id
                                          ? { ...l, shadowOffsetY: val }
                                          : l,
                                      ),
                                    );
                                  }}
                                  className="w-full accent-red-600 h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ── LOGOS TAB ── */}
              {activeTab === "logos" && (
                <div className="space-y-5">
                  <input
                    id="logo-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, uploadSubTab)}
                    className="hidden"
                  />

                  {/* Two-Tab Sub-navigation Layout: Logo & Image */}
                  <div className="flex bg-zinc-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadSubTab("logo");
                        setSelectedLogoId(null); // Deselect on switch
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                        uploadSubTab === "logo"
                          ? "bg-white text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-900"
                      }`}
                    >
                      Logo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadSubTab("image");
                        setSelectedLogoId(null); // Deselect on switch
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                        uploadSubTab === "image"
                          ? "bg-white text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-900"
                      }`}
                    >
                      Image (Wrap/BG)
                    </button>
                  </div>

                  {/* Front/Back View Segmented Switcher */}
                  <div className="flex bg-zinc-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setCurrentView("front")}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                        activeSide === "Front"
                          ? "bg-white text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-900"
                      }`}
                    >
                      Front Side
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentView("back")}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                        activeSide === "Back"
                          ? "bg-white text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-900"
                      }`}
                    >
                      Back Side
                    </button>
                  </div>

                  {/* Visual Logo/Image Editor */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider block">
                      Visual {uploadSubTab === "logo" ? "Logo" : "Image"} Editor
                      ({activeSide} View)
                    </label>

                    {/* Bounding Box Customizer Canvas area (280x280) */}
                    <div
                      className="relative w-[280px] h-[280px] rounded border border-zinc-200 shadow-inner mx-auto select-none"
                      style={{
                        background:
                          "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
                        cursor:
                          isEraserMode && selectedLogoId
                            ? ERASER_CURSOR
                            : "default",
                      }}
                      onMouseDown={(e) => {
                        if (isEraserMode && selectedLogoId) {
                          handleEraserStart(e);
                          return;
                        }
                        if (e.target === e.currentTarget) {
                          setSelectedLogoId(null);
                        }
                      }}
                      onTouchStart={(e) => {
                        if (isEraserMode && selectedLogoId) {
                          handleEraserStart(e);
                        }
                      }}
                    >
                      {/* Silhouette helper */}
                      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                          <svg
                            viewBox="0 0 100 100"
                            className="w-48 h-48 fill-white"
                          >
                            <path d="M 30,15 L 70,15 L 85,25 L 80,45 L 70,40 L 70,85 L 30,85 L 30,40 L 20,45 L 15,25 Z" />
                          </svg>
                        </div>
                        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-size-[20px_20px]" />
                      </div>

                      {/* Active side text label */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-zinc-500 tracking-widest uppercase pointer-events-none">
                        {activeSide} Texture Map (1024x1024)
                      </div>

                      {/* Content Container */}
                      <div className="absolute inset-0 rounded-2xl overflow-hidden">
                        {logoLayers
                          .filter(
                            (layer) =>
                              layer.side === activeSide &&
                              (uploadSubTab === "logo"
                                ? layer.type === "logo" || !layer.type
                                : layer.type === "image"),
                          )
                          .map((layer) => {
                            const isSelected = selectedLogoId === layer.id;
                            return (
                              <div
                                key={layer.id}
                                style={{
                                  position: "absolute",
                                  left: layer.x * editorScale,
                                  top: layer.y * editorScale,
                                  transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                                  cursor: isEraserMode ? ERASER_CURSOR : "move",
                                  zIndex: isSelected ? 40 : 10,
                                }}
                                onMouseDown={(e) => {
                                  if (isEraserMode) {
                                    // Bubble up to visual customizer div
                                    return;
                                  }
                                  handleLogoDragStart(e, layer.id);
                                }}
                              >
                                {renderLogoLayer(layer, false)}
                              </div>
                            );
                          })}
                      </div>

                      {/* Bounding Box & Handles Overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        {!isEraserMode &&
                          logoLayers
                            .filter(
                              (layer) =>
                                layer.side === activeSide &&
                                selectedLogoId === layer.id &&
                                (uploadSubTab === "logo"
                                  ? layer.type === "logo" || !layer.type
                                  : layer.type === "image"),
                            )
                            .map((layer) => {
                              return (
                                <div
                                  key={`handles-logo-${layer.id}`}
                                  style={{
                                    position: "absolute",
                                    left: layer.x * editorScale,
                                    top: layer.y * editorScale,
                                    transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                                    pointerEvents: "none",
                                    zIndex: 50,
                                  }}
                                >
                                  {renderLogoLayer(
                                    layer,
                                    true,
                                    <>
                                      {/* Bounding Box Border */}
                                      <div
                                        className="absolute inset-0 border border-dashed border-red-500"
                                        style={{ visibility: "visible" }}
                                      />

                                      {/* Interactive Handles */}
                                      <div style={{ visibility: "visible" }}>
                                        {/* Top-Left: Duplicate */}
                                        <button
                                          className="absolute -top-3.5 -left-3.5 w-6 h-6 bg-white border border-zinc-200 hover:bg-zinc-50 shadow-md rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform pointer-events-auto"
                                          onMouseDown={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            handleLogoCopy(layer.id);
                                          }}
                                          title="Duplicate"
                                        >
                                          <svg
                                            className="w-3.5 h-3.5 text-zinc-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2.5}
                                              d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                                            />
                                          </svg>
                                        </button>

                                        {/* Top-Right: Rotate */}
                                        <div
                                          className="absolute -top-3.5 -right-3.5 w-6 h-6 bg-white border border-zinc-200 hover:bg-zinc-50 shadow-md rounded-full flex items-center justify-center cursor-alias active:scale-90 transition-transform pointer-events-auto"
                                          onMouseDown={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            handleLogoRotateStart(e, layer.id);
                                          }}
                                          title="Rotate"
                                        >
                                          <svg
                                            className="w-3.5 h-3.5 text-zinc-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2.5}
                                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89"
                                            />
                                          </svg>
                                        </div>

                                        {/* Bottom-Left: Delete */}
                                        <button
                                          className="absolute -bottom-3.5 -left-3.5 w-6 h-6 bg-red-500 hover:bg-red-600 shadow-md rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform pointer-events-auto"
                                          onMouseDown={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            handleLogoDelete(layer.id);
                                          }}
                                          title="Delete"
                                        >
                                          <svg
                                            className="w-3.5 h-3.5 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2.5}
                                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                          </svg>
                                        </button>

                                        {/* Bottom-Right: Scale */}
                                        <div
                                          className="absolute -bottom-3.5 -right-3.5 w-6 h-6 bg-blue-500 hover:bg-blue-600 shadow-md rounded-full flex items-center justify-center cursor-se-resize active:scale-90 transition-transform pointer-events-auto"
                                          onMouseDown={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            handleLogoScaleStart(e, layer.id);
                                          }}
                                          title="Scale"
                                        >
                                          <svg
                                            className="w-3.5 h-3.5 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2.5}
                                              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                                            />
                                          </svg>
                                        </div>
                                      </div>
                                    </>,
                                  )}
                                </div>
                              );
                            })}
                      </div>
                    </div>
                  </div>

                  {/* Background Eraser - Conditional on selected layer matching sub-tab */}
                  {(() => {
                    const selectedLayer = logoLayers.find(
                      (l) => l.id === selectedLogoId,
                    );
                    if (!selectedLayer) return null;
                    const isLogoTab = uploadSubTab === "logo";
                    const layerIsLogo =
                      selectedLayer.type === "logo" || !selectedLayer.type;
                    if (isLogoTab !== layerIsLogo) return null;

                    return (
                      <div className="space-y-2.5 p-3 bg-zinc-50 rounded-xl border border-zinc-200/60 shadow-sm mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                            Background Eraser
                          </span>
                          <button
                            onClick={() => setIsEraserMode((prev) => !prev)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                              isEraserMode
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : "bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300"
                            }`}
                            title={
                              isEraserMode
                                ? "Click to lock artwork"
                                : "Click to erase background"
                            }
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              {isEraserMode ? (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                              ) : (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              )}
                            </svg>
                            <span>
                              {isEraserMode ? "Lock Drawing" : "Erase Pixels"}
                            </span>
                          </button>
                        </div>

                        {isEraserMode && (
                          <div className="space-y-1.5 animate-fadeIn">
                            <div className="flex justify-between text-[11px] font-bold text-zinc-600">
                              <span>Eraser Brush Size</span>
                              <span>{eraserBrushSize}px</span>
                            </div>
                            <input
                              type="range"
                              min="2"
                              max="100"
                              value={eraserBrushSize}
                              onChange={(e) =>
                                setEraserBrushSize(parseInt(e.target.value))
                              }
                              className="w-full accent-red-500 cursor-pointer h-1.5 bg-zinc-200 rounded-lg appearance-none"
                            />
                            <p className="text-[10px] text-zinc-400 italic">
                              Drag mouse/finger over image edges in the Visual
                              Editor to clean up background pixels.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Upload Container */}
                  {uploadSubTab === "logo" ? (
                    <div
                      onClick={() =>
                        document.getElementById("logo-upload-input")?.click()
                      }
                      className="border-2 border-dashed border-zinc-200 rounded-xl p-6 flex flex-col items-center justify-center text-zinc-500 hover:bg-zinc-50 hover:border-red-400 cursor-pointer transition-all"
                    >
                      <ImageIcon className="w-6 h-6 mb-1.5" />
                      <span className="text-xs font-bold">
                        Upload Custom Logo
                      </span>
                      <span className="text-[10px] mt-0.5">
                        PNG, SVG up to 5MB
                      </span>
                    </div>
                  ) : (
                    <div
                      onClick={() =>
                        document.getElementById("logo-upload-input")?.click()
                      }
                      className="border-2 border-dashed border-zinc-200 rounded-xl p-6 flex flex-col items-center justify-center text-zinc-500 hover:bg-zinc-50 hover:border-red-400 cursor-pointer transition-all"
                    >
                      <ImageIcon className="w-6 h-6 mb-1.5" />
                      <span className="text-xs font-bold">
                        Upload Background / Wrap Image
                      </span>
                      <span className="text-[10px] mt-0.5">
                        PNG, SVG up to 5MB
                      </span>
                    </div>
                  )}

                  {/* Presets Grid */}
                  {uploadSubTab === "logo" && (
                    <div>
                      <label className="text-xs font-bold text-zinc-900 mb-2 block">
                        Preset Badges
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            name: "Valkyrie",
                            url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBvbHlnb24gcG9pbnRzPSI1MCwxMCA5MCwzMCA5MCw3MCA1MCw5NSAxMCw3MCAxMCwzMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmYzMzY2IiBzdHJva2Utd2lkdGg9IjYiLz48cGF0aCBkPSJNNTAsMjAgTDc1LDQ1IEw2MCw0NSBMNTAsMzAgTDQwLDQ1IEwyNSw0NSBaIiBmaWxsPSIjZmYzMzY2Ii8+PGNpcmNsZSBjeD0iNTAiIGN5PSI2NSIgcj0iMTIiIGZpbGw9IiNmZjMzNjYiLz4vPjwvc3ZnPg==",
                          },
                          {
                            name: "Gold Tiger",
                            url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIwLDIwIFE1MCwwIDgwLDIwIEw4MCw1MCBMNTAsOTAgTDIwLDUwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmY2MwMCIgc3Ryb2tlLXdpZHRoPSI2Ii8+PHBhdGggZD0iTTM1LDM1IFE1MCwyMCA2NSwzNSBNMzAsNTAgUTUwLDQwIDcwLDUwIE00NSw2NSBMNTAsNzUgTDU1LDY1IiBzdHJva2U9IiNmZmNjMDAiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==",
                          },
                          {
                            name: "Blue Shield",
                            url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTUwLDEwIEw4NSwyMCBMODUsNjAgQzg1LDgwIDUwLDk1IDUwLDk1IEM1MCw5NSAxNSw4MCAxNSw2MCBMMTUsMjAgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjM2Y1MWI1IiBzdHJva2Utd2lkdGg9IjYiLz4gPGNpcmNsZSBjeD0iNTAiIGN5PSI0NSIgcj0iMTUiIGZpbGw9IiMzZjUxYjUiLz48cGF0aCBkPSJNNDAsNjUgTDUwLDU1IEw2MCw2NSIgc3Ryb2tlPSIjM2Y1MWI1IiBzdHJva2Utd2lkdGg9IjUiIGZpbGw9Im5vbmUiLz48L3N2Zz4=",
                          },
                          {
                            name: "Red Phoenix",
                            url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBvbHlnb24gcG9pbnRzPSI1MCw1IDk1LDI4IDk1LDcyIDUwLDk1IDUsNzIgNSwyOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTUzZTNlIiBzdHJva2Utd2lkdGg9IjYiLz48cGF0aCBkPSJNNTAsMjUgQzY1LDI1IDc1LDM1IDcwLDU1IEM2NSw0NSA1NSw0NSA1MCw1MCBDNDUsNDUgMzUsNDUgMzAsNTUgQzI1LDM1IDM1LDI1IDUwLDI1IFoiIGZpbGw9IiNlNTNlM2UiLz48cG9seWdvbiBwb2ludHM9IjUwLDU1IDYwLDcwIDUwLDY1IDQwLDcwIiBmaWxsPSIjZTUzZTNlIi8+PC9zdmc+",
                          },
                          {
                            name: "Neon Light",
                            url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzM5ZmYxNCIgc3Ryb2tlLXdpZHRoPSI2Ii8+PHBvbHlnb24gcG9pbnRzPSI1NSwxOCAyOCw1MiA0OCw1MiA0Miw4MiA3Miw0OCA1Miw0OCIgZmlsbD0iIzM5ZmYxNCIvPjwvc3ZnPg==",
                          },
                          {
                            name: "Iron Crown",
                            url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTUwLDkwIEw5MCw2NSBMOTAsMjAgTDUwLDEwIEwxMCwyMCBMMTAsNjUgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjYTg1NWY3IiBzdHJva2Utd2lkdGg9IjYiLz48cGF0aCBkPSJNMjUsNjUgTDMyLDQwIEw4NSw1NSBMNTAsMzAgTDU1LDU1IEw2OCw0MCBMNzUsNjUgWiIgZmlsbD0iI2E4NTVmNyIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iODAiIHI9IjYiIGZpbGw9IiNhODU1ZjciLz48L3N2Zz4=",
                          },
                          {
                            name: "Green Cobra",
                            url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBvbHlnb24gcG9pbnRzPSI1MCwxMCA4NSwzMCA3NSw4MCA1MCw5NSAyNSw4MCAxNSwzMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTBiOTgxIiBzdHJva2Utd2lkdGg9IjYiLz48cGF0aCBkPSJNNTAsMjIgQzQwLDIyIDMyLDMwIDMyLDQwIEMzMiw1NSA1MCw3NSA1MCw3NSBDNTAsNzUgNjgsNTUgNjgsNDAgQzY4LDMwIDYwLDIyIDUwLDIyIFogTTUwLDMyIEM1MywzMiA1NSwzNCA1NSwzNyBDNTUsNDAgNTAsNDUgNTAsNDUgQzUwLDk1IDQ1LDQwIDQ1LDM3IEM0NSwzNCA0NywzMiA1MCwzMiBaIiBmaWxsPSIjMTBiOTgxIi8+PC9zdmc+",
                          },
                          {
                            name: "Cyber Star",
                            url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Y0M2Y1ZSIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtZGFzaGFycmF5PSI4IDYiLz48cG9seWdvbiBwb2ludHM9IjUwLDE1IDYxLDM4IDg2LDQwIDY3LDU3IDczLDgyIDUwLDY4IDI3LDgyIDMzLDU3IDI0LDQwIDM5LDM4IiBmaWxsPSIjZjQzZjVlIi8+PC9zdmc+",
                          },
                          {
                            name: "Ocean Anchor",
                            url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBlYTVlOSIgc3Ryb2tlLXdpZHRoPSI2Ii8+PHBhdGggZD0iTTUwLDE4IEw1MCw2OCBNMzIsNDggTDY4LDQ4IE01MCwxOCBBNiw2IDAgMSwxIDUwLDMwIEE2LDYgMCAxLDEgNTAsMTggTTMwLDU1IEEyMCwyMCAwIDAsMCA3MCw1NSBNMzgwLDUyIEwyNiw1NyBNNzAsNTIgTDc0LDU3IiBmaWxsPSJub25lIiBzdHJva2U9IiMwZWE1ZTkiIHN0cm9rZS13aWR0aD0iNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+",
                          },
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() =>
                              handleAddLogoLayer(preset.url, "logo")
                            }
                            className="p-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
                          >
                            <div className="w-6 h-6 flex items-center justify-center">
                              <img
                                src={preset.url}
                                alt={preset.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <span className="text-[8px] font-bold text-zinc-500">
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* My Uploads Gallery */}
                  {uploadSubTab === "logo" && uploadedLogos.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-100">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-zinc-900">
                          My Uploaded Badges
                        </label>
                        <button
                          onClick={() => {
                            setUploadedLogos([]);
                            localStorage.removeItem("jersey_uploaded_logos");
                          }}
                          className="text-[9px] text-zinc-400 hover:text-red-500 font-bold transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {uploadedLogos.map((url, index) => {
                          return (
                            <div
                              key={index}
                              onClick={() => handleAddLogoLayer(url, "logo")}
                              className="relative aspect-square rounded-xl border flex items-center justify-center p-1.5 transition-all bg-white cursor-pointer border-zinc-200 hover:border-zinc-300 hover:shadow-md group"
                            >
                              <img
                                src={url}
                                alt={`Uploaded badge ${index + 1}`}
                                className="w-full h-full object-contain"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUploadedLogos((prev) => {
                                    const next = prev.filter(
                                      (item) => item !== url,
                                    );
                                    localStorage.setItem(
                                      "jersey_uploaded_logos",
                                      JSON.stringify(next),
                                    );
                                    return next;
                                  });
                                }}
                                className="absolute top-1 right-1 w-4 h-4 bg-white hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-full border border-zinc-200 shadow-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                              >
                                <svg
                                  className="w-2.5 h-2.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* My Uploaded Images Gallery */}
                  {uploadSubTab === "image" && uploadedImages.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-100">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-zinc-900">
                          My Uploaded Images
                        </label>
                        <button
                          onClick={() => {
                            setUploadedImages([]);
                            localStorage.removeItem("jersey_uploaded_images");
                          }}
                          className="text-[9px] text-zinc-400 hover:text-red-500 font-bold transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {uploadedImages.map((url, index) => {
                          return (
                            <div
                              key={index}
                              onClick={() => handleAddLogoLayer(url, "image")}
                              className="relative aspect-square rounded-xl border flex items-center justify-center p-1.5 transition-all bg-white cursor-pointer border-zinc-200 hover:border-zinc-300 hover:shadow-md group"
                            >
                              <img
                                src={url}
                                alt={`Uploaded image ${index + 1}`}
                                className="w-full h-full object-contain"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUploadedImages((prev) => {
                                    const next = prev.filter(
                                      (item) => item !== url,
                                    );
                                    localStorage.setItem(
                                      "jersey_uploaded_images",
                                      JSON.stringify(next),
                                    );
                                    return next;
                                  });
                                }}
                                className="absolute top-1 right-1 w-4 h-4 bg-white hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-full border border-zinc-200 shadow-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                              >
                                <svg
                                  className="w-2.5 h-2.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Unified Active Layers List */}
                  {(() => {
                    const sideTextLayers = textLayers.filter(
                      (l) => l.side === activeSide,
                    );
                    const sideLogoLayers = logoLayers.filter(
                      (l) => l.side === activeSide,
                    );
                    const activeSideLayers = [
                      ...sideTextLayers.map((l) => ({
                        ...l,
                        layerType: "text",
                      })),
                      ...sideLogoLayers.map((l) => ({
                        ...l,
                        layerType: "logo",
                      })),
                    ];

                    const sortedActiveSideLayers = [...activeSideLayers].sort(
                      (a, b) => {
                        const idxA = layersOrder.indexOf(a.id);
                        const idxB = layersOrder.indexOf(b.id);
                        const getPriority = (l: any) => {
                          if (l.layerType === "text") return 1;
                          if (l.type === "image") {
                            return l.zOrder === "above-text" ? 2 : 0;
                          }
                          return 3;
                        };
                        const valA = idxA !== -1 ? idxA : getPriority(a) * 1000;
                        const valB = idxB !== -1 ? idxB : getPriority(b) * 1000;
                        // DESCENDING order for UI list (highest draw index = top of list)
                        return valB - valA;
                      },
                    );

                    return (
                      <div className="space-y-2 mt-2 pt-2 border-t border-zinc-100">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                          Layers List ({activeSide} Side)
                        </label>
                        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                          {sortedActiveSideLayers.length === 0 ? (
                            <div className="text-xs text-zinc-400 italic text-center py-3 bg-zinc-50 rounded-xl border border-zinc-100">
                              No layers on this side. Add one above or from the
                              Text tab!
                            </div>
                          ) : (
                            sortedActiveSideLayers.map((layer, index) => {
                              const isText = layer.layerType === "text";
                              const isSelected = isText
                                ? selectedLayerId === layer.id
                                : selectedLogoId === layer.id;
                              const displayName = isText
                                ? `Text ("${(layer as any).text}")`
                                : (layer as any).type === "image"
                                  ? `Image (${layer.id.split("-").pop()})`
                                  : `Logo (${layer.id.split("-").pop()})`;

                              return (
                                <div
                                  key={layer.id}
                                  draggable
                                  onDragStart={(e) => {
                                    setDraggedIdx(index);
                                    e.dataTransfer.effectAllowed = "move";
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    if (draggedIdx !== index) {
                                      setDragOverIdx(index);
                                    }
                                  }}
                                  onDragEnd={() => {
                                    if (
                                      draggedIdx !== null &&
                                      dragOverIdx !== null &&
                                      draggedIdx !== dragOverIdx
                                    ) {
                                      reorderLayers(draggedIdx, dragOverIdx);
                                    }
                                    setDraggedIdx(null);
                                    setDragOverIdx(null);
                                  }}
                                  onClick={() => {
                                    if (isText) {
                                      setSelectedLayerId(layer.id);
                                      setSelectedLogoId(null);
                                    } else {
                                      setSelectedLogoId(layer.id);
                                      setSelectedLayerId(null);
                                    }
                                  }}
                                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                    isSelected
                                      ? "border-red-500 bg-red-50/30 font-semibold"
                                      : dragOverIdx === index
                                        ? "border-dashed border-red-400 bg-zinc-50 scale-[0.98]"
                                        : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
                                  } ${draggedIdx === index ? "opacity-45" : ""}`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {/* Drag Handle */}
                                    <div className="text-zinc-400 hover:text-zinc-600 cursor-grab active:cursor-grabbing p-0.5">
                                      <GripVertical className="w-3.5 h-3.5" />
                                    </div>

                                    {/* Thumbnail Preview */}
                                    <div className="w-8 h-8 rounded bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center p-0.5 shrink-0 shadow-sm">
                                      {isText ? (
                                        <span className="text-xs font-bold text-zinc-500">
                                          T
                                        </span>
                                      ) : (
                                        <img
                                          src={(layer as any).src}
                                          alt="Layer badge"
                                          className="w-full h-full object-contain"
                                        />
                                      )}
                                    </div>

                                    {/* Name */}
                                    <div className="text-xs text-zinc-700 truncate max-w-[130px]">
                                      {displayName}
                                    </div>
                                  </div>

                                  {/* Controls */}
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isText) {
                                          handleCopy(layer.id);
                                        } else {
                                          handleLogoCopy(layer.id);
                                        }
                                      }}
                                      title="Duplicate Layer"
                                      className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded transition-colors"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isText) {
                                          handleDelete(layer.id);
                                        } else {
                                          handleLogoDelete(layer.id);
                                        }
                                      }}
                                      title="Delete Layer"
                                      className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Selected Logo Properties */}
                  {(() => {
                    const selectedLayer = logoLayers.find(
                      (l) => l.id === selectedLogoId,
                    );
                    if (!selectedLayer) return null;
                    const isLogoTab = uploadSubTab === "logo";
                    const layerIsLogo =
                      selectedLayer.type === "logo" || !selectedLayer.type;
                    if (isLogoTab !== layerIsLogo) return null;

                    return (
                      <div className="space-y-4 pt-2 border-t border-zinc-100">
                        <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                          Selected {isLogoTab ? "Logo" : "Image"} Settings
                        </h4>

                        {/* Layer Position control for Image tab */}
                        {!isLogoTab && (
                          <div className="space-y-1.5 p-3 bg-zinc-50 rounded-xl border border-zinc-200/60 shadow-sm">
                            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider block">
                              Layer Position (Z-Index)
                            </span>
                            <div className="flex bg-zinc-200/60 p-1 rounded-lg">
                              <button
                                type="button"
                                onClick={() => {
                                  setLogoLayers((prev) =>
                                    prev.map((l) =>
                                      l.id === selectedLayer.id
                                        ? { ...l, zOrder: "bottom" }
                                        : l,
                                    ),
                                  );
                                }}
                                className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all text-center cursor-pointer ${
                                  selectedLayer.zOrder !== "above-text"
                                    ? "bg-white text-zinc-900 shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-900"
                                }`}
                              >
                                Send to Back
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setLogoLayers((prev) =>
                                    prev.map((l) =>
                                      l.id === selectedLayer.id
                                        ? { ...l, zOrder: "above-text" }
                                        : l,
                                    ),
                                  );
                                }}
                                className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all text-center cursor-pointer ${
                                  selectedLayer.zOrder === "above-text"
                                    ? "bg-white text-zinc-900 shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-900"
                                }`}
                              >
                                Bring to Front
                              </button>
                            </div>
                            <p className="text-[10px] text-zinc-400 italic">
                              {selectedLayer.zOrder === "above-text"
                                ? "Renders on top of jersey text/numbers, but underneath custom logos."
                                : "Renders behind jersey text/numbers and custom logos."}
                            </p>
                          </div>
                        )}

                        {/* Size slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-zinc-800">
                            <span>
                              {isLogoTab ? "Logo" : "Image"} Size / Scale
                            </span>
                            <span className="text-zinc-500">
                              {selectedLayer.scale.toFixed(2)}x
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.01"
                            max="20.0"
                            step="0.05"
                            value={selectedLayer.scale}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setLogoLayers((prev) =>
                                prev.map((l) =>
                                  l.id === selectedLayer.id
                                    ? { ...l, scale: val }
                                    : l,
                                ),
                              );
                            }}
                            className="w-full accent-red-600 cursor-pointer"
                          />
                        </div>

                        {/* Rotation slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-zinc-800">
                            <span>{isLogoTab ? "Logo" : "Image"} Rotation</span>
                            <span className="text-zinc-500">
                              {Math.round(selectedLayer.rotation)}°
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={Math.round(selectedLayer.rotation)}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setLogoLayers((prev) =>
                                prev.map((l) =>
                                  l.id === selectedLayer.id
                                    ? { ...l, rotation: val }
                                    : l,
                                ),
                              );
                            }}
                            className="w-full accent-red-600 cursor-pointer"
                          />
                        </div>

                        {/* Opacity slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-zinc-800">
                            <span>{isLogoTab ? "Logo" : "Image"} Opacity</span>
                            <span className="text-zinc-500">
                              {Math.round(
                                (typeof selectedLayer.opacity === "number"
                                  ? selectedLayer.opacity
                                  : 1.0) * 100,
                              )}
                              %
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={Math.round(
                              (typeof selectedLayer.opacity === "number"
                                ? selectedLayer.opacity
                                : 1.0) * 100,
                            )}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) / 100;
                              setLogoLayers((prev) =>
                                prev.map((l) =>
                                  l.id === selectedLayer.id
                                    ? { ...l, opacity: val }
                                    : l,
                                ),
                              );
                            }}
                            className="w-full accent-red-600 cursor-pointer"
                          />
                        </div>

                        {/* Presets Placement */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-800 block">
                            Quick Position Placement
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { name: "Left Chest", x: 310, y: 290 },
                              { name: "Center", x: 512, y: 500 },
                              { name: "Right Chest", x: 714, y: 290 },
                              { name: "Back Top", x: 512, y: 200 },
                              { name: "Back Center", x: 512, y: 500 },
                              { name: "Sleeve", x: 150, y: 350 },
                            ].map((p) => (
                              <button
                                key={p.name}
                                onClick={() => {
                                  const isBack = p.name.startsWith("Back");
                                  const targetSide = isBack ? "Back" : "Front";
                                  setLogoLayers((prev) =>
                                    prev.map((l) =>
                                      l.id === selectedLayer.id
                                        ? {
                                            ...l,
                                            x: p.x,
                                            y: p.y,
                                            side: targetSide,
                                          }
                                        : l,
                                    ),
                                  );
                                  setCurrentView(isBack ? "back" : "front");
                                }}
                                className="p-1.5 rounded border text-[9px] font-medium transition-all duration-300 active:scale-90 leading-tight text-center border-[#002337] text-[#002337] hover:border-zinc-300 cursor-pointer"
                              >
                                {p.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ── STYLE TAB ── */}
              {activeTab === "style" && (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-zinc-900 mb-2 block">
                      Sleeves
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Short", "Long", "Sleeveless", "3/4"].map((s) => (
                        <button
                          key={s}
                          onClick={() => updateState("sleeve", s)}
                          className={`p-3 rounded-full cursor-pointer border text-sm font-bold transition-all active:scale-90 duration-300 ${state.sleeve === s ? "border-red-500 bg-red-50 text-red-700" : "border-[#002337] text-[#002337] hover:border-zinc-300"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-zinc-900 mb-2 block">
                      Collar Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {["None", "V-Neck", "Round", "Polo", "Henley"].map(
                        (c) => (
                          <button
                            key={c}
                            onClick={() => {
                              updateState("collarType", c);
                              updateState("collar", c !== "None");
                            }}
                            className={`p-3 rounded-full cursor-pointer border text-sm font-bold transition-all active:scale-90 duration-300 ${state.collarType === c ? "border-red-500 bg-red-50 text-red-700" : "border-[#002337] text-[#002337] hover:border-zinc-300"}`}
                          >
                            {c}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                  {state.collar &&
                    (state.collarType === "Polo" ||
                      state.collarType === "Henley") && (
                      <div>
                        <label className="text-sm font-bold text-zinc-900 mb-2 block">
                          Closure Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => updateState("zipper", false)}
                            className={`p-3 rounded-full cursor-pointer border text-sm font-bold transition-all active:scale-90 duration-300 ${
                              !state.zipper
                                ? "border-red-500 bg-red-50 text-red-700 font-extrabold"
                                : "border-[#002337] text-[#002337] hover:border-zinc-300"
                            }`}
                          >
                            Button Placket
                          </button>
                          <button
                            onClick={() => updateState("zipper", true)}
                            className={`p-3 rounded-full cursor-pointer border text-sm font-bold transition-all active:scale-90 duration-300 ${
                              state.zipper
                                ? "border-red-500 bg-red-50 text-red-700 font-extrabold"
                                : "border-[#002337] text-[#002337] hover:border-zinc-300"
                            }`}
                          >
                            Zipper (+$5)
                          </button>
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* ── FABRIC TAB ── */}
              {activeTab === "fabric" && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {[
                      {
                        name: "Mesh",
                        desc: "Standard high-breathability sports mesh fabric",
                        extra: "",
                      },
                      {
                        name: "Flex",
                        desc: "Premium stretch fabric with extra flexibility",
                        extra: "",
                      },
                    ].map((f) => (
                      <button
                        key={f.name}
                        onClick={() => updateState("fabric", f.name)}
                        className={`w-full text-left p-4 rounded-xl border flex justify-between items-center transition-all ${
                          state.fabric === f.name
                            ? "border-red-500 bg-red-50"
                            : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <div>
                          <div
                            className={`font-bold text-sm ${
                              state.fabric === f.name
                                ? "text-red-700"
                                : "text-zinc-800"
                            }`}
                          >
                            {f.name}
                          </div>
                          <div className="text-xs text-zinc-500 mt-0.5">
                            {f.desc}
                          </div>
                        </div>
                        {f.extra && (
                          <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                            {f.extra}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Fabric Technology Visualizer Card */}
                  <div className="mt-4 border-t pt-4">
                    <div className="text-xs font-medium mb-4 text-zinc-500 uppercase tracking-wider">
                      Fabric Technology Visualizer
                    </div>
                    <div className="overflow-hidden border border-zinc-200 shadow-sm bg-white">
                      <img
                        src="/assets/mesh_flex_showcase.png"
                        alt="Mesh vs Flex Antigravity Showcases"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── 3D Canvas ── */}
      <div
        className="flex-1 relative flex flex-col"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, ${state.primary}18 0%, #f0f0f0 65%)`,
        }}
      >
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-end gap-3 z-10 pointer-events-none">
          <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm font-bold text-sm pointer-events-auto hover:bg-zinc-50 transition-all">
            <Save className="w-4 h-4" /> Save
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm font-bold text-sm pointer-events-auto hover:bg-zinc-50 transition-all">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm font-bold text-sm pointer-events-auto hover:bg-zinc-50 transition-all"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>

        {/* Design name badge */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-white/80 backdrop-blur-sm text-xs font-bold text-zinc-700 px-3 py-1.5 rounded-full shadow border border-zinc-200 capitalize">
            {JERSEY_DESIGNS.find((d) => d.id === selectedDesign)?.label ??
              "Custom"}{" "}
            Design
            {state.collar ? ` • ${state.collarType} Collar` : ""}
            {state.collar &&
            (state.collarType === "Polo" || state.collarType === "Henley")
              ? ` (${state.zipper ? "Zipper" : "Buttons"})`
              : ""}
          </span>
        </div>

        <Canvas
          camera={{ position: [0, 0.1, 4], fov: 38 }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.9,
            preserveDrawingBuffer: true,
          }}
        >
          <ThreeGrabber threeRef={threeRef} />
          {/* Transparent background so parent div gradient shows through */}
          <color attach="background" args={["transparent" as any]} />
          <ambientLight intensity={1.2} />
          <Environment preset="city" />
          {/* Front key — balanced to prevent colour wash-out */}
          <directionalLight position={[1, 4, 5]} intensity={1.0} castShadow />
          {/* Back fill — matched to front intensity */}
          <directionalLight position={[-1, 3, -5]} intensity={1.0} />
          {/* Side accent lights — equal on both sides */}
          <pointLight position={[-3, 1, 2]} intensity={0.5} />
          <pointLight position={[3, 1, -2]} intensity={0.5} />
          <Center>
            <Jersey3D
              texturesRef={texturesRef}
              colors={{
                ...state,
                designPattern: currentPattern,
                loadedPatterns,
                textLayers,
                logoLayers,
                loadedLogoImages,
                layersOrder,
              }}
              collar={state.collar}
            />
          </Center>
          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.3}
            scale={8}
            blur={3}
          />
          <ViewHandler currentView={currentView} />
        </Canvas>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-lg border border-black/5">
          <button
            onClick={() => setCurrentView("front")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${currentView === "front" ? "bg-zinc-900 text-white" : "hover:bg-zinc-100 text-zinc-600"}`}
          >
            Front
          </button>
          <button
            onClick={() => setCurrentView("back")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${currentView === "back" ? "bg-zinc-900 text-white" : "hover:bg-zinc-100 text-zinc-600"}`}
          >
            Back
          </button>
          <button
            onClick={() => setCurrentView("sleeves")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${currentView === "sleeves" ? "bg-zinc-900 text-white" : "hover:bg-zinc-100 text-zinc-600"}`}
          >
            Sleeves
          </button>
          <button
            onClick={() => setCurrentView("360")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${currentView === "360" ? "bg-zinc-900 text-white" : "hover:bg-zinc-100 text-zinc-600"}`}
          >
            360° View
          </button>
        </div>
      </div>

      {/* ── Right Pricing Panel ── */}
      <div className="w-full md:w-72 bg-white border-l border-zinc-200 flex flex-col h-full shadow-2xl z-20">
        <div className="p-5 border-b border-zinc-200 flex-1 overflow-y-auto">
          <h2 className="text-lg font-bold text-zinc-900 mb-5">
            Order Summary
          </h2>

          {/* Live preview thumbnail */}
          <div className="w-24 h-24 mx-auto mb-4">
            <JerseySVG
              primary={state.primary}
              secondary={state.designColor || state.secondary}
              pattern={currentPattern}
              selected={false}
            />
          </div>
          <p className="text-center text-xs font-bold text-zinc-500 mb-5 capitalize">
            {JERSEY_DESIGNS.find((d) => d.id === selectedDesign)?.label} ·{" "}
            {state.sleeve} Sleeve
          </p>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Base Jersey</span>
              <span className="font-bold text-zinc-900">
                ${qty >= 10 ? (qty >= 50 ? "29" : "39") : "49"}
              </span>
            </div>
            {state.fabric === "Premium" && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Premium Fabric</span>
                <span className="font-bold text-zinc-900">+$10</span>
              </div>
            )}
            {state.collar && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Collar</span>
                <span className="font-bold text-zinc-900">Included</span>
              </div>
            )}
            {state.collar &&
              (state.collarType === "Polo" ||
                state.collarType === "Henley") && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Closure</span>
                  <span className="font-bold text-zinc-900">
                    {state.zipper ? "Zipper (+$5)" : "Button Placket"}
                  </span>
                </div>
              )}

            <div className="border-t border-zinc-100 pt-4">
              <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-wider">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) =>
                  setQty(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-full border border-zinc-200 rounded-xl p-2.5 text-center font-bold focus:outline-red-500 text-lg"
              />
              <div className="text-[11px] text-green-600 mt-2 font-semibold text-center">
                {qty >= 50
                  ? "🎉 50+ Bulk discount applied!"
                  : qty >= 10
                    ? `Team discount! Add ${50 - qty} more for bulk rate.`
                    : `Add ${10 - qty} more for team discount.`}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-zinc-50 border-t border-zinc-200">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-zinc-600">Total</span>
            <span className="text-3xl font-extrabold text-zinc-900">
              $
              {calculatePrice() +
                (state.collar &&
                (state.collarType === "Polo" ||
                  state.collarType === "Henley") &&
                state.zipper
                  ? 5 * qty
                  : 0)}
            </span>
          </div>
          <button className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] text-sm">
            <ShoppingCart className="w-5 h-5" /> Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
