import AcceptForm from "./AcceptForm";

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-surface-1 p-6 shadow-sm">
        <h1 className="text-lg font-semibold tracking-tight">
          Activate your admin account
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Set a password to finish joining the SpeakUp admin team.
        </p>
        <div className="mt-5">
          <AcceptForm token={token} />
        </div>
      </div>
    </div>
  );
}
