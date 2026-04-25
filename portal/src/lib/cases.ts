import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CASES_PATH = path.join(process.cwd(), '..', 'cases');

export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  tier: 1 | 2;
  coreChallenge: string;
  status: string;
  content: string;
}

export function getAllCases(): CaseStudy[] {
  const cases: CaseStudy[] = [];
  const tiers = ['tier-1-core', 'tier-2-enterprise'];

  tiers.forEach((tierDir, index) => {
    const tierPath = path.join(CASES_PATH, tierDir);
    if (!fs.existsSync(tierPath)) return;

    const caseDirs = fs.readdirSync(tierPath).filter(f => 
      fs.statSync(path.join(tierPath, f)).isDirectory()
    );

    caseDirs.forEach(caseDir => {
      const caseFilePath = path.join(tierPath, caseDir, 'case.md');
      if (fs.existsSync(caseFilePath)) {
        const source = fs.readFileSync(caseFilePath, 'utf8');
        const { data, content } = matter(source);
        
        const lines = source.split('\n');
        const titleLine = lines.find(l => l.startsWith('# '));
        const rawTitle = titleLine ? titleLine.replace('# ', '').trim() : caseDir.replace(/^\d+-/, '').replace(/-/g, ' ');

        // Clean title if it contains "Case Study XX: "
        const cleanTitle = rawTitle.replace(/^Case Study \d+: /i, '').trim();
        
        // Extracting ID from dir name (e.g., "01-food-delivery-split")
        const id = caseDir.split('-')[0];
        
        // Emoji Purge Regex
        const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}]/gu;
        const sanitizedContent = content.replace(emojiRegex, '');
        const sanitizedTitle = (data.title || cleanTitle).replace(emojiRegex, '').trim();

        cases.push({
          id,
          slug: caseDir,
          title: sanitizedTitle,
          tier: (index + 1) as 1 | 2,
          coreChallenge: (data.coreChallenge || '').replace(emojiRegex, ''),
          status: data.status || 'Solved',
          content: sanitizedContent
        });
      }
    });
  });

  return cases.sort((a, b) => parseInt(a.id) - parseInt(b.id));
}

export function getCaseBySlug(slug: string): CaseStudy | null {
  const allCases = getAllCases();
  return allCases.find(c => c.slug === slug) || null;
}
