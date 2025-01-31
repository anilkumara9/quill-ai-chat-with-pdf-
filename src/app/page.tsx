"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, LazyMotion, domAnimation, m } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  FileText,
  MessageSquare,
  Share2,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Shield,
  Zap,
  BookOpen,
  Brain,
} from "lucide-react";

const features = [
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Document Analysis",
    description: "Upload and analyze documents with advanced AI capabilities",
    ariaLabel: "Learn more about document analysis feature",
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Interactive Chat",
    description: "Chat with your documents using natural language",
    ariaLabel: "Learn more about interactive chat feature",
  },
  {
    icon: <Share2 className="w-6 h-6" />,
    title: "Easy Sharing",
    description: "Share documents and insights with team members securely",
    ariaLabel: "Learn more about document sharing feature",
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: "AI-Powered Insights",
    description: "Extract key information and generate summaries automatically",
    ariaLabel: "Learn more about AI insights feature",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Secure & Private",
    description: "Enterprise-grade security for your sensitive documents",
    ariaLabel: "Learn more about security features",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Fast Processing",
    description: "Quick analysis and real-time chat responses",
    ariaLabel: "Learn more about processing speed",
  },
];

const benefits = [
  "Advanced AI-powered document analysis",
  "Real-time chat with contextual understanding",
  "Secure document storage and sharing",
  "Intuitive user interface",
  "Fast and accurate responses",
  "Enterprise-grade security",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function Home() {
  const { isSignedIn } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const handleHoverChange = useCallback((value: boolean) => {
    setIsHovered(value);
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex flex-col min-h-screen">
        {/* Hero Section */}
        <section 
          className="relative py-20 lg:py-32 overflow-hidden"
          aria-label="Hero section"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
          <div
            className="absolute inset-0 bg-grid-white/10 bg-grid-16"
            style={{
              maskImage: "linear-gradient(to bottom, transparent, black, transparent)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent, black, transparent)",
            }}
            aria-hidden="true"
          />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50 mb-6">
                  Chat with Your Documents Using AI
                </h1>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  Transform the way you interact with documents. Upload, analyze, and chat
                  with your PDFs using state-of-the-art AI technology.
                </p>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link 
                  href={isSignedIn ? "/documents" : "/sign-up"}
                  aria-label={isSignedIn ? "Go to documents" : "Sign up"}
                >
                  <Button
                    size="lg"
                    className="relative group w-full sm:w-auto"
                    onMouseEnter={() => handleHoverChange(true)}
                    onMouseLeave={() => handleHoverChange(false)}
                    aria-label="Get started with Quill"
                  >
                    <span className="mr-2">Get Started</span>
                    <ArrowRight
                      className={`w-4 h-4 transition-transform duration-300 ${
                        isHovered ? "translate-x-1" : ""
                      }`}
                    />
                    <m.div
                      className="absolute -inset-1 rounded-lg bg-primary/20"
                      animate={{
                        scale: isHovered ? 1.05 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      aria-hidden="true"
                    />
                  </Button>
                </Link>
                <Link 
                  href="/sign-in"
                  aria-label="Learn more about our features"
                >
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Learn More
                  </Button>
                </Link>
              </m.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section 
          className="py-20 bg-muted/50"
          aria-label="Features section"
        >
          <div className="container mx-auto px-4">
            <m.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {features.map((feature, index) => (
                <m.div
                  key={feature.title}
                  variants={itemVariants}
                  className="relative group"
                  role="article"
                  aria-label={feature.ariaLabel}
                >
                  <div 
                    className="absolute -inset-px bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500"
                    aria-hidden="true"
                  />
                  <div className="relative p-6 bg-background rounded-lg border transition duration-300 group-hover:border-primary/50">
                    <div 
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4"
                      aria-hidden="true"
                    >
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </m.div>
              ))}
            </m.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section 
          className="py-20"
          aria-label="Benefits section"
        >
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose Quill?</h2>
              <p className="text-muted-foreground">
                Experience the future of document interaction with our powerful features
              </p>
            </div>

            <m.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            >
              {benefits.map((benefit, index) => (
                <m.div
                  key={benefit}
                  variants={itemVariants}
                  className="flex items-center gap-3 p-4 rounded-lg bg-muted/50"
                  role="listitem"
                >
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                  <span>{benefit}</span>
                </m.div>
              ))}
            </m.div>
          </div>
        </section>

        {/* CTA Section */}
        <section 
          className="py-20 bg-muted"
          aria-label="Call to action section"
        >
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl font-bold mb-4">
                  Ready to Transform Your Document Workflow?
                </h2>
                <p className="text-muted-foreground mb-8">
                  Join thousands of users who are already experiencing the future of
                  document interaction.
                </p>
                <Link 
                  href={isSignedIn ? "/documents" : "/sign-up"}
                  aria-label={isSignedIn ? "Go to documents" : "Sign up now"}
                >
                  <Button size="lg" className="group">
                    Get Started Now
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </m.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer 
          className="py-8 border-t"
          role="contentinfo"
        >
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" aria-hidden="true" />
                <span className="font-semibold">Quill</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Quill. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </LazyMotion>
  );
}
