'use client';

export function SignOutButton({ className = '' }: { className?: string }) {
  return (
    <button
      onClick={async () => {
        const { signOut } = await import('next-auth/react');
        await signOut({ callbackUrl: '/login' });
      }}
      className={'text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white ' + className}
    >
      خروج
    </button>
  );
}
