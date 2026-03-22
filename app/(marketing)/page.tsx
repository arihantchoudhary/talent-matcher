import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Upload, Sparkles, Download, Users, Building2, Globe, Zap, Shield, BarChart3 } from "lucide-react";

export default async function LandingPage() {
  const { userId } = await auth();
  const signedIn = !!userId;

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Talent Matcher</span>
          </div>
          <div className="flex items-center gap-3">
            {signedIn ? (
              <Link href="/match">
                <Button size="sm">Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in"><Button variant="ghost" size="sm">Sign in</Button></Link>
                <Link href="/sign-up"><Button size="sm">Get started</Button></Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6">
            <Sparkles className="w-3 h-3 mr-1" /> AI-powered matching
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Match candidates to roles<br />
            <span className="text-indigo-600">in seconds, not weeks</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload a CSV of candidates, pick a role from 30+ templates across 30 cities,
            and get AI-powered rankings with detailed reasoning. Built for recruiting teams.
          </p>
          <div className="flex items-center justify-center gap-4">
            {signedIn ? (
              <Link href="/match">
                <Button size="lg" className="text-base px-8">Go to dashboard <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-up">
                  <Button size="lg" className="text-base px-8">Start matching free <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="lg" variant="outline" className="text-base px-8">Sign in</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-muted/40">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Three steps. Any CSV. Any role.</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard icon={<Upload className="w-6 h-6" />} step="1" title="Upload candidates" description="Drop any CSV — we auto-detect columns. LinkedIn exports, ATS exports, your own spreadsheets." />
            <StepCard icon={<Sparkles className="w-6 h-6" />} step="2" title="Pick a role & score" description="30+ role templates or write your own. GPT-4o-mini scores each candidate 0-100 with reasoning." />
            <StepCard icon={<Download className="w-6 h-6" />} step="3" title="Shortlist & export" description="Browse ranked results, add to shortlist, export CSV or JSON for your ATS or interview pipeline." />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Built for recruiting teams</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Multi-tenant by design. Onboard your agency, invite your team, match across roles and cities.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard icon={<Building2 className="w-5 h-5" />} title="Multi-tenant orgs" description="Create your agency workspace. Invite recruiters. Shared candidate pools and role libraries." />
            <FeatureCard icon={<Globe className="w-5 h-5" />} title="30+ cities worldwide" description="NYC, SF, London, Berlin, Singapore, Tokyo, Dubai, Tel Aviv, and more. Filter by city or go remote." />
            <FeatureCard icon={<Zap className="w-5 h-5" />} title="Real-time AI scoring" description="Scores stream in live. See top matches while the rest are still processing." />
            <FeatureCard icon={<Shield className="w-5 h-5" />} title="Any CSV format" description="No rigid templates. Auto-detects names, LinkedIn URLs, and fields from any export." />
            <FeatureCard icon={<BarChart3 className="w-5 h-5" />} title="Highlights & gaps" description="Each candidate gets specific strengths and gaps, not just a number." />
            <FeatureCard icon={<Users className="w-5 h-5" />} title="LinkedIn enrichment" description="LinkedIn URLs in your CSV? We pull profiles and experience to improve matching." />
          </div>
        </div>
      </section>

      {/* Roles preview */}
      <section className="py-20 px-4 bg-muted/40">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">30+ role templates ready to go</h2>
          <p className="text-muted-foreground mb-10">Sales, GTM, Engineering, Product, Marketing, Finance, and more</p>
          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            {["Founding GTM Legal","Enterprise AE","Mid-Market AE","SDR Team Lead","BDR","Sales Engineer","Product-Led Sales","GTM Engineer","GTM Strategy Lead","Head of Partnerships","Tech Partnerships","Enterprise CSM","Mid-Market CSM","Growth Marketing","Product Marketing","Content Lead","RevOps Manager","Deal Desk","VP of Sales","CRO","Sales Director EMEA","Sales Director APAC","Founding Engineer","AI/ML Engineer","PM Growth","Sr PM Platform","FP&A Manager","VP Finance"].map((r) => (
              <Badge key={r} variant="outline" className="text-sm py-1.5 px-3">{r}</Badge>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to match?</h2>
          <p className="text-muted-foreground mb-8">Free to start. No credit card required.</p>
          <Link href={signedIn ? "/match" : "/sign-up"}>
            <Button size="lg" className="text-base px-8">
              {signedIn ? "Go to dashboard" : "Create your workspace"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center">
              <Users className="w-3 h-3 text-white" />
            </div>
            Talent Matcher
          </div>
          <div>Powered by GPT-4o-mini</div>
        </div>
      </footer>
    </div>
  );
}

function StepCard({ icon, step, title, description }: { icon: React.ReactNode; step: string; title: string; description: string }) {
  return (
    <div className="rounded-2xl border bg-card p-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">{icon}</div>
      <div className="text-xs font-bold text-muted-foreground mb-2">STEP {step}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-3 text-foreground">{icon}</div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
