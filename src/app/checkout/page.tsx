"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { CreditCard, ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, plan, upgradePlan } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlan = (params.get("plan") as "pro" | "business") || "pro";

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(`/checkout?plan=${selectedPlan}`)}`);
    }
  }, [isAuthenticated, router, selectedPlan]);

  const summary = useMemo(() => {
    const config = {
      pro: { name: "Pro", price: 749, storage: "200 GB" },
      business: { name: "Business", price: 1499, storage: "2 TB" },
    } as const;
    const c = config[selectedPlan];
    return c;
  }, [selectedPlan]);

  const handlePay = async () => {
    setError(null);
    setProcessing(true);
    try {
      // Simulate payment processing delay
      await new Promise((res) => setTimeout(res, 1300));
      // Demo: mark plan as upgraded locally via AuthContext
      await upgradePlan(selectedPlan);
      router.push(`/checkout/success?plan=${selectedPlan}`);
    } catch (e: any) {
      setError(e?.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/upgrade" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to plans
        </Link>

        <div className="glass-card mt-4 p-6 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Checkout</h1>
              <p className="text-sm text-muted-foreground">Secure payment via demo processor</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            {/* Order Summary */}
            <div className="p-4 border rounded-xl">
              <h2 className="font-semibold mb-3">Order Summary</h2>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{summary.name}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Storage</span>
                <span className="font-medium">{summary.storage}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Billing</span>
                <span className="font-medium">Monthly</span>
              </div>
              <div className="border-t my-3" />
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{summary.price.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">₹0</span>
              </div>
              <div className="flex items-center justify-between py-2 text-lg font-extrabold">
                <span>Total</span>
                <span>₹{summary.price.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payment Form (demo) */}
            <div className="p-4 border rounded-xl">
              <h2 className="font-semibold mb-3">Payment Details</h2>
              <div className="space-y-3">
                <input placeholder="Cardholder Name" className="w-full h-11 rounded-lg border px-3 bg-background/50" />
                <input placeholder="Card Number" className="w-full h-11 rounded-lg border px-3 bg-background/50" />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="MM/YY" className="h-11 rounded-lg border px-3 bg-background/50" />
                  <input placeholder="CVC" className="h-11 rounded-lg border px-3 bg-background/50" />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  onClick={handlePay}
                  disabled={processing || (plan === selectedPlan)}
                  className={`w-full h-11 rounded-lg inline-flex items-center justify-center gap-2 ${
                    processing || plan === selectedPlan
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-gradient-to-r from-primary to-blue-600 text-white shadow hover:opacity-95"
                  }`}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>Pay ₹{summary.price.toLocaleString('en-IN')} Now</>
                  )}
                </button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <ShieldCheck className="w-4 h-4" /> Your payment is securely processed (demo)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
