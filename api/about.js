// Server-rendered /about page.
// This is the primary answer-engine surface: plain declarative prose about what
// Unblot is, backed by FAQPage structured data that assistants can quote.

import { SITE_NAME, SITE_URL, absoluteUrl } from '../shared/site.js';
import {
  ABOUT_DESCRIPTION,
  ABOUT_INTRO,
  ABOUT_TITLE,
  FAQ_ITEMS,
  aboutBodyHtml,
} from '../shared/content.js';
import {
  ORGANIZATION_ID,
  breadcrumbSchema,
  buildHead,
  graph,
  organizationSchema,
  websiteSchema,
} from './_lib/head.js';
import { renderShell, sendHtml } from './_lib/shell.js';

export default async function handler(req, res) {
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
  ];

  const aboutSchema = {
    '@type': 'AboutPage',
    '@id': `${SITE_URL}/about#about`,
    name: ABOUT_TITLE,
    description: ABOUT_DESCRIPTION,
    url: absoluteUrl('/about'),
    inLanguage: 'en',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    mainEntity: { '@id': ORGANIZATION_ID },
    text: ABOUT_INTRO.join(' '),
  };

  const faqSchema = {
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/about#faq`,
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  const head = buildHead({
    title: ABOUT_TITLE,
    description: ABOUT_DESCRIPTION,
    path: '/about',
    schema: [
      graph([
        organizationSchema(),
        websiteSchema(),
        aboutSchema,
        faqSchema,
        breadcrumbSchema(trail),
      ]),
    ],
  });

  sendHtml(res, renderShell({ head, body: aboutBodyHtml() }));
}
