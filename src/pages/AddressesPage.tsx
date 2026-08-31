import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, Home, Briefcase, MapPin } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type AddressLabel = "home" | "work" | "other";

interface AddressForm {
  fullName: string;
  phone: string;
  pinCode: string;
  city: string;
  state: string;
  houseNumber: string;
  area: string;
  landmark: string;
  label: AddressLabel;
  isDefault: boolean;
}

const emptyForm: AddressForm = {
  fullName: "",
  phone: "",
  pinCode: "",
  city: "",
  state: "",
  houseNumber: "",
  area: "",
  landmark: "",
  label: "home",
  isDefault: false,
};

export default function AddressesPage() {
  const navigate = useNavigate();
  const addresses = useQuery(api.addresses.list);
  const addAddress = useMutation(api.addresses.add);
  const removeAddress = useMutation(api.addresses.remove);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (
      !form.fullName ||
      !form.phone ||
      !form.pinCode ||
      !form.city ||
      !form.state ||
      !form.houseNumber ||
      !form.area
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      await addAddress({
        fullName: form.fullName,
        phone: form.phone,
        pinCode: form.pinCode,
        city: form.city,
        state: form.state,
        houseNumber: form.houseNumber,
        area: form.area,
        landmark: form.landmark || undefined,
        label: form.label,
        isDefault: form.isDefault,
      });
      toast.success("Address saved!");
      setForm(emptyForm);
      setShowForm(false);
    } catch {
      toast.error("Failed to save address");
    }
    setSaving(false);
  };

  const handleDelete = async (addressId: string) => {
    try {
      await removeAddress({ addressId: addressId as any });
      toast.success("Address removed");
    } catch {
      toast.error("Failed to remove address");
    }
  };

  const labelIcons: Record<AddressLabel, typeof Home> = {
    home: Home,
    work: Briefcase,
    other: MapPin,
  };

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-base font-semibold">Address Book</h1>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-medium text-foreground hover:underline"
          >
            Add New
          </button>
        </div>
      </div>

      {/* Address Form */}
      {showForm && (
        <div className="px-4 pt-4">
          <div className="rounded-lg border border-border p-4 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              New Address
            </p>

            <Input
              placeholder="Full Name *"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            <Input
              placeholder="Phone Number *"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Pin Code *"
                value={form.pinCode}
                onChange={(e) => setForm({ ...form, pinCode: e.target.value })}
              />
              <Input
                placeholder="City *"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <Input
              placeholder="State *"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
            <Input
              placeholder="House/Flat No. *"
              value={form.houseNumber}
              onChange={(e) =>
                setForm({ ...form, houseNumber: e.target.value })
              }
            />
            <Input
              placeholder="Area/Locality *"
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
            />
            <Input
              placeholder="Landmark (optional)"
              value={form.landmark}
              onChange={(e) => setForm({ ...form, landmark: e.target.value })}
            />

            {/* Label Selection */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Label
              </p>
              <div className="flex gap-2">
                {(["home", "work", "other"] as AddressLabel[]).map((label) => {
                  const Icon = labelIcons[label];
                  return (
                    <button
                      key={label}
                      onClick={() => setForm({ ...form, label })}
                      className={cn(
                        "flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-all",
                        form.label === label
                          ? "border-foreground bg-foreground text-white"
                          : "border-border text-muted-foreground hover:border-foreground/50",
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Default Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) =>
                  setForm({ ...form, isDefault: e.target.checked })
                }
                className="rounded border-border"
              />
              <span className="text-xs text-muted-foreground">
                Set as default address
              </span>
            </label>

            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 bg-foreground text-white"
              >
                {saving ? "Saving..." : "Save Address"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Address List */}
      <div className="px-4 pt-4 space-y-2">
        {addresses === undefined ? (
          [1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))
        ) : addresses.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center py-16">
            <MapPin className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              No saved addresses
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="mt-3 bg-foreground text-white"
              size="sm"
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Address
            </Button>
          </div>
        ) : (
          addresses.map((addr) => {
            const Icon = labelIcons[addr.label];
            return (
              <div
                key={addr._id}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {addr.label}
                    </span>
                    {addr.isDefault && (
                      <span className="rounded-full bg-foreground px-1.5 py-0.5 text-[8px] font-medium text-white">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(addr._id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-sm font-medium mt-1">{addr.fullName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {addr.houseNumber}, {addr.area}
                </p>
                <p className="text-xs text-muted-foreground">
                  {addr.city}, {addr.state} - {addr.pinCode}
                </p>
                {addr.landmark && (
                  <p className="text-xs text-muted-foreground">
                    Landmark: {addr.landmark}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ph: {addr.phone}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
