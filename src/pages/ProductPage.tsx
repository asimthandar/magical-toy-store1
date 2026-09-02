import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { productsApi, cartApi } from "@/lib/api";
import { getIdentifier } from "@/lib/auth";
import type { Product } from "@/lib/apiConfig";

export default function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    productsApi.getDetail(productId)
      .then((data: any) => {
        setProduct(data);
      })
      .catch((err: any) => {
        console.error("Failed to load product:", err);
        setProduct(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product) return;
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    setAdding(true);
    try {
      const identifier = getIdentifier();
      await cartApi.addItem({
        identifier,
        items: [
          {
            product_id: String(product.id),
            supplier_id: product.supplier_id || 0,
            variation: product.variation,
            variation_id: product.variation_id,
            quantity: 1,
          },
        ],
      });
      toast.success("Added to cart!");
      navigate("/dashboard/cart");
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="pb-24">
        <div className="animate-pulse">
          <div className="aspect-square bg-muted" />
          <div className="p-4 space-y-3">
            <div className="h-5 w-3/4 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
            <div className="h-20 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20 pb-24">
        <p className="text-sm text-muted-foreground">Product not found</p>
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mt-2"
        >
          Go back
        </Button>
      </div>
    );
  }

  const hasDiscount =
    product.original_price && product.original_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(
        ((product.original_price! - product.price) / product.original_price!) *
          100,
      )
    : 0;

  return (
    <div className="bg-background min-h-screen">
      {/* Back Button */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </div>

      {/* Product Image */}
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={product.image || product.thumbnail}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Product Info */}
      <div className="px-4 pt-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              {product.name}
            </h1>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold text-foreground">
                ₹{product.price}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    ₹{product.original_price}
                  </span>
                  <span className="rounded-full bg-green-500/10 text-green-500 px-2 py-0.5 text-[10px] font-medium">
                    {discountPct}% off
                  </span>
                </>
              )}
            </div>
          </div>
          {product.rating && (
            <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              <Star className="h-3 w-3 fill-current text-amber-500" />
              <span className="text-xs font-medium">{product.rating}</span>
              <span className="text-[10px] text-muted-foreground">
                ({product.review_count})
              </span>
            </div>
          )}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {String(product.description || '')}
        </p>

        {product.category && (
          <div className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
            {String(product.category)}
          </div>
        )}

        {/* Size Selection */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Select Size
            </p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    "min-w-[48px] rounded-lg border px-4 py-2.5 text-sm font-medium transition-all",
                    selectedSize === size
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-foreground hover:border-foreground/50",
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add to Cart Bar */}
      <div className="sticky bottom-0 z-[60] bg-background border-t border-border px-4 py-3 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold">₹{product.price}</span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                ₹{product.original_price}
              </span>
            )}
          </div>
          {hasDiscount && (
            <p className="text-[10px] text-green-500 font-medium">
              You save ₹{product.original_price! - product.price} (
              {discountPct}% off)
            </p>
          )}
        </div>
        <Button
          onClick={handleAddToCart}
          disabled={adding}
          className="bg-foreground text-background hover:bg-foreground/90 px-6 h-11 font-medium shrink-0"
        >
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
