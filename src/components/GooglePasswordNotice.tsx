'use client';

export default function GooglePasswordNotice({
  provider,
  hasPassword,
}: {
  provider?: string;
  hasPassword?: boolean;
}) {
  if (provider !== 'google') return null;
  if (hasPassword) return null;

  return (
    <div className="mb-6 rounded-lg border border-yellow-500 bg-yellow-900/30 p-4 text-yellow-300">
      <strong>Security Notice</strong>

      <p className="mt-2 text-sm">
        You registered using Google authentication.
        Please set a password for full access.
      </p>
    </div>
  );
}