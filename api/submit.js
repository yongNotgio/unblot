// Server-rendered /submit-poetry page.
// Primary landing page targeting queries like "websites for poetry submission",
// "where to submit poetry online", and "free poetry submissions".
// Backed by HowTo and FAQPage structured data for rich SERP snippets and AI search assistants.

import { SITE_NAME, SITE_URL, absoluteUrl } from '../shared/site.js';
import {
  SUBMIT_DESCRIPTION,
  SUBMIT_INTRO,
  SUBMIT_TITLE,
  SUBMISSION_FAQ,
  SUBMISSION_STEPS,
  submissionsBodyHtml,
} from '../shared/submissionsContent.js';
import {
  ORGANIZATION_ID,
  breadcrumbSchema,
  buildHead,
  graph,
  organizationSchema,
  websiteSchema,
} from './_lib/head.js';
import { getTopEngagedPoem } from './_lib/db.js';
import { renderShell, sendHtml } from './_lib/shell.js';

export default async function handler(req, res) {
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Poetry Submissions', path: '/submit-poetry' },
  ];

  const submitPageSchema = {
    '@type': 'WebPage',
    '@id': `${SITE_URL}/submit-poetry#webpage`,
    name: SUBMIT_TITLE,
    description: SUBMIT_DESCRIPTION,
    url: absoluteUrl('/submit-poetry'),
    inLanguage: 'en',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    mainEntity: { '@id': ORGANIZATION_ID },
    text: SUBMIT_INTRO.join(' '),
  };

  const howToSchema = {
    '@type': 'HowTo',
    '@id': `${SITE_URL}/submit-poetry#howto`,
    name: 'How to Submit Poetry Online for Free on Unblot',
    description: 'A step-by-step guide to publishing anonymous poetry online with zero fees and instant response times.',
    totalTime: 'PT2M',
    step: SUBMISSION_STEPS.map((s) => ({
      '@type': 'HowToStep',
      position: s.step,
      name: s.name,
      text: s.text,
      url: `${SITE_URL}/submit-poetry#step-${s.step}`,
    })),
  };

  const faqSchema = {
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/submit-poetry#faq`,
    mainEntity: SUBMISSION_FAQ.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  const head = buildHead({
    title: SUBMIT_TITLE,
    description: SUBMIT_DESCRIPTION,
    path: '/submit-poetry',
    schema: [
      graph([
        organizationSchema(),
        websiteSchema(),
        submitPageSchema,
        howToSchema,
        faqSchema,
        breadcrumbSchema(trail),
      ]),
    ],
  });

  let topPoem = null;
  try {
    topPoem = await getTopEngagedPoem();
  } catch (err) {
    console.error('[api/submit] getTopEngagedPoem error:', err);
  }

  sendHtml(res, renderShell({ head, body: submissionsBodyHtml(topPoem) }));
}

