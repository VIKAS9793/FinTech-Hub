"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Image from 'next/image';

interface M3EContentProps {
  content: string;
}

export default function M3EContent({ content }: M3EContentProps) {
  return (
    <div className="space-y-16">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]} 
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter text-white mb-12">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-100 mt-24 mb-8 pb-4 border-b border-white/5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-display font-bold text-primary uppercase tracking-widest mt-12 mb-6">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-xl text-slate-400 leading-[1.8] font-light mb-8 max-w-4xl">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="space-y-6 mb-12 ml-4 border-l border-white/10 pl-8">
              {children}
            </ul>
          ),
          li: ({ children }) => (
            <li className="text-lg text-slate-400 font-light list-none relative">
              <span className="absolute -left-8 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/40" />
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <div className="my-12 p-8 md:p-12 rounded-[2.5rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary/40" />
              <div className="relative text-xl text-slate-300 italic font-light leading-relaxed">
                {children}
              </div>
            </div>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-white tracking-tight px-1 rounded bg-white/5">
              {children}
            </strong>
          ),
          img: ({ src, alt }) => {
            // Normalize GitHub-style relative paths to portal public paths
            const isStringSrc = typeof src === 'string';
            const normalizedSrc = (isStringSrc && src.includes('docs/assets')) 
              ? `/docs/assets/${src.split('docs/assets/')[1]}` 
              : (src as string);
              
            return (
              <div className="my-16 flex flex-col items-center group">
                <div className="relative rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl transition-all group-hover:border-primary/20 group-hover:scale-[1.01]">
                  <Image 
                    src={normalizedSrc} 
                    alt={alt || "Architectural Diagram"} 
                    width={1200}
                    height={800}
                    unoptimized
                    className="max-w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
                {alt && (
                  <span className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 group-hover:text-primary transition-colors">
                    {alt}
                  </span>
                )}
              </div>
            );
          },
          hr: () => <hr className="border-white/5 my-24" />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
