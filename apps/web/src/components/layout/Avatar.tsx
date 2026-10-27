import Image from 'next/image';
import type { AuthUser } from '@dzen/shared';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase())
    .join('');
}

export function Avatar({
  user,
  size = 96,
}: {
  user: Pick<AuthUser, 'name' | 'avatar'>;
  size?: number;
}) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.34 }}>
      {user.avatar ? (
        <Image
          className="avatar__image"
          src={user.avatar}
          alt={user.name}
          width={size}
          height={size}
          unoptimized
        />
      ) : (
        <span className="avatar__initials" aria-label={user.name}>
          {initials(user.name)}
        </span>
      )}
    </span>
  );
}
