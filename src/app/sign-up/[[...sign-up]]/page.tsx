import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp appearance={{
        elements: {
          formButtonPrimary: 
            "bg-primary text-primary-foreground hover:bg-primary/90",
          card: "bg-background",
        }
      }} />
    </div>
  );
}
