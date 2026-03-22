export interface RoleTemplate {
  title: string;
  description: string;
  category: string;
  locations: string[];
  remote: boolean;
  experienceRange: string;
}

export const CITIES = [
  // US
  "New York", "San Francisco", "Los Angeles", "Palo Alto", "Austin", "Chicago", "Boston",
  "Seattle", "Miami", "Denver", "Atlanta", "Washington DC", "Nashville", "Philadelphia",
  // Europe
  "London", "Berlin", "Paris", "Amsterdam", "Dublin", "Barcelona", "Stockholm", "Zurich",
  // Asia-Pacific
  "Singapore", "Tokyo", "Sydney", "Bangalore", "Hong Kong", "Seoul",
  // Middle East
  "Dubai", "Tel Aviv",
  // LATAM
  "São Paulo", "Mexico City",
];

export const CATEGORIES = [
  "Sales", "GTM", "Partnerships", "Customer Success", "Marketing",
  "Operations", "Leadership", "Engineering", "Product", "Finance",
];

export const ROLES: RoleTemplate[] = [
  // ─── SALES ─────────────────────────────────────────────────────────────────
  {
    title: "Founding GTM, Legal",
    category: "Sales",
    locations: ["New York", "San Francisco", "London"],
    remote: false,
    experienceRange: "1-4 years",
    description: `Build the Legal go-to-market motion for an AI-native procurement platform. High-ownership sales role targeting U.S. enterprise legal buyers (GC/CFO level).

Requirements:
- 1-4 years in high-performance environment (law, banking, consulting, startups, VC)
- Familiarity with the Legal sector
- Ambition to own outcomes, carry a number, build in new markets
- Strong presence with senior stakeholders (CFO/GC-level buyers)
- In-person Tuesday-Thursday`,
  },
  {
    title: "Enterprise Account Executive",
    category: "Sales",
    locations: ["New York", "San Francisco", "Chicago", "London", "Singapore"],
    remote: false,
    experienceRange: "3-7 years",
    description: `Close six- and seven-figure SaaS deals with Fortune 500 companies. Full-cycle AE owning pipeline from qualification through close.

Requirements:
- 3-7 years B2B SaaS closing experience, $500K+ quota
- Track record of hitting/exceeding quota (top 10-20% of team)
- Experience selling to VP/C-suite in enterprise orgs
- Complex, multi-stakeholder deal experience (6+ month cycles)
- MEDDIC, Challenger, or similar methodology proficiency`,
  },
  {
    title: "Mid-Market Account Executive",
    category: "Sales",
    locations: ["New York", "Austin", "Denver", "Atlanta", "Dublin"],
    remote: true,
    experienceRange: "1-3 years",
    description: `Own the full sales cycle for mid-market accounts ($50K-$250K ACV). Prospect, demo, negotiate, and close deals with department heads and VPs.

Requirements:
- 1-3 years of closing experience in B2B SaaS
- Track record of meeting or exceeding quota
- Experience running product demos and managing POCs
- Navigate multi-stakeholder deals (3-6 month cycles)
- CRM hygiene and pipeline management discipline`,
  },
  {
    title: "SDR Team Lead",
    category: "Sales",
    locations: ["New York", "San Francisco", "Boston", "London"],
    remote: false,
    experienceRange: "2-4 years",
    description: `Player-coach leading 6-8 SDRs while carrying your own outbound quota. Build playbooks, coach reps, and drive pipeline.

Requirements:
- 2-4 years SDR/BDR experience with lead/mentor experience
- Top-performer track record (top 10%, President's Club)
- Outbound across cold call, email, and LinkedIn
- Coach, motivate, and develop junior reps
- Salesforce, Outreach/Salesloft, ZoomInfo/Apollo proficiency`,
  },
  {
    title: "Business Development Representative",
    category: "Sales",
    locations: ["New York", "San Francisco", "Austin", "London", "Berlin", "Dublin", "Singapore", "Sydney"],
    remote: true,
    experienceRange: "0-2 years",
    description: `Generate qualified pipeline through outbound prospecting. Multi-channel outreach to target accounts.

Requirements:
- 0-2 years in sales, BD, or customer-facing roles
- High energy, competitive drive, coachability
- Comfort with high-volume outbound (80+ activities/day)
- Salesforce, Outreach, LinkedIn Sales Navigator
- Resilience and positive response to rejection`,
  },
  {
    title: "Sales Engineer / Solutions Consultant",
    category: "Sales",
    locations: ["New York", "San Francisco", "Seattle", "London", "Tokyo", "Singapore"],
    remote: true,
    experienceRange: "2-5 years",
    description: `Partner with AEs to run technical demos, POCs, and RFP responses for enterprise prospects.

Requirements:
- 2-5 years in solutions engineering, pre-sales, or technical consulting
- Strong technical foundation (APIs, integrations, SaaS architecture)
- Product demos to technical and non-technical audiences
- Scope and deliver POCs within deal timelines
- Consultative selling — uncover requirements and map to value`,
  },
  {
    title: "Product-Led Sales Rep",
    category: "Sales",
    locations: ["San Francisco", "New York", "Austin"],
    remote: true,
    experienceRange: "1-3 years",
    description: `Convert PQLs into paying customers. Work inbound leads from free trial/freemium, run short-cycle demos and close.

Requirements:
- 1-3 years in inside sales, PLG sales, or SaaS closing
- High-velocity sales (30-60 day cycles, $10K-$80K ACV)
- Qualify based on product usage signals
- 4-6 demos per day
- Product analytics tools (Pendo, Amplitude, Mixpanel)`,
  },
  // ─── GTM ───────────────────────────────────────────────────────────────────
  {
    title: "GTM Engineer",
    category: "GTM",
    locations: ["San Francisco", "New York", "Palo Alto", "Austin"],
    remote: true,
    experienceRange: "2-5 years",
    description: `Build and automate the go-to-market engine. Combine sales, marketing, and engineering to create scalable outbound systems, lead scoring, and pipeline automation.

Requirements:
- 2-5 years in sales ops, growth engineering, or GTM roles
- Proficiency with APIs, Python/JS, and automation tools (Clay, Zapier, n8n)
- Experience building outbound sequences, lead enrichment pipelines
- Data-driven — SQL, analytics, conversion optimization
- Understand the full sales funnel from lead gen to close`,
  },
  {
    title: "GTM Strategy & Operations Lead",
    category: "GTM",
    locations: ["New York", "San Francisco", "London"],
    remote: false,
    experienceRange: "4-7 years",
    description: `Own GTM planning, territory design, pricing strategy, and cross-functional alignment between sales, marketing, and product.

Requirements:
- 4-7 years in strategy, consulting, or GTM ops at a B2B SaaS company
- Experience with market segmentation, TAM analysis, and pricing
- Built territory plans and quota models
- Cross-functional leadership (sales, marketing, product, finance)
- Strong analytical skills — financial modeling, cohort analysis`,
  },
  // ─── PARTNERSHIPS ──────────────────────────────────────────────────────────
  {
    title: "Head of Partnerships",
    category: "Partnerships",
    locations: ["New York", "San Francisco", "London", "Singapore"],
    remote: false,
    experienceRange: "5-8 years",
    description: `Build the partnerships function from scratch — channel partners, tech integrations, co-selling, strategic alliances.

Requirements:
- 5-8 years in partnerships, BD, or strategic alliances at SaaS
- Built partner programs from 0→1
- Revenue through indirect/channel sales
- C-suite and VP-level relationship skills
- Structure and negotiate partner agreements`,
  },
  {
    title: "Technology Partnerships Manager",
    category: "Partnerships",
    locations: ["San Francisco", "New York", "Seattle", "London"],
    remote: true,
    experienceRange: "3-5 years",
    description: `Manage and grow technology integration partnerships. Drive co-build, co-market, and co-sell motions with platform partners.

Requirements:
- 3-5 years in technology partnerships, BD, or solutions architecture
- Technical enough to scope API integrations
- Experience with partnership ecosystems (Salesforce, AWS, Slack, etc.)
- Track record of joint revenue generation
- Cross-functional coordination with product and engineering`,
  },
  // ─── CUSTOMER SUCCESS ──────────────────────────────────────────────────────
  {
    title: "Enterprise Customer Success Manager",
    category: "Customer Success",
    locations: ["New York", "San Francisco", "Chicago", "London", "Sydney", "Singapore"],
    remote: true,
    experienceRange: "3-6 years",
    description: `Own a book of 15-25 enterprise accounts ($500K+ ARR each). Drive adoption, expansion, and retention. Executive-level relationship management.

Requirements:
- 3-6 years in enterprise CS, account management, or consulting
- $5M+ ARR book of business
- Net revenue retention above 115%
- C-suite communication (CTO, CFO, CIO)
- Strategic account planning and QBR execution`,
  },
  {
    title: "Customer Success Manager, Mid-Market",
    category: "Customer Success",
    locations: ["New York", "Austin", "Denver", "Dublin", "Berlin"],
    remote: true,
    experienceRange: "2-4 years",
    description: `Manage 30-50 mid-market accounts. Drive onboarding, adoption, expansion, and renewals.

Requirements:
- 2-4 years in CS, account management, or consulting
- $2M+ ARR book of business
- Identify upsell/cross-sell opportunities
- Technical enough to understand SaaS workflows
- Strong at building playbooks and processes`,
  },
  // ─── MARKETING ─────────────────────────────────────────────────────────────
  {
    title: "Growth Marketing Manager",
    category: "Marketing",
    locations: ["New York", "San Francisco", "Los Angeles", "London", "Berlin"],
    remote: true,
    experienceRange: "3-5 years",
    description: `Own demand generation and pipeline marketing. Paid campaigns, ABM, events, and content driving qualified meetings.

Requirements:
- 3-5 years in B2B demand gen or growth marketing
- $500K+ annual marketing budget management
- Measurable pipeline generation (not just MQLs)
- HubSpot/Marketo and ABM tools (6sense/Demandbase)
- Attribution modeling and funnel analytics`,
  },
  {
    title: "Head of Content & Thought Leadership",
    category: "Marketing",
    locations: ["New York", "San Francisco", "London"],
    remote: true,
    experienceRange: "5-8 years",
    description: `Build the content engine — blog, research, social, podcasts, events. Position the company as the category leader.

Requirements:
- 5-8 years in B2B content marketing or editorial
- Built content programs that drive measurable pipeline
- Experience with executive thought leadership and ghostwriting
- SEO, social distribution, and community building
- Background in enterprise SaaS, fintech, or legal tech preferred`,
  },
  {
    title: "Product Marketing Manager",
    category: "Marketing",
    locations: ["San Francisco", "New York", "London", "Berlin", "Tel Aviv"],
    remote: true,
    experienceRange: "3-6 years",
    description: `Own positioning, messaging, competitive intel, and sales enablement. Launch products and arm the GTM team.

Requirements:
- 3-6 years in product marketing at B2B SaaS
- Competitive analysis and battlecard creation
- Sales enablement (decks, one-pagers, demo scripts)
- Cross-functional work with product, sales, and demand gen
- Customer research and persona development`,
  },
  // ─── OPERATIONS ────────────────────────────────────────────────────────────
  {
    title: "Revenue Operations Manager",
    category: "Operations",
    locations: ["New York", "San Francisco", "Austin", "London"],
    remote: true,
    experienceRange: "2-5 years",
    description: `Own the data and systems powering GTM. Salesforce, dashboards, forecasting, territory planning, comp plans.

Requirements:
- 2-5 years in RevOps, Sales Ops, or BizOps at B2B SaaS
- Expert Salesforce admin
- SQL + BI tools (Looker, Tableau)
- Pipeline stages, forecasting, territory design
- Tools: Gong, Outreach, Clari, or similar`,
  },
  {
    title: "Deal Desk / Order Management Analyst",
    category: "Operations",
    locations: ["New York", "San Francisco", "Dublin"],
    remote: false,
    experienceRange: "1-3 years",
    description: `Support the sales team with deal structuring, pricing approvals, contract management, and order processing.

Requirements:
- 1-3 years in deal desk, sales ops, or finance at a SaaS company
- Experience with CPQ tools (Salesforce CPQ, DealHub)
- Understanding of SaaS pricing models and contract terms
- Detail-oriented with strong process discipline
- Cross-functional coordination with legal, finance, and sales`,
  },
  // ─── LEADERSHIP ────────────────────────────────────────────────────────────
  {
    title: "VP of Sales",
    category: "Leadership",
    locations: ["New York", "San Francisco", "London"],
    remote: false,
    experienceRange: "8-12 years",
    description: `Build and lead the sales org from Series B through scale. Own revenue, hiring, process, and strategy.

Requirements:
- 8-12 years B2B SaaS sales, 3+ years in leadership
- Scaled team from 5→30+ reps
- Built repeatable sales processes and playbooks
- $10M+ ARR quota attainment
- Board-level forecasting and communication`,
  },
  {
    title: "CRO / Head of Revenue",
    category: "Leadership",
    locations: ["New York", "San Francisco", "London", "Dubai"],
    remote: false,
    experienceRange: "10-15 years",
    description: `Own all revenue-generating functions — sales, CS, partnerships, and revenue operations. Report to CEO.

Requirements:
- 10-15 years in B2B SaaS with 5+ in revenue leadership
- Scaled revenue from $10M→$100M+ ARR
- Built and led multi-functional GTM orgs (100+ people)
- Board and investor communication
- Experience with international expansion`,
  },
  {
    title: "Sales Director, EMEA",
    category: "Leadership",
    locations: ["London", "Berlin", "Paris", "Amsterdam", "Dublin"],
    remote: false,
    experienceRange: "6-10 years",
    description: `Lead the European sales team. Build the region from early traction to scale — hiring, territory planning, enterprise deal execution.

Requirements:
- 6-10 years in B2B SaaS sales, 2+ in EMEA leadership
- Built and managed teams of 5-15 across multiple European markets
- Enterprise deal experience with European Fortune 500
- Multi-language or multi-cultural team management
- Understanding of European procurement and data privacy regulations`,
  },
  {
    title: "Sales Director, APAC",
    category: "Leadership",
    locations: ["Singapore", "Tokyo", "Sydney", "Hong Kong", "Bangalore", "Seoul"],
    remote: false,
    experienceRange: "6-10 years",
    description: `Open and scale the APAC market. Hire the initial team, close lighthouse accounts, and build the regional GTM motion.

Requirements:
- 6-10 years in B2B SaaS sales, 2+ in APAC leadership
- Opened a new market or region from scratch
- Enterprise relationships across APAC (Japan, ANZ, SEA, India)
- Cultural fluency across diverse APAC markets
- Experience with channel/partner-driven sales in the region`,
  },
  // ─── ENGINEERING ───────────────────────────────────────────────────────────
  {
    title: "Founding Engineer (Full-Stack)",
    category: "Engineering",
    locations: ["San Francisco", "Palo Alto", "New York"],
    remote: false,
    experienceRange: "3-7 years",
    description: `First or second engineer at a venture-backed startup. Build the product from zero — architecture, shipping, iteration.

Requirements:
- 3-7 years full-stack experience (React/Next.js + Python/Node)
- Built and shipped production products from scratch
- Comfortable owning infrastructure, CI/CD, and observability
- Strong product instincts — can make UX decisions independently
- Startup experience preferred — pace, ownership, ambiguity`,
  },
  {
    title: "AI/ML Engineer",
    category: "Engineering",
    locations: ["San Francisco", "Palo Alto", "New York", "London", "Berlin", "Tel Aviv", "Bangalore", "Tokyo"],
    remote: true,
    experienceRange: "2-6 years",
    description: `Build and deploy ML models powering core product features — NLP, recommendations, scoring, automation.

Requirements:
- 2-6 years in ML engineering or applied AI
- Python, PyTorch/TensorFlow, LLM fine-tuning and prompt engineering
- Production ML systems (not just research)
- Experience with RAG, embeddings, vector databases
- MLOps — model monitoring, A/B testing, deployment pipelines`,
  },
  // ─── PRODUCT ───────────────────────────────────────────────────────────────
  {
    title: "Product Manager, Growth",
    category: "Product",
    locations: ["San Francisco", "New York", "London", "Berlin"],
    remote: true,
    experienceRange: "3-6 years",
    description: `Own activation, conversion, and expansion metrics. Run experiments across the user journey to drive self-serve revenue.

Requirements:
- 3-6 years in product management at a SaaS/PLG company
- Data-driven experimentation (A/B testing, funnel analysis)
- Cross-functional with engineering, design, marketing, and sales
- SQL proficiency and comfort with analytics tools
- Experience with pricing, packaging, and monetization`,
  },
  {
    title: "Senior Product Manager, Platform",
    category: "Product",
    locations: ["San Francisco", "New York", "Seattle", "London", "Bangalore"],
    remote: true,
    experienceRange: "5-8 years",
    description: `Own the platform — APIs, integrations, developer experience, and extensibility. Build for scale and ecosystem.

Requirements:
- 5-8 years in product management, 2+ on platform/API products
- Deep technical understanding (APIs, SDKs, webhooks, auth)
- Developer empathy — built products developers love
- Managed platform roadmaps balancing internal and external needs
- Experience with partner/ecosystem strategy`,
  },
  // ─── FINANCE ───────────────────────────────────────────────────────────────
  {
    title: "FP&A Manager",
    category: "Finance",
    locations: ["New York", "San Francisco", "London"],
    remote: false,
    experienceRange: "3-6 years",
    description: `Own financial planning, budgeting, and analysis. Support leadership with data-driven decision making.

Requirements:
- 3-6 years in FP&A, investment banking, or management consulting
- SaaS metrics fluency (ARR, NRR, CAC, LTV, Rule of 40)
- Financial modeling in Excel and Google Sheets
- Experience with board-level reporting
- Tools: Mosaic, Pigment, Anaplan, or similar`,
  },
  {
    title: "Head of Finance / VP Finance",
    category: "Finance",
    locations: ["New York", "San Francisco", "London", "Dubai"],
    remote: false,
    experienceRange: "8-12 years",
    description: `Lead finance from Series B through scale or IPO-readiness. Own accounting, FP&A, treasury, tax, and investor relations.

Requirements:
- 8-12 years in finance, 3+ in leadership at high-growth SaaS
- Managed through fundraising rounds (Series B-D)
- Built finance teams (5-15 people)
- SOX readiness, audit management, revenue recognition (ASC 606)
- Board and investor communication experience`,
  },
];
