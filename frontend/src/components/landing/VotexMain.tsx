"use client";
import React, { lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// Placeholder component since vortex was removed
const VortexPlaceholder = () => (
  <div className="w-full h-96 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
    <div className="text-white text-center">
      <h3 className="text-2xl font-bold mb-2">Interactive Animation</h3>
      <p className="text-lg opacity-90">Animation component removed</p>
    </div>
  </div>
);

export function VortexDemo() {
  return (
    <div className="w-full py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Experience the Power of{" "}
            <span className="text-blue-600">Timeline</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover how our platform transforms the way you manage projects and
            collaborate with your team.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <VortexPlaceholder />
        </div>

        <div className="text-center mt-12">
          <Button size="lg" className="text-lg px-8 py-4">
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
