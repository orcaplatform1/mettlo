'use client';
import { useState } from 'react';
import { FollowButton, FollowStats } from './follow-button';

interface Props {
  username: string;
  initialFollowing: boolean;
  followersCount: number;
  followingCount: number;
  showFollowButton: boolean;
}

export function FollowSection({ username, initialFollowing, followersCount, followingCount, showFollowButton }: Props) {
  const [localFollowers, setLocalFollowers] = useState(followersCount);

  const handleFollowChange = (isFollowing: boolean) => {
    setLocalFollowers((c) => isFollowing ? c + 1 : Math.max(0, c - 1));
  };

  return (
    <div className="row row-wrap" style={{ gap: 10, alignItems: 'center' }}>
      {showFollowButton && (
        <FollowButton username={username} initialFollowing={initialFollowing} onFollowChange={handleFollowChange} />
      )}
      <FollowStats username={username} followersCount={localFollowers} followingCount={followingCount} />
    </div>
  );
}
