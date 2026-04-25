import { getCaseBySlug, getAllCases } from '@/lib/cases';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CaseClient from '@/components/CaseClient';
import M3EContent from '@/components/M3EContent';

export const viewport = {
  themeColor: '#05070A',
  width: 'device-width',
  initialScale: 1,
};

export async function generateStaticParams() {
  const cases = getAllCases();
  return cases.map((cs) => ({
    slug: cs.slug,
  }));
}

export default async function CasePage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const cs = getCaseBySlug(slug);

  if (!cs) {
    notFound();
  }

  // Hide the title in the markdown content since we render it in the header
  const contentWithoutTitle = cs.content.replace(/^# .*\n?/, '');

  return (
    <div className="min-h-screen pt-32 pb-40 relative">
      <div className="max-w-7xl mx-auto px-6">
        <header className="mb-32 space-y-12">
          <Link 
            href="/cases" 
            className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-purple-400 transition-all group"
          >
            <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-purple-500/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Documentation Archive
          </Link>
          
          <h1 className="text-7xl md:text-9xl font-display font-black leading-[0.9] tracking-[-0.05em] text-white max-w-6xl">
            {cs.title}
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          {/* Main Content Area */}
          <article className="lg:col-span-8">
            <M3EContent content={contentWithoutTitle} />
          </article>

          {/* Interaction Sidebar */}
          <aside className="lg:col-span-4">
            <CaseClient caseId={cs.id} />
          </aside>
        </div>
      </div>
    </div>
  );
}
