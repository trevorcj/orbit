import { Metadata } from "next";
import DocsClient from "@/components/docs/DocsClient";

export const metadata: Metadata = {
  title: "API Reference & Documentation — Orbit",
  description:
    "Developer documentation, REST API reference, and integration guides for Orbit recurring billing infrastructure",
};

export default function DocsPage() {
  return <DocsClient />;
}