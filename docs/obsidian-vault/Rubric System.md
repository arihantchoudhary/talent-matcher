# Rubric System

**Read this out loud in 4 points:**

1. **The rubric makes AI evaluation transparent and controllable.** Instead of GPT using its own black-box judgment, the recruiter defines 6 criteria (Relevant Experience, Industry Fit, Sales Capability, Stakeholder Presence, Cultural Fit, Location) with adjustable weights that sum to 100%. Those weights go directly into the GPT prompt.

2. **Five named "judges" represent different hiring philosophies.** John is balanced. Jake prioritizes pipeline volume and cold outreach. Christian wants enterprise closers with big deal sizes. Yash values brand-name backgrounds (FAANG, McKinsey, Stanford). Nazar wants scrappy builders who've done 0→1. Each judge has preset weights and an ideal candidate profile.

3. **The ideal candidate profile does double duty.** It feeds into the GPT scoring prompt ("evaluate against this profile") AND into the HyDE embedding pre-filter ("find candidates similar to this description"). Better ideal profiles improve both the pre-filter's recall and GPT's scoring accuracy.

4. **Custom mode lets power users override everything.** The 5 judges are quick presets. If a recruiter wants 40% Cultural Fit and 5% Location with a custom ideal profile about "founding team experience at climate tech startups," they can build that. Preset → customize → score.

---

## If they probe deeper

**"Why named judges instead of just sliders?"** — Recruiters think in personas, not percentages. "I want someone like Jake" is faster and more intuitive than manually adjusting 6 sliders. The names also make the product conversational and memorable.

**"How do weights actually affect scoring?"** — The GPT system prompt says: "Score this candidate on a 0-100 scale. Weight Relevant Experience at 20%, Sales Capability at 35%..." GPT-4o-mini reliably produces scores that reflect the weight distribution. Higher-weighted criteria dominate the score.

**"Can you run the same CSV with different judges?"** — Yes, and this is a core use case. Score 93 candidates with John (balanced), then with Nazar (scrappy builder). Different judges surface different top candidates. The history page lets you compare across runs.

## See also
- [[Scoring Engine]] — How weights feed into the GPT prompt
- [[Embedding Pre-Filter]] — How ideal profiles drive HyDE
- [[Decision Log]] — Why 5 named judges instead of just sliders
