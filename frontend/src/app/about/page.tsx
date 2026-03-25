import ClientNavbarWrapper from "../ClientNavbarWrapper";
import { redirect } from 'next/navigation';

export default async function AboutPage() {
    // Optionally inspect cookies to redirect authenticated users

    return (
        <main className="relative flex flex-col min-h-screen">
            <ClientNavbarWrapper />

            {/* Hero Section */}
            <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                        About Timeline
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                        Empowering teams to build, collaborate, and deliver exceptional projects with intelligent timeline management.
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                        Our Mission
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Simplify Project Management
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                We believe project management should be intuitive, collaborative, and efficient.
                                Timeline transforms complex project workflows into clear, actionable steps.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Empower Teams
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Every team member deserves tools that make them more productive.
                                Our platform fosters collaboration while maintaining clarity and accountability.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
                        Our Values
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Innovation
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Continuously evolving our platform with cutting-edge technology and user-centered design.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Collaboration
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Building tools that bring teams together, breaking down silos and fostering meaningful connections.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Reliability
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Providing a stable, secure platform that teams can depend on for their most critical projects.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
                        Built for Modern Teams
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Remote-First Design
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Built from the ground up for distributed teams, with real-time collaboration
                                and seamless communication tools that bridge geographical gaps.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Scalable Architecture
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Whether you're a startup team of 5 or an enterprise with 5000+ users,
                                our platform scales with your needs and grows with your organization.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        Ready to Get Started?
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                        Join thousands of teams already using Timeline to deliver exceptional projects.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/sign-up"
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                            Start Free Trial
                        </a>
                        <a
                            href="/features"
                            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                        >
                            Explore Features
                        </a>
                    </div>
                </div>
            </section>
        </main>
    );
}

