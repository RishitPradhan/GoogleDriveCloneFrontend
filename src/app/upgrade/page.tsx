"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Shield, CheckCircle2, ArrowRight } from "lucide-react";
import React from "react";

export default function UpgradePage() {
  const { plan, isAuthenticated, upgradePlan } = useAuth();
  const router = useRouter();

  const goCheckout = (selected: "pro" | "business") => {
    router.push(`/checkout?plan=${selected}`);
  };

  const switchToFree = async () => {
    try {
      await upgradePlan('free');
      router.push('/checkout/success?plan=free');
    } catch (e) {
      // no-op demo
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Premium hero */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] bg-blue-500/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 shadow-lg mb-6">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Unlock Premium Cloud Storage
            </h1>
            <p className="text-muted-foreground mt-4 text-lg">
              Faster uploads, more storage, advanced sharing, and priority support.
              Your current plan: <span className="font-semibold text-foreground">{plan.toUpperCase()}</span>
            </p>
            <div className="mt-6">
              {isAuthenticated ? (
                <Link href="#plans" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-white shadow hover:opacity-90 transition">
                  See Plans <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link href="/auth/login" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-white shadow hover:opacity-90 transition">
                  Log in to upgrade <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>

          {/* Highlights */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {["2000 GB storage", "Priority Support", "Advanced Sharing"].map((f) => (
              <div key={f} className="glass-card p-6 flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground/80">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="plans" className="container mx-auto px-4 pb-24">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Free */}
          <PlanCard
            title="Free"
            price="₹0"
            period="/mo"
            highlight="Basic storage for individuals"
            features={["15 GB storage", "Standard speed", "Basic sharing"]}
            ctaLabel={plan === "free" ? "Current Plan" : "Switch to Free"}
            disabled={plan === "free"}
            onClick={() => isAuthenticated ? switchToFree() : router.push('/auth/login')}
          />
          {/* Pro */}
          <PlanCard
            title="Pro"
            price="₹749"
            period="/mo"
            highlight="Best for power users"
            featured
            features={["200 GB storage", "Faster uploads", "Advanced sharing", "Priority support"]}
            ctaLabel={plan === "pro" ? "Current Plan" : "Upgrade to Pro"}
            disabled={!isAuthenticated || plan === "pro"}
            onClick={() => goCheckout("pro")}
          />
          {/* Business */}
          <PlanCard
            title="Business"
            price="₹1,499"
            period="/mo"
            highlight="Teams and heavy workloads"
            features={["2 TB storage", "Team sharing", "SAML/SSO (demo)", "Priority support"]}
            ctaLabel={plan === "business" ? "Current Plan" : "Upgrade to Business"}
            disabled={!isAuthenticated || plan === "business"}
            onClick={() => goCheckout("business")}
          />
        </div>
      </section>
    </div>
  );
}

function PlanCard({
  title,
  price,
  period,
  highlight,
  features,
  featured,
  onClick,
  ctaLabel,
  disabled,
}: {
  title: string;
  price: string;
  period: string;
  highlight: string;
  features: string[];
  featured?: boolean;
  ctaLabel: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`relative glass-card p-6 rounded-2xl ${featured ? "ring-2 ring-primary" : ""} ${
        disabled ? "opacity-90" : "cursor-pointer hover:shadow-md transition-shadow"
      }`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => { if (!disabled) onClick(); }}
      onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); } }}
    >
      {featured && (
        <span className="absolute -top-3 left-6 text-xs px-2 py-1 rounded bg-primary text-white shadow">Popular</span>
      )}
      <div className="flex items-baseline gap-2">
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <p className="text-muted-foreground mt-1">{highlight}</p>
      <div className="mt-4 flex items-end gap-1">
        <span className="text-4xl font-extrabold">{price}</span>
        <span className="text-muted-foreground">{period}</span>
      </div>
      <ul className="mt-6 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        disabled={disabled}
        onClick={onClick}
        className={`mt-6 w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg ${
          disabled
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-gradient-to-r from-primary to-blue-600 text-white shadow hover:opacity-95"
        }`}
      >
        {ctaLabel} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
