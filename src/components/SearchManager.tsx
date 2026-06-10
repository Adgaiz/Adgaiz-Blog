'use client';

import { useState } from 'react';
import Navbar from './Navbar';
import SearchModal from './SearchModal';

interface Post {
  slug: string;
  title: string;
  excerpt: string;
}

export default function SearchManager({ posts }: { posts: Post[] }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <Navbar onSearchOpen={() => setIsSearchOpen(true)} />
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        posts={posts} 
      />
    </>
  );
}
