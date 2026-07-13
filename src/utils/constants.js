export const APP_NAME = 'Prastav'
export const APP_TAGLINE = 'Student Book Exchange & Recommendations'
export const APP_DESCRIPTION =
  'Nepal-based educational marketplace where students can buy, sell, exchange, donate, and request books with hybrid recommendations.'

export const NAV_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Why Prastav', href: '#about' },
  { label: 'Category', href: '#features' },
  { label: 'FAQs', href: '#faq' },
]

export const FOOTER_LINKS = {
  product: [
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
    { label: 'FAQ', href: '#faq' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
  ],
}

export const CORE_FEATURES = [
  {
    title: 'Buy Books',
    description: 'Find affordable academic books from verified student sellers near you.',
    icon: 'buy',
  },
  {
    title: 'Sell Books',
    description: 'List your used books and reach buyers across Nepal in minutes.',
    icon: 'sell',
  },
  {
    title: 'Exchange Books',
    description: 'Swap books with fellow students and save money on every semester.',
    icon: 'exchange',
  },
  {
    title: 'Donate Books',
    description: 'Give your old textbooks a second life and support other learners.',
    icon: 'donate',
  },
  {
    title: 'Request Books',
    description: 'Request books you need and get matched with nearby sellers.',
    icon: 'request',
  },
  {
    title: 'Nearby Sellers',
    description: 'Discover sellers within 5 KM using location-based matching.',
    icon: 'nearby',
  },
  {
    title: 'Hybrid Recommendation',
    description: 'Smart suggestions powered by title, keyword, grade, and reputation.',
    icon: 'recommend',
  },
  {
    title: 'Secure Payment',
    description: 'Pay safely via eSewa or Khalti with verified QR codes.',
    icon: 'payment',
  },
  {
    title: 'Payment Verification',
    description: 'Upload payment proof and track verification in real time.',
    icon: 'verify',
  },
  {
    title: 'Ratings & Reputation',
    description: 'Build trust with seller ratings and reputation scores.',
    icon: 'rating',
  },
]

export const RECOMMENDATION_FACTORS = [
  { label: 'Title Match', key: 'titleMatch' },
  { label: 'Keyword Match', key: 'keywordMatch' },
  { label: 'Same Grade', key: 'gradeMatch' },
  { label: 'Seller within 5 KM', key: 'nearbySeller' },
  { label: 'High Seller Reputation', key: 'reputation' },
]

export const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: 'Create Your Account',
    description: 'Sign up, verify your email with OTP, and choose your role as buyer, seller, or both.',
  },
  {
    step: 2,
    title: 'Browse or List Books',
    description: 'Search for books you need or add your own listings with photos and details.',
  },
  {
    step: 3,
    title: 'Get Smart Recommendations',
    description: 'Our hybrid engine matches books by title, keywords, grade, distance, and seller reputation.',
  },
  {
    step: 4,
    title: 'Request & Complete',
    description: 'Send a request, pay securely, and complete the transaction with verified payment flow.',
  },
]

export const STATISTICS = [
  { value: '5,000+', label: 'Books Listed' },
  { value: '2,500+', label: 'Active Students' },
  { value: '77', label: 'Districts Covered' },
  { value: '98%', label: 'Satisfaction Rate' },
]

export const FAQ_ITEMS = [
  {
    question: 'What is Prastav?',
    answer:
      'Prastav is a Nepal-based educational marketplace where students can buy, sell, exchange, donate, and request academic books with intelligent hybrid recommendations.',
  },
  {
    question: 'How does the hybrid recommendation system work?',
    answer:
      'Our system combines book title matching, keyword analysis, grade-level matching, nearby seller detection within 5 KM, and seller reputation scores to deliver the most relevant book suggestions.',
  },
  {
    question: 'Is Prastav free to use?',
    answer:
      'Yes! Creating an account and browsing books is completely free. Transaction fees may apply depending on payment method.',
  },
  {
    question: 'How do I pay for a book?',
    answer:
      'After a seller accepts your request, you can pay via eSewa or Khalti using the seller\'s QR code, then upload a payment screenshot for verification.',
  },
  {
    question: 'Can I be both a buyer and seller?',
    answer:
      'Absolutely. During signup you can select Buyer, Seller, or Both roles, and your dashboard adapts accordingly.',
  },
  {
    question: 'What areas does Prastav cover?',
    answer:
      'Prastav serves students across all 77 districts of Nepal, with location-based features to find nearby sellers within a 5 KM radius.',
  },
]
