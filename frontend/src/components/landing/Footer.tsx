'use client';

import Link from "next/link";
import { Github, Twitter, Linkedin, Mail, ArrowRight, Shield, Zap, Users, Globe, Heart } from "lucide-react";

export function Footer() {
    return (
        <footer className="relative bg-transparent border-t border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-indigo-400/10 to-pink-400/10 rounded-full blur-2xl"></div>

            <div className="relative text-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 text-left">
                    {/* Company Info - Enhanced */}
                    {/* <div className="lg:col-span-1"> */}
                    {/* <div className="flex items-center space-x-2 mb-6">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">T</span>
                            </div>
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                                Timeline
                            </h3>
                        </div> */}
                    {/* <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md leading-relaxed">
                            Transform your project management with biometric security, real-time collaboration,
                            and intelligent analytics. One platform, infinite possibilities.
                        </p> */}

                    {/* Feature Highlights */}
                    {/* <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <Shield className="h-4 w-4 text-green-500" />
                                <span>Biometric Auth</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <Zap className="h-4 w-4 text-yellow-500" />
                                <span>Real-time Sync</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <Users className="h-4 w-4 text-blue-500" />
                                <span>Team Collaboration</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <Globe className="h-4 w-4 text-purple-500" />
                                <span>Cross-platform</span>
                            </div>
                        </div> */}


                    {/* </div> */}

                    {/* Product Links */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-6 uppercase tracking-wider">
                            Product
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="#features"
                                    className="group text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
                                >
                                    <span>Features</span>
                                    <ArrowRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/sign-up"
                                    className="group text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
                                >
                                    <span>Get Started</span>
                                    <ArrowRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/sign-in"
                                    className="group text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
                                >
                                    <span>Sign In</span>
                                    <ArrowRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-6 uppercase tracking-wider">
                            About
                        </h4>
                        <ul className="space-y-3">

                            <li>
                                <Link
                                    href="#contact"
                                    className="group text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
                                >
                                    <span>Contact</span>
                                    <ArrowRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/about"
                                    className="group text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
                                >
                                    <span>About Us</span>
                                    <ArrowRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support & Legal */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-6 uppercase tracking-wider">
                            Support
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="#help"
                                    className="group text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
                                >
                                    <span>Help Center</span>
                                    <ArrowRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#docs"
                                    className="group text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
                                >
                                    <span>Documentation</span>
                                    <ArrowRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Newsletter Signup */}
                {/* <div className="mt-16 pt-8 border-t border-gray-200/50 dark:border-gray-800/50">
                    <div className="max-w-2xl mx-auto text-center">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Stay updated with Timeline
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Get the latest features, updates, and project management tips delivered to your inbox.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium flex items-center justify-center">
                                Subscribe
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </button>
                        </div>
                    </div>
                </div> */}

                {/* Bottom Section */}
                <div className="mt-12 pt-8 border-t border-gray-200/50 dark:border-gray-800/50">
                    <div className="flex flex-col lg:flex-col justify-center items-center gap-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <p>© {new Date().getFullYear()} Timeline. All rights reserved.</p>
                            <div className="flex items-center gap-1 text-xs">
                                <span>Made with</span>
                                <Heart className="h-3 w-3 text-red-500" />
                                <Link href="https://iamrakesh.codes" className="hover:underline">
                                    <span>By Rakesh Singh</span>
                                </Link>
                            </div>
                        </div>
                        <div className="flex space-x-4">
                            <Link
                                href="https://github.com/RakeshSingh/timeline-readme"
                                className="group p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200"
                                aria-label="GitHub"
                            >
                                <Github className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                            </Link>
                            <Link
                                href="https://twitter.com/timeline"
                                className="group p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200"
                                aria-label="Twitter"
                            >
                                <Twitter className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                            </Link>
                            <Link
                                href="https://linkedin.com/in/rakeshsingh61"
                                className="group p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200"
                                aria-label="LinkedIn"
                            >
                                <Linkedin className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                            </Link>
                            <Link
                                href="mailto:hello@timeline.tech"
                                className="group p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200"
                                aria-label="Email"
                            >
                                <Mail className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                            </Link>
                        </div>
                        {/* <div className="flex flex-col gap-6 text-sm">
                            <Link
                                href="#terms"
                                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                Terms of Service
                            </Link>
                            <Link
                                href="#privacy"
                                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                Privacy Policy
                            </Link>
                            <Link
                                href="#cookies"
                                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                Cookie Policy
                            </Link>
                            <Link
                                href="#gdpr"
                                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                GDPR
                            </Link>
                        </div> */}
                        {/* Social Links - Enhanced */}

                    </div>
                </div>

                {/* Friendly Greeting */}
                <div className="mt-8 pt-6 border-t border-gray-200/30 dark:border-gray-800/30">
                    <div className="text-center">
                        {/* <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200/50 dark:border-blue-800/50">
                            <div className="flex items-center gap-2">
                                {/* <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Thanks for checking out Timeline!
                                </span>
                            </div>
                        </div> */}
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            I hope you love using Timeline as much as I loved building it
                            <br className="hidden sm:block" />
                            <span className="text-blue-600 dark:text-blue-400 font-medium">Ready to transform your project management?</span>
                            <Link href="/sign-up" className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
                                Let's get started! →
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
