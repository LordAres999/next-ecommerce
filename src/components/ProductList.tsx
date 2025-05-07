'use client'; // Added for client-side interactivity

import { wixClientServer } from "@/lib/wixClientServer";
import { products } from "@wix/stores";
import Image from "next/image";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import Pagination from "./Pagination";
import { useEffect, useState } from "react";

const PRODUCT_PER_PAGE = 8;

interface ProductListProps {
  categoryId: string;
  limit?: number;
  searchParams?: {
    name?: string;
    type?: string;
    min?: number;
    max?: number;
    page?: string;
    sort?: string;
    cat?: string;
  };
}

const ProductList = ({
  categoryId,
  limit,
  searchParams = {},
}: ProductListProps) => {
  const [products, setProducts] = useState<products.Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Initializing Wix client...");
        const wixClient = await wixClientServer();
        
        if (!wixClient) {
          throw new Error("Failed to initialize Wix client");
        }

        console.log("Building product query...");
        const productQuery = wixClient.products
          .queryProducts()
          .startsWith("name", searchParams?.name || "")
          .eq("collectionIds", categoryId)
          .hasSome(
            "productType",
            searchParams?.type ? [searchParams.type] : ["physical", "digital"]
          )
          .gt("priceData.price", searchParams?.min || 0)
          .lt("priceData.price", searchParams?.max || 999999)
          .limit(limit || PRODUCT_PER_PAGE)
          .skip(
            searchParams?.page
              ? parseInt(searchParams.page) * (limit || PRODUCT_PER_PAGE)
              : 0
          );

        if (searchParams?.sort) {
          const [sortType, sortBy] = searchParams.sort.split(" ");
          if (sortType === "asc") {
            productQuery.ascending(sortBy);
          } else if (sortType === "desc") {
            productQuery.descending(sortBy);
          }
        }

        console.log("Executing product query...");
        const res = await productQuery.find();
        console.log("Query results:", res);

        if (!res.items || res.items.length === 0) {
          console.warn("No products found for query");
          setProducts([]);
        } else {
          setProducts(res.items);
          setHasNext(res.hasNext());
          setHasPrev(res.hasPrev());
          setCurrentPage(res.currentPage || 0);
        }
      } catch (err) {
        console.error("ProductList Error:", {
          error: err,
          categoryId,
          searchParams,
          timestamp: new Date().toISOString()
        });
        setError(err instanceof Error ? err.message : "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, limit, searchParams]);

  if (loading) {
    return (
      <div className="mt-12 flex gap-x-8 gap-y-16 justify-between flex-wrap">
        {Array.from({ length: limit || PRODUCT_PER_PAGE }).map((_, i) => (
          <div key={i} className="w-full sm:w-[45%] lg:w-[22%] animate-pulse">
            <div className="bg-gray-200 h-80 rounded-md"></div>
            <div className="h-4 bg-gray-200 rounded mt-4"></div>
            <div className="h-4 bg-gray-200 rounded mt-2 w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-12 text-center w-full text-red-500">
        <p>Failed to load products.</p>
        <p className="text-sm mt-2">
          {process.env.NODE_ENV === "development" ? error : "Please try again later"}
        </p>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="mt-12 text-center w-full">
        No products found matching your criteria
      </div>
    );
  }

  return (
    <div className="mt-12 flex gap-x-8 gap-y-16 justify-between flex-wrap">
      {products.map((product) => (
        <Link
          href={`/${product.slug}`}
          className="w-full flex flex-col gap-4 sm:w-[45%] lg:w-[22%]"
          key={product._id}
          prefetch={false}
        >
          <div className="relative w-full h-80">
            <Image
              src={product.media?.mainMedia?.image?.url || "/product.png"}
              alt={product.name || "Product image"}
              fill
              sizes="25vw"
              className="absolute object-cover rounded-md z-10 hover:opacity-0 transition-opacity easy duration-500"
              priority={false}
            />
            {product.media?.items?.[1]?.image?.url && (
              <Image
                src={product.media.items[1].image.url}
                alt={product.name || "Product secondary image"}
                fill
                sizes="25vw"
                className="absolute object-cover rounded-md"
                priority={false}
              />
            )}
          </div>
          <div className="flex justify-between">
            <span className="font-medium">{product.name}</span>
            <span className="font-semibold">
              ${product.price?.price?.toFixed(2)}
            </span>
          </div>
          {product.additionalInfoSections && (
            <div
              className="text-sm text-gray-500"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  product.additionalInfoSections.find(
                    (section: any) => section.title === "shortDesc"
                  )?.description || ""
                ),
              }}
            />
          )}
          <button 
            className="rounded-2xl ring-1 ring-lama text-lama w-max py-2 px-4 text-xs hover:bg-lama hover:text-white"
            onClick={(e) => e.preventDefault()} // Prevent navigation
          >
            Add to Cart
          </button>
        </Link>
      ))}

      {(searchParams?.cat || searchParams?.name) && (
        <Pagination
          currentPage={currentPage}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      )}
    </div>
  );
};

export default ProductList;