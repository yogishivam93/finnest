import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="text-sm text-gray-600">
        Enter your email. We’ll send you a one-time link to sign in.
      </p>
      <AuthForm />
    </div>
  );
}
