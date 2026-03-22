export interface Role {
  title: string;
  description: string;
  category: string;
  locations: string[];
  remote: boolean;
  experience: string;
}

export const CATEGORIES = ["Sales", "GTM", "Partnerships", "Customer Success", "Marketing", "Operations", "Leadership", "Engineering", "Product", "Finance"];

export const CITIES = [
  "New York", "San Francisco", "Los Angeles", "Palo Alto", "Austin", "Chicago", "Boston", "Seattle", "Miami", "Denver", "Atlanta", "Washington DC",
  "London", "Berlin", "Paris", "Amsterdam", "Dublin", "Barcelona", "Stockholm", "Zurich",
  "Singapore", "Tokyo", "Sydney", "Bangalore", "Hong Kong", "Seoul", "Dubai", "Tel Aviv",
  "S\u00e3o Paulo", "Mexico City",
];

export const ROLES: Role[] = [
  { title: "Founding GTM, Legal", category: "Sales", locations: ["New York", "San Francisco", "London"], remote: false, experience: "1-4yr",
    description: "Build the Legal go-to-market motion for an AI-native procurement platform. High-ownership sales role targeting U.S. enterprise legal buyers (GC/CFO level).\n\nRequirements:\n- 1-4 years in high-performance environment (law, banking, consulting, startups, VC)\n- Familiarity with the Legal sector\n- Ambition to own outcomes, carry a number\n- Strong presence with senior stakeholders (CFO/GC-level buyers)\n- In-person Tuesday-Thursday" },
  { title: "Enterprise Account Executive", category: "Sales", locations: ["New York", "San Francisco", "Chicago", "London", "Singapore"], remote: false, experience: "3-7yr",
    description: "Close six- and seven-figure SaaS deals with Fortune 500 companies. Full-cycle AE owning pipeline from qualification through close.\n\nRequirements:\n- 3-7 years B2B SaaS closing, $500K+ quota\n- Top 10-20% of team track record\n- VP/C-suite selling in enterprise orgs\n- MEDDIC or Challenger methodology" },
  { title: "Mid-Market Account Executive", category: "Sales", locations: ["New York", "Austin", "Denver", "Dublin"], remote: true, experience: "1-3yr",
    description: "Own full sales cycle for $50K-$250K ACV mid-market accounts.\n\nRequirements:\n- 1-3 years closing in B2B SaaS\n- Product demos + POC management\n- Multi-stakeholder deals (3-6 month cycles)\n- CRM discipline" },
  { title: "SDR Team Lead", category: "Sales", locations: ["New York", "San Francisco", "Boston", "London"], remote: false, experience: "2-4yr",
    description: "Player-coach leading 6-8 SDRs while carrying your own outbound quota.\n\nRequirements:\n- 2-4 years SDR/BDR experience\n- Top 10% performer, President's Club\n- Cold call, email, LinkedIn outbound\n- Salesforce, Outreach/Salesloft" },
  { title: "Business Development Rep", category: "Sales", locations: ["New York", "San Francisco", "Austin", "London", "Berlin", "Dublin", "Singapore", "Sydney"], remote: true, experience: "0-2yr",
    description: "Generate qualified pipeline through multi-channel outbound prospecting.\n\nRequirements:\n- 0-2 years in sales or customer-facing roles\n- High energy, competitive drive, coachability\n- 80+ activities/day comfort level\n- Salesforce, Outreach, LinkedIn Sales Navigator" },
  { title: "Sales Engineer", category: "Sales", locations: ["New York", "San Francisco", "Seattle", "London", "Tokyo"], remote: true, experience: "2-5yr",
    description: "Partner with AEs for technical demos, POCs, and RFP responses.\n\nRequirements:\n- 2-5 years solutions engineering or pre-sales\n- APIs, integrations, SaaS architecture\n- Demo to technical + non-technical audiences\n- Consultative selling mindset" },
  { title: "GTM Engineer", category: "GTM", locations: ["San Francisco", "New York", "Palo Alto", "Austin"], remote: true, experience: "2-5yr",
    description: "Build and automate the go-to-market engine — outbound systems, lead scoring, pipeline automation.\n\nRequirements:\n- 2-5 years in sales ops, growth eng, or GTM\n- APIs, Python/JS, Clay/Zapier/n8n\n- Outbound sequences, lead enrichment\n- SQL, analytics, conversion optimization" },
  { title: "Head of Partnerships", category: "Partnerships", locations: ["New York", "San Francisco", "London", "Singapore"], remote: false, experience: "5-8yr",
    description: "Build the partnerships function from scratch — channel, tech integrations, co-selling.\n\nRequirements:\n- 5-8 years in partnerships or strategic alliances\n- Built partner programs from 0→1\n- Revenue through indirect/channel sales\n- C-suite relationship skills" },
  { title: "Enterprise CSM", category: "Customer Success", locations: ["New York", "San Francisco", "Chicago", "London", "Sydney"], remote: true, experience: "3-6yr",
    description: "Own 15-25 enterprise accounts ($500K+ ARR each). Drive adoption, expansion, retention.\n\nRequirements:\n- 3-6 years enterprise CS or consulting\n- $5M+ ARR book of business\n- Net revenue retention above 115%\n- C-suite communication" },
  { title: "Growth Marketing Manager", category: "Marketing", locations: ["New York", "San Francisco", "Los Angeles", "London", "Berlin"], remote: true, experience: "3-5yr",
    description: "Own demand gen and pipeline marketing — paid, ABM, events, content.\n\nRequirements:\n- 3-5 years B2B demand gen\n- $500K+ marketing budget\n- Measurable pipeline generation\n- HubSpot/Marketo + ABM tools" },
  { title: "Product Marketing Manager", category: "Marketing", locations: ["San Francisco", "New York", "London", "Berlin", "Tel Aviv"], remote: true, experience: "3-6yr",
    description: "Own positioning, messaging, competitive intel, and sales enablement.\n\nRequirements:\n- 3-6 years product marketing at B2B SaaS\n- Competitive analysis, battlecards\n- Sales enablement materials\n- Customer research + personas" },
  { title: "Revenue Operations Manager", category: "Operations", locations: ["New York", "San Francisco", "Austin", "London"], remote: true, experience: "2-5yr",
    description: "Own the data and systems powering GTM — Salesforce, dashboards, forecasting.\n\nRequirements:\n- 2-5 years RevOps at B2B SaaS\n- Expert Salesforce admin\n- SQL + BI tools\n- Gong, Outreach, Clari" },
  { title: "VP of Sales", category: "Leadership", locations: ["New York", "San Francisco", "London"], remote: false, experience: "8-12yr",
    description: "Build and lead the sales org from Series B through scale.\n\nRequirements:\n- 8-12 years B2B SaaS, 3+ in leadership\n- Scaled team 5→30+ reps\n- $10M+ ARR quota attainment\n- Board-level communication" },
  { title: "CRO / Head of Revenue", category: "Leadership", locations: ["New York", "San Francisco", "London", "Dubai"], remote: false, experience: "10-15yr",
    description: "Own all revenue — sales, CS, partnerships, rev ops. Report to CEO.\n\nRequirements:\n- 10-15 years, 5+ in revenue leadership\n- Scaled $10M→$100M+ ARR\n- Multi-functional GTM orgs (100+ people)\n- International expansion" },
  { title: "Sales Director, EMEA", category: "Leadership", locations: ["London", "Berlin", "Paris", "Amsterdam", "Dublin"], remote: false, experience: "6-10yr",
    description: "Lead European sales team — hiring, territory planning, enterprise deals.\n\nRequirements:\n- 6-10 years B2B SaaS, 2+ EMEA leadership\n- Teams of 5-15 across European markets\n- European procurement regulations\n- Multi-cultural management" },
  { title: "Sales Director, APAC", category: "Leadership", locations: ["Singapore", "Tokyo", "Sydney", "Hong Kong", "Bangalore", "Seoul"], remote: false, experience: "6-10yr",
    description: "Open and scale APAC market — hire team, close lighthouse accounts.\n\nRequirements:\n- 6-10 years B2B SaaS, 2+ APAC leadership\n- Opened new market from scratch\n- Enterprise relationships across APAC\n- Channel/partner-driven sales" },
  { title: "Founding Engineer", category: "Engineering", locations: ["San Francisco", "Palo Alto", "New York"], remote: false, experience: "3-7yr",
    description: "First engineer at a venture-backed startup. Build the product from zero.\n\nRequirements:\n- 3-7 years full-stack (React/Next.js + Python/Node)\n- Built and shipped from scratch\n- Infrastructure, CI/CD, observability\n- Strong product instincts" },
  { title: "AI/ML Engineer", category: "Engineering", locations: ["San Francisco", "Palo Alto", "New York", "London", "Berlin", "Tel Aviv", "Bangalore", "Tokyo"], remote: true, experience: "2-6yr",
    description: "Build ML models powering core features — NLP, scoring, automation.\n\nRequirements:\n- 2-6 years applied ML\n- PyTorch/TensorFlow, LLM fine-tuning\n- Production ML systems\n- RAG, embeddings, vector DBs" },
  { title: "Product Manager, Growth", category: "Product", locations: ["San Francisco", "New York", "London", "Berlin"], remote: true, experience: "3-6yr",
    description: "Own activation, conversion, and expansion metrics. Run experiments.\n\nRequirements:\n- 3-6 years PM at SaaS/PLG\n- A/B testing, funnel analysis\n- SQL + analytics tools\n- Pricing and monetization" },
  { title: "FP&A Manager", category: "Finance", locations: ["New York", "San Francisco", "London"], remote: false, experience: "3-6yr",
    description: "Own financial planning, budgeting, and analysis.\n\nRequirements:\n- 3-6 years FP&A, IB, or consulting\n- SaaS metrics (ARR, NRR, CAC, LTV)\n- Financial modeling\n- Board-level reporting" },
];
