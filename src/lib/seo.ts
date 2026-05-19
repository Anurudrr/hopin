/**
 * SEO and Meta Tags Configuration
 */

export interface PageMeta {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
}

export const siteConfig = {
  title: 'HopIn - Shared Urban Mobility',
  description:
    'Share rides, split fares, and travel smarter. HopIn helps people across Indian cities commute together.',
  url: 'https://hopin.app',
  image: 'https://hopin.app/og-image.png',
  twitterHandle: '@hopinmobility',
};

export const pageMeta: Record<string, PageMeta> = {
  home: {
    title: 'HopIn - Share Rides, Save Money, Commute Smart',
    description:
      'Shared urban mobility platform for Indian cities. Book rides, save money, commute sustainably.',
    type: 'website',
  },
  about: {
    title: 'About HopIn - Our Mission',
    description:
      'Learn about HopIn\'s mission to make urban commuting affordable, sustainable, and accessible.',
    type: 'article',
  },
  booking: {
    title: 'Book a Ride - HopIn',
    description: 'Find and book shared rides in your city. Save up to 50% on commute costs.',
    type: 'website',
    noindex: true, // Protect from indexing internal pages
  },
  dashboard: {
    title: 'My Dashboard - HopIn',
    description: 'View your rides, bookings, and manage your profile.',
    type: 'website',
    noindex: true,
  },
  blog: {
    title: 'HopIn Blog - Urban Mobility Insights',
    description:
      'Read articles about sustainable commuting, urban mobility trends, and community stories.',
    type: 'article',
  },
  careers: {
    title: 'Join Our Team - HopIn Careers',
    description:
      'Work with us to build the future of urban mobility. Check out our open positions.',
    type: 'website',
  },
  contact: {
    title: 'Contact Us - HopIn Support',
    description: 'Get in touch with our team. We\'re here to help!',
    type: 'website',
  },
  faq: {
    title: 'FAQ - HopIn Help Center',
    description:
      'Find answers to common questions about booking, payments, and our service.',
    type: 'article',
  },
  safety: {
    title: 'Safety at HopIn - Our Commitment',
    description:
      'Learn about our safety features, verification process, and how we keep you protected.',
    type: 'article',
  },
  terms: {
    title: 'Terms of Service - HopIn',
    description: 'Read our terms of service and conditions of use.',
    type: 'article',
  },
  privacy: {
    title: 'Privacy Policy - HopIn',
    description: 'Learn how we protect your privacy and handle your data.',
    type: 'article',
  },
};

/**
 * Generate structured data (JSON-LD) for LocalBusiness
 */
export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'HopIn',
    description: siteConfig.description,
    url: siteConfig.url,
    image: siteConfig.image,
    areaServed: [
      {
        '@type': 'City',
        name: 'Bangalore',
      },
      {
        '@type': 'City',
        name: 'Mumbai',
      },
      {
        '@type': 'City',
        name: 'Delhi',
      },
      {
        '@type': 'City',
        name: 'Hyderabad',
      },
    ],
    serviceType: 'Ride Sharing',
    priceRange: '₹',
    sameAs: [
      'https://facebook.com/hopinmobility',
      'https://twitter.com/hopinmobility',
      'https://instagram.com/hopinmobility',
    ],
  };
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HopIn',
    url: siteConfig.url,
    logo: 'https://hopin.app/logo.png',
    description: siteConfig.description,
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@hopin.app',
    },
    sameAs: [
      'https://facebook.com/hopinmobility',
      'https://twitter.com/hopinmobility',
      'https://instagram.com/hopinmobility',
    ],
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
