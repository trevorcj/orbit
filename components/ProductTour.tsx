"use client";

import { useEffect, useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function startOrbitProductTour() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: "rgba(11, 19, 32, 0.75)",
    stagePadding: 6,
    stageRadius: 10,
    popoverClass: "orbit-driver-popover",
    nextBtnText: "Next →",
    prevBtnText: "← Back",
    doneBtnText: "Get Started 🚀",
    steps: [
      {
        element: "#tour-welcome",
        popover: {
          title: "👋 Welcome to Orbit!",
          description:
            "Orbit is your recurring subscription billing engine and automated payout infrastructure. Let's take a quick 1-minute tour to help you get started.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#tour-metrics",
        popover: {
          title: "📈 Revenue & Financial Overview",
          description:
            "Track your Monthly Recurring Revenue (MRR), total gross revenue, active subscribers, and payment retries in real-time.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: isMobile ? undefined : "#tour-nav-products",
        popover: {
          title: "📦 Products & Pricing Plans",
          description:
            "Define your products and recurring pricing tiers (Monthly, Yearly, Daily, Custom days, or Free Trials) with instant hosted checkout links.",
          side: isMobile ? "bottom" : "right",
          align: "start",
        },
      },
      {
        element: isMobile ? undefined : "#tour-nav-subscriptions",
        popover: {
          title: "🔄 Subscription Lifecycle & Retries",
          description:
            "Monitor subscriber health. Orbit automatically handles 4-attempt card retries, past due grace periods, dunning notices, and auto-cancellations.",
          side: isMobile ? "bottom" : "right",
          align: "start",
        },
      },
      {
        element: isMobile ? undefined : "#tour-nav-customers",
        popover: {
          title: "👥 Customer Database & Billing Portals",
          description:
            "View all customer records and their unique self-service Customer Portal links where they can view invoice receipts anytime.",
          side: isMobile ? "bottom" : "right",
          align: "start",
        },
      },
      {
        element: isMobile ? undefined : "#tour-nav-payments",
        popover: {
          title: "💳 Payments & Automated Split Payouts",
          description:
            "Every subscription payment is split automatically: 95% net revenue is swept directly into your settlement bank account daily at ~5:40 AM.",
          side: isMobile ? "bottom" : "right",
          align: "start",
        },
      },
      {
        element: isMobile ? undefined : "#tour-nav-settings",
        popover: {
          title: "⚙️ Settlement Bank & Developer API",
          description:
            "Link your Nigerian NUBAN bank account for automated payouts, generate API keys, configure webhook endpoints, and customize branding.",
          side: isMobile ? "bottom" : "right",
          align: "start",
        },
      },
      {
        element: isMobile ? undefined : "#tour-nav-docs",
        popover: {
          title: "📚 Developer Documentation",
          description:
            "Explore our REST API v1 reference, HMAC webhook signature verification guides, and copy-paste code snippets for Next.js & Node.js.",
          side: isMobile ? "bottom" : "right",
          align: "start",
        },
      },
    ],
    onDestroyed: () => {
      try {
        localStorage.setItem("orbit_tour_completed", "true");
      } catch {}
    },
  });

  driverObj.drive();
}

export default function ProductTour() {
  const triggerAutoTour = useCallback(() => {
    try {
      const tourCompleted = localStorage.getItem("orbit_tour_completed");
      if (!tourCompleted) {
        // Give the DOM 800ms to settle before starting the tour
        const timer = setTimeout(() => {
          startOrbitProductTour();
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  useEffect(() => {
    triggerAutoTour();
  }, [triggerAutoTour]);

  return null;
}
