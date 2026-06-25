"use client";
import React, { useState } from "react";

// Parse a CSS string ("a:b;c:d") into a React style object, preserving --custom-props.
export function css(str?: string): React.CSSProperties {
  if (!str) return {};
  const o: any = {};
  str.split(";").forEach((decl) => {
    const i = decl.indexOf(":");
    if (i < 0) return;
    const k = decl.slice(0, i).trim();
    const v = decl.slice(i + 1).trim();
    if (!k) return;
    const key = k.startsWith("--") ? k : k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    o[key] = v;
  });
  return o;
}

type BoxProps = {
  as?: any;
  s?: string;          // base style (CSS string)
  hover?: string;      // hover style (CSS string), merged while hovered
  children?: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "style">;

// A styled element that accepts the design's raw CSS strings and supports a hover style.
export function Box({ as: Tag = "div", s, hover, children, ...rest }: BoxProps) {
  const [h, setH] = useState(false);
  const style = { ...css(s), ...(h && hover ? css(hover) : {}) };
  const hoverHandlers = hover
    ? { onMouseEnter: () => setH(true), onMouseLeave: () => setH(false) }
    : {};
  return (
    <Tag style={style} {...hoverHandlers} {...rest}>
      {children}
    </Tag>
  );
}

// Inline SVG icon from a path string.
export function Icon({ d, size = 20, fill = "currentColor", stroke, sw }: { d: string; size?: number; fill?: string; stroke?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
