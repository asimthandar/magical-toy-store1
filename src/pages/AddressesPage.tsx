import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Plus,
  MapPin,
  Star,
  Edit2,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AddressesPage() {
  const navigate = useNavigate();
  const addresses = useQuery(api.addresses.list);
  const addAddress = useMutation(api.addresses.add);
  const removeAddress = useMutation(api.addresses.remove);
  const updateAddress = useMutation(api.addresses.update);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    pinCode: "",
    city: "",
    state: "",
    houseNumber: "",
    area: "",
    landmark: "",
    label: "home" as "home" | "work" | "other",
  });

  const handleSubmit = async () => {
    if (!form.fullName || !form.phone || !form.pinCode || !form.city || !form.state || !form.houseNumber || !form.area) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await addAddress({
        ...form,
        isDefault: addresses?.length === 0,
      });
      setShowForm(false);
      setForm({
        fullName: "",
        phone: "",
        pinCode: "",
        city: "",
        state: "",
        houseNumber: "",
        area: "",
        landmark: "",
        label: "home",
      });
      toast.success("Address added!");
    } catch (err) {
      toast.error("Failed to add address");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeAddress({ addressId: id as any });
      toast.success("Address removed");
    } catch {
      toast.error("Failed to remove address");
    }
  };

  const handleSetDefault = async (addr: any) => {
    try {
      await updateAddress({
        addressId: addr._id,
        fullName: addr.fullName,
        phone: addr.phone,
        pinCode: addr.pinCode,
        city: addr.city,
        state: addr.state,
        houseNumber: addr.houseNumber,
        area: addr.area,
        landmark: addr.landmark,
        label: addr.label,
        isDefault: true,
      });
      toast.success("Default address updated");
    } catch {
      toast.error("Failed to update default");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-white/10">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="ml-4 text-lg font-bold">My Addresses</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Add New Address Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-blue-500/50 text-blue-400 hover:bg-blue-500/10 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">Add New Address</span>
        </button>

        {/* Add Address Form */}
        {showForm && (
          <div className="bg-[#2a2a2a] rounded-xl p-4 border border-white/10 space-y-3">
            <h3 className="text-sm font-semibold text-white">New Address</h3>

            <Input
              placeholder="Full Name *"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-500"
            />

            <Input
              placeholder="Phone Number *"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-500"
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="PIN Code *"
                value={form.pinCode}
                onChange={(e) => setForm({ ...form, pinCode: e.target.value })}
                className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-500"
              />
              <Input
                placeholder="City *"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-500"
              />
            </div>

            <Input
              placeholder="State *"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-500"
            />

            <Input
              placeholder="House/Flat Number *"
              value={form.houseNumber}
              onChange={(e) => setForm({ ...form, houseNumber: e.target.value })}
              className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-500"
            />

            <Input
              placeholder="Area/Street *"
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-500"
            />

            <Input
              placeholder="Landmark (optional)"
              value={form.landmark}
              onChange={(e) => setForm({ ...form, landmark: e.target.value })}
              className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-500"
            />

            {/* Label Selection */}
            <div className="flex gap-2">
              {(["home", "work", "other"] as const).map((label) => (
                <button
                  key={label}
                  onClick={() => setForm({ ...form, label })}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
                    form.label === label
                      ? "bg-blue-500 text-white"
                      : "bg-[#1a1a1a] text-gray-400 hover:text-white",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                className="flex-1 border-white/20 text-gray-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                Save Address
              </Button>
            </div>
          </div>
        )}

        {/* Address List */}
        {addresses === undefined ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-[#2a2a2a]" />
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No saved addresses</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div
                key={addr._id}
                className={cn(
                  "bg-[#2a2a2a] rounded-xl p-4 border",
                  addr.isDefault ? "border-blue-500/50" : "border-white/10",
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">
                      {addr.fullName}
                    </p>
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase">
                      {addr.label}
                    </span>
                  </div>
                  {addr.isDefault && (
                    <span className="text-xs text-green-400">★ Default</span>
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                  {addr.houseNumber}, {addr.area}, {addr.city} - {addr.pinCode}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xs text-gray-500">📞 {addr.phone}</p>
                  {addr.landmark && (
                    <p className="text-xs text-gray-500">
                      📍 {addr.landmark}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                  {!addr.isDefault && (
                    <Button
                      onClick={() => handleSetDefault(addr)}
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-gray-400 hover:text-white"
                    >
                      <Star className="mr-1 h-3 w-3" />
                      Set as Default
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDelete(addr._id)}
                    variant="outline"
                    size="sm"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
