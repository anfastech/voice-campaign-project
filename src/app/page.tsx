import Link from "next/link"
import {
  Zap,
  Phone,
  Bot,
  BarChart3,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Headphones,
  Shield,
  Clock,
  TrendingUp,
  ChevronRight,
  Play,
} from "lucide-react"
import { ShaderAnimation } from "@/components/ui/shader-lines"
import { VoiceAgentWidget } from "@/components/landing/VoiceAgentWidget"

const features = [
  {
    icon: Bot,
    title: "AI Voice Agents",
    description: "Deploy human-like voice agents with zero wait times and infinite scale.",
    color: "oklch(0.49 0.263 281)",
    glow: "oklch(0.49 0.263 281 / 25%)",
    gradient: "linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Live dashboards tracking every call, conversion, sentiment score and revenue attribution in real time.",
    color: "oklch(0.55 0.215 163)",
    glow: "oklch(0.55 0.215 163 / 25%)",
    gradient: "linear-gradient(135deg, oklch(0.55 0.215 163), oklch(0.65 0.19 150))",
  },
  {
    icon: Users,
    title: "Smart Campaign Manager",
    description: "Upload contacts, segment audiences, set schedules and let AI agents handle thousands of calls simultaneously.",
    color: "oklch(0.6 0.19 220)",
    glow: "oklch(0.6 0.19 220 / 25%)",
    gradient: "linear-gradient(135deg, oklch(0.6 0.19 220), oklch(0.7 0.17 235))",
  },
  {
    icon: Shield,
    title: "Compliance Built-In",
    description: "TCPA-compliant calling windows, automatic DNC list management, and full call recording with transcripts.",
    color: "oklch(0.72 0.18 68)",
    glow: "oklch(0.72 0.18 68 / 25%)",
    gradient: "linear-gradient(135deg, oklch(0.72 0.18 68), oklch(0.82 0.17 82))",
  },
]

const stats = [
  { value: "10M+", label: "Calls Completed", icon: Phone },
  { value: "94%", label: "Answer Rate", icon: TrendingUp },
  { value: "3.2x", label: "More Conversions", icon: Sparkles },
  { value: "< 80ms", label: "Response Latency", icon: Clock },
]

const steps = [
  {
    step: "01",
    title: "Upload Your Contacts",
    description: "Import CSV files or sync from your CRM. Segment by any field in seconds.",
  },
  {
    step: "02",
    title: "Configure Your AI Agent",
    description: "Set the voice, script, goals and fallback logic. Preview the agent before launch.",
  },
  {
    step: "03",
    title: "Launch & Monitor",
    description: "Start the campaign and watch calls happen live. Intervene anytime or let AI handle it all.",
  },
]


export default function LandingPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "oklch(0.06 0.018 285)",
        color: "oklch(0.97 0.006 285)",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
      }}
    >
      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: "oklch(0.06 0.018 285 / 80%)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid oklch(1 0 0 / 6%)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))",
              boxShadow: "0 0 20px oklch(0.49 0.263 281 / 40%)",
            }}
          >
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">VoiceCampaign</span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: "oklch(0.65 0.01 285)" }}>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden sm:block text-sm font-medium transition-colors hover:text-white"
            style={{ color: "oklch(0.65 0.01 285)" }}
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.58 0.24 300))",
              boxShadow: "0 4px 16px oklch(0.49 0.263 281 / 35%)",
            }}
          >
            Get Started
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Shader animation background */}
        <div className="absolute inset-0">
          <ShaderAnimation />
        </div>

        {/* Dark gradient overlays for readability */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, oklch(0.06 0.018 285 / 75%) 0%, oklch(0.06 0.018 285 / 45%) 40%, oklch(0.06 0.018 285 / 75%) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 50%, oklch(0.49 0.263 281 / 12%) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, oklch(0.6 0.19 220 / 8%) 0%, transparent 50%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Copy */}
            <div>
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
                style={{
                  background: "oklch(0.49 0.263 281 / 15%)",
                  border: "1px solid oklch(0.49 0.263 281 / 30%)",
                  color: "oklch(0.78 0.18 281)",
                }}
              >
                <Sparkles className="w-3 h-3" />
                Powered by Advanced AI
              </div>

              {/* Headline */}
              <h1
                className="text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight mb-6"
                style={{ color: "white" }}
              >
                AI Voice Agents
                <br />
                <span
                  style={{
                    background: "linear-gradient(135deg, oklch(0.68 0.22 281), oklch(0.75 0.19 310), oklch(0.7 0.17 235))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  That Actually Convert
                </span>
              </h1>

              <p
                className="text-lg leading-relaxed mb-8 max-w-xl"
                style={{ color: "oklch(0.72 0.01 285)" }}
              >
                Deploy intelligent outbound voice agents in minutes. Scale to thousands of simultaneous calls,
                convert more leads, and never miss a follow-up again.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105 hover:brightness-110"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.58 0.24 300))",
                    boxShadow: "0 8px 32px oklch(0.49 0.263 281 / 40%)",
                  }}
                >
                  Start Free — No Card Required
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:bg-white/10"
                  style={{
                    background: "oklch(1 0 0 / 6%)",
                    border: "1px solid oklch(1 0 0 / 12%)",
                    color: "oklch(0.9 0.005 285)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <Play className="w-4 h-4" fill="currentColor" />
                  Watch Demo
                </button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center gap-4">
                {[
                  "SOC2 Compliant",
                  "TCPA Ready",
                  "99.9% Uptime",
                ].map((badge) => (
                  <div key={badge} className="flex items-center gap-1.5 text-xs" style={{ color: "oklch(0.62 0.01 285)" }}>
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.19 163)" }} />
                    {badge}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Voice Agent Widget */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-sm">
                <VoiceAgentWidget />

                {/* Floating stats below widget */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { label: "Calls today", value: "1,847", color: "oklch(0.49 0.263 281)" },
                    { label: "Success rate", value: "94.2%", color: "oklch(0.55 0.215 163)" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-2xl p-3 text-center"
                      style={{
                        background: "oklch(0.09 0.02 285 / 80%)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid oklch(1 0 0 / 10%)",
                      }}
                    >
                      <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.015 285)" }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
          <div className="w-px h-12" style={{ background: "linear-gradient(to bottom, oklch(1 0 0 / 0%), oklch(1 0 0 / 25%))" }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(1 0 0 / 30%)" }} />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20" style={{ background: "oklch(0.07 0.018 285)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map(({ value, label, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl p-6 text-center group hover:-translate-y-1 transition-transform duration-300"
                style={{
                  background: "oklch(0.1 0.022 285)",
                  border: "1px solid oklch(1 0 0 / 7%)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: "oklch(0.49 0.263 281 / 12%)" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "oklch(0.68 0.22 281)" }} />
                </div>
                <p className="text-3xl font-bold text-white">{value}</p>
                <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.015 285)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24" style={{ background: "oklch(0.06 0.018 285)" }}>
        <div className="max-w-7xl mx-auto px-6">
          {/* Section header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{
                background: "oklch(0.55 0.215 163 / 12%)",
                border: "1px solid oklch(0.55 0.215 163 / 25%)",
                color: "oklch(0.65 0.19 163)",
              }}
            >
              <Headphones className="w-3 h-3" />
              Everything you need
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Built for Revenue Teams
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "oklch(0.65 0.01 285)" }}>
              From first dial to closed deal — every tool you need to run AI voice campaigns at enterprise scale.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {features.map(({ icon: Icon, title, description, color, glow, gradient }) => (
              <div
                key={title}
                className="relative rounded-2xl p-6 group hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                style={{
                  background: "oklch(0.1 0.022 285)",
                  border: "1px solid oklch(1 0 0 / 7%)",
                }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                  style={{ background: `radial-gradient(circle at top left, ${glow} 0%, transparent 60%)` }}
                />

                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-40 group-hover:opacity-70 transition-opacity"
                  style={{ background: gradient }}
                />

                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: gradient, boxShadow: `0 8px 24px ${glow}` }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "oklch(0.62 0.012 285)" }}>
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24" style={{ background: "oklch(0.075 0.019 285)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Launch in Under 10 Minutes</h2>
            <p className="text-base" style={{ color: "oklch(0.62 0.01 285)" }}>
              No engineering degree required. Set up, configure and go live faster than you can write a cold email.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connecting line */}
            <div
              className="hidden md:block absolute top-8 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px"
              style={{ background: "linear-gradient(to right, oklch(0.49 0.263 281 / 30%), oklch(0.6 0.19 220 / 30%))" }}
            />

            {steps.map(({ step, title, description }, idx) => (
              <div
                key={step}
                className="relative rounded-2xl p-6"
                style={{
                  background: "oklch(0.1 0.022 285)",
                  border: "1px solid oklch(1 0 0 / 7%)",
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black mb-5 relative z-10"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.58 0.24 300))",
                    boxShadow: "0 8px 24px oklch(0.49 0.263 281 / 30%)",
                    color: "white",
                    fontFamily: "monospace",
                  }}
                >
                  {step}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "oklch(0.58 0.01 285)" }}>
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-28 relative overflow-hidden" style={{ background: "oklch(0.06 0.018 285)" }}>
        {/* Background accent */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, oklch(0.49 0.263 281 / 10%) 0%, transparent 65%)",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{
              background: "oklch(0.49 0.263 281 / 12%)",
              border: "1px solid oklch(0.49 0.263 281 / 25%)",
              color: "oklch(0.78 0.18 281)",
            }}
          >
            <Zap className="w-3 h-3" />
            Start in minutes
          </div>

          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            Ready to 10x Your
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, oklch(0.68 0.22 281), oklch(0.7 0.17 235))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Outbound Results?
            </span>
          </h2>

          <p className="text-lg mb-10" style={{ color: "oklch(0.65 0.01 285)" }}>
            Join hundreds of teams using VoiceCampaign to automate outreach and close more deals with AI.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base transition-all hover:scale-105 hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.58 0.24 300))",
                boxShadow: "0 12px 40px oklch(0.49 0.263 281 / 40%)",
              }}
            >
              Open Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-all hover:bg-white/10"
              style={{
                background: "oklch(1 0 0 / 6%)",
                border: "1px solid oklch(1 0 0 / 12%)",
                color: "oklch(0.85 0.005 285)",
                backdropFilter: "blur(12px)",
              }}
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="py-8 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
        style={{
          borderTop: "1px solid oklch(1 0 0 / 6%)",
          background: "oklch(0.055 0.015 285)",
          color: "oklch(0.42 0.01 285)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))" }}
          >
            <Zap className="w-2.5 h-2.5 text-white" fill="white" />
          </div>
          <span className="font-semibold" style={{ color: "oklch(0.55 0.01 285)" }}>VoiceCampaign</span>
          <span>— AI Voice Platform</span>
        </div>
        <span>© 2025 VoiceCampaign. All rights reserved.</span>
      </footer>
    </div>
  )
}
