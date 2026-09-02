import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Link, Loader2 } from "lucide-react";
import { productsApi } from "@/lib/api";
import type { Product } from "@/lib/apiConfig";

const TRENDING_TAGS = [
  { label: "Trending", icon: "🔥", color: "bg-orange-500/20 text-orange-400" },
  { label: "Deals", icon: "🏷️", color: "bg-red-500/20 text-red-400" },
  { label: "New", icon: "✨", color: "bg-purple-500/20 text-purple-400" },
  { label: "Sarees", icon: "👘", color: "bg-pink-500/20 text-pink-400" },
];

const RECENT_SEARCHES = [
  "Shoes", "Watch for men", "Weight machine", "Bottle",
  "Jeera", "Tiffin", "deals of the day", "trending",
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"search" | "link">("search");
  const [linkUrl, setLinkUrl] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await productsApi.getFeed({
        type: "search",
        session_state: searchQuery,
        limit: 20,
      }) as any;
      setProducts(res?.products || []);
    } catch (err) {
      console.error("Search failed:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFetchLink = async () => {
    if (!linkUrl) return;
    // TODO: implement buy-link fetch via API
    setLinkUrl("");
    navigate("/dashboard/cart");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-white/10">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold">Search</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Search/Link Toggle */}
        <div className="flex gap-2 p-1 bg-[#2a2a2a] rounded-xl">
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "search"
                ? "bg-blue-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Search className="h-4 w-4" />
            Search
          </button>
          <button
            onClick={() => setActiveTab("link")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "link"
                ? "bg-blue-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Link className="h-4 w-4" />
            By Link
          </button>
        </div>

        {/* Search Input */}
        {activeTab === "search" && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search for products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
                className="pl-10 bg-[#2a2a2a] border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
            <Button
              onClick={() => handleSearch(query)}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go"}
            </Button>
          </div>
        )}

        {/* Link Input */}
        {activeTab === "link" && (
          <div className="flex gap-2">
            <Input
              placeholder="Paste product link..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="bg-[#2a2a2a] border-white/10 text-white placeholder:text-gray-500"
            />
            <Button
              onClick={handleFetchLink}
              disabled={!linkUrl}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Fetch
            </Button>
          </div>
        )}

        {/* Trending Tags */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {TRENDING_TAGS.map((tag) => (
            <button
              key={tag.label}
              onClick={() => handleSearch(tag.label)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${tag.color}`}
            >
              {tag.icon} {tag.label}
            </button>
          ))}
        </div>

        {/* Recent Searches */}
        {!query && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white">
                Recent searches
              </p>
              <button className="text-xs text-red-400 hover:text-red-300">
                🗑️ Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {RECENT_SEARCHES.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setQuery(item);
                    handleSearch(item);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#2a2a2a] text-sm text-gray-300 hover:bg-[#3a3a3a] transition-colors"
                >
                  🕐 {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!query && !searched && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
              <span className="text-4xl">🛍️</span>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              Discover great deals
            </h2>
            <p className="text-sm text-gray-400 max-w-xs">
              Search for anything — sarees, kurtis, watches, home decor and more.
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
          </div>
        )}

        {/* Search Results */}
        {!loading && searched && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-gray-400">No results found</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div>
            <p className="text-sm text-gray-400 mb-3">
              {products.length} results for "{query}"
            </p>
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => navigate(`/dashboard/product/${product.id}`)}
                  className="bg-[#2a2a2a] rounded-xl overflow-hidden text-left hover:bg-[#3a3a3a] transition-colors"
                >
                  <div className="aspect-square bg-[#1a1a1a]">
                    <img
                      src={product.image || product.thumbnail}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-white line-clamp-2">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-white">
                        ₹{product.price}
                      </span>
                      {product.original_price && (
                        <span className="text-xs text-gray-500 line-through">
                          ₹{product.original_price}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
