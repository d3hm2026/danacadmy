'use client';

export function SignOutButton() {
  return (
    <button
      onClick={async () => {
        const { signOut } = await import('next-auth/react');
        await signOut({ callbackUrl: '/login' });
      }}
      className="text-sm text-gray-500 hover:text-gray-700"
    >
      خروج
    </button>
  );
}
