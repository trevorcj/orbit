"use client";

import { useEffect, useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function startOrbitProductTour() {
  if (typeof window === "undefined") return;

  // If not on the main dashboard, navigate to /dashboard first so tour targets exist
  if (window.location.pathname !== "/dashboard") {
    window.location.href = "/dashboard?tour=true";
    return;
  }

  const isMobile = window.innerWidth < 768;

  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: "rgba(0, 0, 0, 0.6)",
    stagePadding: 6,
    stageRadius: 10,
    popoverClass: "orbit-driver-popover",
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Complete Tour",
    steps: [
      {
        element: "#tour-welcome",
        popover: {
          title: "Welcome to Orbit",
          description:
            "Orbit provides recurring subscription billing, tokenized renewal retries, and automated split payouts for modern businesses.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#tour-metrics",
        popover: {
          title: "Revenue & Metrics Overview",
          description:
            "Track your Monthly Recurring Revenue (MRR), total gross revenue, active subscribers, and payment retries in real-time.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: isMobile ? undefined : "#tour-nav-products",
        popover: {
          title: "Products & Pricing Plans",
          description:
            "Define your products and recurring pricing plans (Monthly, Yearly, Daily, Custom days, or Free Trials) with instant hosted checkout links.",
          side: isMobile ? "bottom" : "right",
          align: "start",
        },
      },
      {
        element: isMobile ? undefined : "#tour-nav-subscriptions",
        popover: {
          title: "Subscription Lifecycle & Retries",
          description:
            "Monitor subscriber health. Orbit automatically handles 4-attempt card retries, past-due grace periods, dunning notices, and auto-cancellations.",
          side: isMobile ? "bottom" : "right",
          align: "start",
        },
      },
      {
        element: isMobile ? undefined : "#tour-nav-customers",
        popover: {
          title: "Customer Database & Portals",
          description:
            "View all customer records and their unique self-service Customer Portal links where they can view invoice receipts anytime.",
          side: isMobile ? "bottom" : "right",
          align: "start",
        },
      },
      {
        element: isMobile ? undefined : "#tour-nav-payments",
        popover: {
          title: "Payments & Split Settlements",
          description:
            "Every subscription payment is split automatically: 95% net revenue is swept directly into your settlement bank account daily.",
          side: isMobile ? "bottom" : "right",
          align: "start",
        },
      },
      {
        element: isMobile ? undefined : "#tour-nav-settings",
        popover: {
          title: "Settlement Bank & API Keys",
          description:
            "Link your settlement bank account for automated payouts, generate API keys, configure webhook endpoints, and customize workspace branding.",
          side: isMobile ? "bottom" : "right",
          align: "start",
        },
      },
      {
        element: isMobile ? undefined : "#tour-nav-docs",
        popover: {
          title: "Developer Documentation",
          description:
            "Explore our REST API reference, HMAC webhook signature verification guides, and copy-paste code snippets for your frontend and backend.",
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
      const urlParams = new URLSearchParams(window.location.search);
      const forceTour = urlParams.get("tour") === "true";
      const tourCompleted = localStorage.getItem("orbit_tour_completed");

      if (forceTour || (!tourCompleted && window.location.pathname === "/dashboard")) {
        if (forceTour) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        const timer = setTimeout(() => {
          startOrbitProductTour();
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  useEffect(() => {
    triggerAutoTour();
  }, [triggerAutoTour]);

  return null;
}
