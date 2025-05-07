'use client'; // Add this directive for client-side functionality

import { useEffect, useState } from 'react';
import { wixClientServer } from "@/lib/wixClientServer";
import Image from "next/image";
import Link from "next/link";
import { collections } from '@wix/stores';

interface Collection {
  _id: string;
  name: string;
  slug: string;
  media?: {
    mainMedia?: {
      image?: {
        url: string;
      };
    };
  };
}

const CategoryList = () => {
  const [categories, setCategories] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const wixClient = await wixClientServer();
        if (!wixClient) {
          throw new Error('Failed to initialize Wix client');
        }

        const result = await wixClient.collections.queryCollections().find();
        setCategories(result.items || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err instanceof Error ? err.message : 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="px-4 overflow-x-scroll scrollbar-hide">
        <div className="flex gap-4 md:gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/4 xl:w-1/6">
              <div className="relative bg-slate-100 w-full h-96 animate-pulse"></div>
              <div className="mt-8 h-6 bg-slate-100 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 text-red-500">
        Error loading categories: {error}
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div className="px-4 text-gray-500">
        No categories found
      </div>
    );
  }

  return (
    <div className="px-4 overflow-x-scroll scrollbar-hide">
      <div className="flex gap-4 md:gap-8">
        {categories.map((item) => (
          <Link
            href={`/list?cat=${item.slug}`}
            className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/4 xl:w-1/6 hover:opacity-80 transition-opacity"
            key={item._id}
            prefetch={false}
          >
            <div className="relative bg-slate-100 w-full h-96">
              <Image
                src={item.media?.mainMedia?.image?.url || "/cat.png"}
                alt={item.name || "Category image"}
                fill
                sizes="20vw"
                className="object-cover"
                priority={false}
              />
            </div>
            <h1 className="mt-8 font-light text-xl tracking-wide">
              {item.name}
            </h1>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;