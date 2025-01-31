import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat | Document AI",
  description: "Chat with your documents using AI",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 