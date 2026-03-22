import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex bg-white">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-neutral-900 text-white flex-col justify-between p-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Talent Matcher</h1>
        </div>
        <div>
          <p className="text-4xl font-serif italic leading-tight mb-6">
            AI-native candidate<br />scoring with<br />configurable rubrics.
          </p>
          <p className="text-neutral-400 text-sm leading-relaxed max-w-md">
            5 judge perspectives. Per-criterion evidence. LinkedIn enrichment. Gale-Shapley stable matching. All in under a minute.
          </p>
        </div>
        <div className="flex gap-6 text-xs text-neutral-500">
          <span>5 judges</span>
          <span>Embedding similarity</span>
          <span>$0.01/run</span>
        </div>
      </div>

      {/* Right — auth form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <h1 className="text-xl font-bold tracking-tight">Talent Matcher</h1>
          </div>
          <SignIn
            fallbackRedirectUrl="/upload"
            appearance={{
              elements: {
                rootBox: "w-full",
                cardBox: "shadow-none border-0 w-full",
                card: "shadow-none border-0 p-0 w-full bg-transparent",
                headerTitle: "text-2xl font-bold tracking-tight text-neutral-900",
                headerSubtitle: "text-sm text-neutral-500",
                formButtonPrimary: "bg-neutral-900 hover:bg-black text-sm font-medium h-10 rounded-none",
                formFieldInput: "border-neutral-200 focus:border-neutral-900 focus:ring-neutral-900 text-sm h-10 rounded-none",
                footerActionLink: "text-neutral-900 font-medium hover:text-black",
                footer: "hidden",
                dividerLine: "bg-neutral-200",
                dividerText: "text-neutral-400 text-xs",
                socialButtonsBlockButton: "border-neutral-200 text-sm h-10 font-medium rounded-none",
                formFieldLabel: "text-sm font-medium text-neutral-700",
                identityPreviewEditButton: "text-neutral-900",
                badge: "hidden",
                logoBox: "hidden",
              },
              layout: {
                socialButtonsPlacement: "top",
                showOptionalFields: false,
              },
            }}
          />
          <p className="text-xs text-neutral-400 mt-4 text-center">Don&apos;t have an account? <a href="/sign-up" className="text-neutral-900 font-medium hover:underline">Sign up</a></p>
        </div>
      </div>
    </div>
  );
}
