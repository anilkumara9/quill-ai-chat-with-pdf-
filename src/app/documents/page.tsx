"use client";

import { Suspense } from "react";
import { DocumentList } from "@/components/document-list";
import { DocumentCategories } from "@/components/document-categories";
import { Button } from "@/components/ui/button";
import { Upload, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-muted/10 rounded-lg w-1/4 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-muted/10 rounded-lg animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20">
      <div className="container max-w-7xl mx-auto p-6 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.7, 
                ease: [0.6, -0.05, 0.01, 0.99],
                delay: 0.2 
              }}
              className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/90 to-primary/70"
            >
              Your Documents
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-muted-foreground/90 mt-2 text-lg"
            >
              Upload, manage, and chat with your documents
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.4 }}
          >
            <Button 
              onClick={() => router.push("/documents/upload")}
              variant="modern"
              size="lg"
              className="gap-2 shadow-xl hover:shadow-primary/20 transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
            >
              <Plus className="h-5 w-5" />
              New Document
            </Button>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.6, 
            delay: 0.4,
            ease: "easeOut" 
          }}
          className="border-b border-border/40 pb-4 backdrop-blur-sm"
        >
          <Suspense fallback={
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-10 bg-muted/10 rounded-lg w-full animate-pulse" 
            />
          }>
            <DocumentCategories />
          </Suspense>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.6, 
            delay: 0.5,
            ease: "easeOut"
          }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/2 to-muted/5 pointer-events-none" />
          <Suspense fallback={<LoadingState />}>
            <DocumentList />
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
}
