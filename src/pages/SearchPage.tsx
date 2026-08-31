import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Link, ArrowRight, X } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [buyLink, setBuyLink] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  const products = useQuery(api.products.list, {
    search: searchQuery || undefined,
    category: selectedCategory || undefined,
  });

  const addItemFromLink = useMutation(api.cart.addItemFromLink);

  const handleFetchLink = async () => {
    if (!buyLink.trim()) return;
    try {
      const result = await addItemFromLink({ url: buyLink.trim() });
      toast.success(`${result.product.name} added to cart!`);
      setBuyLink("");
    } catch {
      toast.error("Could not find a product for that link");
    }
  };

  const categories = ["clothing", "shoes", "accessories"];

  return (
    <div className="pb-24">
      {/* Search Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 pt-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search for shoes, clothing, accessories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-0 h-11"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Buy Link */}
          <div className="flex gap-2 mt-3">
            <div className="relative flex-1">
              <Link className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Paste a product link..."
                value={buyLink}
                onChange={(e) => setBuyLink(e.target.value)}
                className="pl-9 bg-muted/50 border-0 h-10 text-sm"
              />
            </div>
            <Button
              onClick={handleFetchLink}
              disabled={!buyLink.trim()}
              size="sm"
              className="h-10 px-4 bg-foreground text-white"
            >
              Fetch
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !selectedCategory
                  ? "bg-foreground text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat ? null : cat)
                }
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  selectedCategory === cat
                    ? "bg-foreground text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-4 pt-4">
        {products === undefined ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] rounded-lg bg-muted" />
                <div className="mt-2 h-3 w-3/4 rounded bg-muted" />
                <div className="mt-1 h-3 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "Start browsing our collection"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <button
                key={product._id}
                onClick={() => navigate(`/dashboard/product/${product._id}`)}
                className="group text-left"
              >
                <div className="aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="mt-2 px-0.5">
                  <p className="text-xs font-medium leading-tight line-clamp-1 text-foreground">
                    {product.name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      ₹{product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-[10px] text-muted-foreground line-through">
                        ₹{product.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
