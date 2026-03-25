"use client";

import React from 'react';
import { HeroScrollDemo } from '../../components/landing/HeroScroll';

export default function ScrollShowcasePage() {
    return (
        <main className="min-h-screen w-full">
            {/* Toggle or selector */}
            <section className="fixed top-4 right-4 z-50">
                <div className="bg-white/90 dark:bg-black/90 backdrop-blur rounded-lg p-3 shadow-lg border">
                    <p className="text-xs font-medium mb-2">Animation Style:</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => document.getElementById('original')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Original
                        </button>
                        <button
                            onClick={() => document.getElementById('experimental')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                        >
                            Experimental
                        </button>
                    </div>
                </div>
            </section>

            {/* Original ContainerScroll version */}
            <section id="original" className="relative">
                <div className="absolute top-4 left-4 z-10 bg-blue-500/90 text-white px-3 py-1 rounded text-xs font-medium">
                    Original 3D Card Animation
                </div>
                <HeroScrollDemo />
            </section>

            {/* Experimental multi-section version */}
            <section id="experimental" className="relative">
                <div className="absolute top-4 left-4 z-10 bg-purple-500/90 text-white px-3 py-1 rounded text-xs font-medium">
                    Experimental Multi-Section
                </div>
            </section>
        </main>
    );
}
