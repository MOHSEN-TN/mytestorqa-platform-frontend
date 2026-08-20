import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
          <p className="text-sm text-gray-500">Chargement...</p>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
