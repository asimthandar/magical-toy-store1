import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, ShoppingCart, Package } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-white"
    >
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <span className="text-sm font-semibold tracking-widest uppercase">
          Store
        </span>
        <Button
          onClick={() => navigate("/auth")}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Sign In
        </Button>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-20 pb-16">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground mb-4">
              Curated Collection
            </p>
            <h1 className="text-4xl font-light tracking-tight leading-tight">
              Find what
              <br />
              <span className="font-semibold">speaks to you.</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-sm">
              A carefully curated selection of clothing, shoes, and accessories.
              Minimal design, maximum quality.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex gap-3"
          >
            <Button
              onClick={() => navigate("/auth")}
              className="bg-foreground text-white h-12 px-6"
            >
              Shop Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              onClick={() => navigate("/auth")}
              variant="outline"
              className="h-12 px-6"
            >
              Explore
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 border-t border-border/50">
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: "Smart Search",
                desc: "Find exactly what you need",
              },
              {
                icon: ShoppingCart,
                title: "Easy Checkout",
                desc: "Seamless payment experience",
              },
              {
                icon: Package,
                title: "Track Orders",
                desc: "Real-time order updates",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <feature.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs font-medium">{feature.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 py-16 border-t border-border/50">
        <div className="max-w-lg mx-auto">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground mb-6">
            Categories
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                name: "Clothing",
                desc: "Tees, jackets, dresses & more",
                gradient: "from-neutral-100 to-neutral-50",
              },
              {
                name: "Shoes",
                desc: "Sneakers, boots, loafers",
                gradient: "from-stone-100 to-stone-50",
              },
              {
                name: "Accessories",
                desc: "Bags, watches & essentials",
                gradient: "from-zinc-100 to-zinc-50",
              },
              {
                name: "New Arrivals",
                desc: "Fresh additions this week",
                gradient: "from-gray-100 to-gray-50",
              },
            ].map((cat) => (
              <div
                key={cat.name}
                onClick={() => navigate("/auth")}
                className={`rounded-xl bg-gradient-to-br ${cat.gradient} p-5 cursor-pointer transition-all hover:scale-[1.02]`}
              >
                <p className="text-sm font-medium">{cat.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {cat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 border-t border-border/50">
        <div className="max-w-lg mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="text-2xl font-light tracking-tight">
              Ready to start?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Join and get ₹120 off your first order.
            </p>
            <Button
              onClick={() => navigate("/auth")}
              className="mt-6 bg-foreground text-white h-12 px-8"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-border/50">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Store
          </span>
          <span className="text-[10px] text-muted-foreground">
            © 2026
          </span>
        </div>
      </footer>
    </motion.div>
  );
}
