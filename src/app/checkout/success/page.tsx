"use client";

import React, { useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Home, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function CheckoutSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const plan = (params.get("plan") as "free" | "pro" | "business") || "pro";
  const { plan: currentPlan, upgradePlan } = useAuth();

  // Ensure AuthContext reflects the plan from the success URL (idempotent)
  useEffect(() => {
    if (plan && currentPlan !== plan) {
      upgradePlan(plan).catch(() => {});
    }
  }, [plan, currentPlan, upgradePlan]);

  const summary = useMemo(() => {
    const config = {
      free: { name: "Free", storage: "15 GB" },
      pro: { name: "Pro", storage: "200 GB" },
      business: { name: "Business", storage: "2 TB" },
    } as const;
    return config[plan] ?? { name: "Pro", storage: "200 GB" };
  }, [plan]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Payment successful</h1>
        <p className="mt-2 text-muted-foreground">You're now on the {summary.name} plan. Enjoy up to {summary.storage} of storage.</p>

        <div className="mt-8 space-y-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg h-11 px-5 bg-primary text-primary-foreground hover:opacity-95"
          >
            <Home className="w-4 h-4" /> Go to Dashboard
          </Link>
          <div>
            <button
              onClick={() => router.push("/upgrade")}
              className="inline-flex items-center gap-2 rounded-lg h-11 px-5 border hover:bg-muted/50"
            >
              <Crown className="w-4 h-4" /> View Plans
            </button>
          </div>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">A confirmation email would be sent in a real integration.</p>
      </div>
    </div>
  );
}
