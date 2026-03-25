"use client";
import React from 'react';
import Link from 'next/link';
import { ContainerScroll } from '@/components/ui/animations/container-scroll-animation';
import { SpotlightReveal } from '@/components/ui/animations/spotlight-reveal';
import { MagneticCardGrid } from '@/components/ui/animations/magnetic-card-grid';
import ThemeSwitch from '@/components/Navbar/ThemeSwitch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/context/theme-context';
import {
  Palette,
  Eye,
  Zap,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Star,
  Heart,
  Shield,
  Users
} from 'lucide-react';

export default function ShowcasePage() {
  const { theme, resolvedTheme, isDark } = useTheme();

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground relative transition-all duration-500">
      {/* Enhanced Header with gradient */}
      <header className="w-full px-6 py-5 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80">
            <Palette className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold tracking-wide bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Dark Mode Showcase
          </h1>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
          <a href="#components" className="text-muted-foreground hover:text-foreground transition-colors">Components</a>
          <a href="#animations" className="text-muted-foreground hover:text-foreground transition-colors">Animations</a>
          <ThemeSwitch />
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Enhanced Hero Section */}
        <section className="relative py-20 px-6 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Badge variant="secondary" className="text-sm bg-primary/10 text-primary border-primary/20">
                {resolvedTheme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </Badge>
              <Badge variant="outline" className="text-sm">
                Theme: {theme}
              </Badge>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Beautiful Dark Mode
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Experience seamless theme switching with our comprehensive dark mode implementation.
              All components automatically adapt to your preferred theme with smooth transitions.
            </p>

            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Automatic switching
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                System preference
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Smooth transitions
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg">
                View Components
              </Button>
            </div>
          </div>
        </section>

        {/* Enhanced Components Section */}
        <section id="components" className="relative py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Theme-Aware Components</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Every component automatically adapts to light and dark themes with enhanced styling,
                better contrast, and smooth transitions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Enhanced Card Component */}
              <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Eye className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Card Component</CardTitle>
                  </div>
                  <CardDescription>
                    Automatically adapts to light and dark themes with enhanced shadows and borders
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" placeholder="Enter your email" className="bg-background/50" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="notifications" />
                    <Label htmlFor="notifications">Enable notifications</Label>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-primary to-primary/80">
                    Subscribe
                  </Button>
                </CardContent>
              </Card>

              {/* Enhanced Form Elements */}
              <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <Zap className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <CardTitle className="text-lg">Form Elements</CardTitle>
                  </div>
                  <CardDescription>
                    Inputs, buttons, and switches with enhanced theme support and focus states
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Enter your name" className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Input id="message" placeholder="Type your message" className="bg-background/50" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">Cancel</Button>
                    <Button className="flex-1 bg-gradient-to-r from-primary to-primary/80">Send</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Interactive Elements */}
              <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Sparkles className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <CardTitle className="text-lg">Interactive Elements</CardTitle>
                  </div>
                  <CardDescription>
                    Hover effects, badges, and buttons that work beautifully in both themes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default" className="bg-primary text-primary-foreground">Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge variant="outline">Outline</Badge>
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">Outline Button</Button>
                    <Button variant="ghost" className="w-full">Ghost Button</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Enhanced Features Section */}
        <section className="relative py-20 px-6 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Dark Mode Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Discover what makes our dark mode implementation special
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Star, title: "Enhanced Contrast", description: "Better readability in both themes" },
                { icon: Heart, title: "Smooth Transitions", description: "Seamless theme switching" },
                { icon: Shield, title: "System Integration", description: "Follows OS preferences" },
                { icon: Users, title: "Accessibility", description: "WCAG compliant color schemes" }
              ].map((feature, index) => (
                <Card key={index} className="text-center border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Animations Section */}
        <section id="animations" className="relative py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Theme-Aware Animations</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                All animations automatically adapt to your theme preference with enhanced visual effects
              </p>
            </div>

            <div className="space-y-20">
              <div>
                <h3 className="text-xl font-semibold mb-6 text-center">Container Scroll Animation</h3>
                <ContainerScroll titleComponent={<span>Immersive Scroll Canvas</span>}>
                  <div className="text-center py-10">
                    <p className="text-muted-foreground text-sm tracking-wide uppercase mb-6">Scroll showcase embed content</p>
                    <p className="text-muted-foreground max-w-md mx-auto text-xs leading-relaxed">
                      This animation automatically adapts to your theme preference.
                      Scroll to see the effect in action.
                    </p>
                  </div>
                </ContainerScroll>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-6 text-center">Spotlight Reveal</h3>
                <SpotlightReveal />
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-6 text-center">Magnetic Card Grid</h3>
                <MagneticCardGrid />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <footer className="mt-20 py-10 border-t border-border bg-muted/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-primary" />
            <span className="font-semibold">Theme System</span>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            All components automatically support both light and dark themes with enhanced styling
          </p>
          <p className="text-xs text-muted-foreground">
            Return <Link href="/" className="underline hover:text-foreground transition-colors">home</Link>.
          </p>
        </div>
      </footer>
    </div>
  );
}
