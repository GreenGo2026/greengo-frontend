// src/pages/SharedCartPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSeo } from "../hooks/useSeo";
import { apiClient } from "../services/api";
import { useCartStore } from "../store/cartStore";

// Mirrors the backend's CartItemInput, which itself mirrors the frontend's
// real CartItem shape (src/services/api.ts Product + cartQuantity) -- no
// id/name_fr/image_url, those fields don't exist on a cart item here.
interface SharedItem {
  name: string;
  price_per_unit: number;
  unit: string;
  cartQuantity: number;
  variant_label?: string | null;
}

interface SharedCart {
  share_id: string;
  items: SharedItem[];
  shared_by_name?: string | null;
  item_count: number;
  total_price: number;
  expires_at: string;
}

export default function SharedCartPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [cart, setCart] = useState<SharedCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [added, setAdded] = useState(false);

  const addToCart = useCartStore((s) => s.addToCart);

  useSeo({
    title: cart ? `Panier de ${cart.shared_by_name || "GreenGo"} | GreenGo Market` : "Panier partagé | GreenGo Market",
    description: "Commandez les mêmes produits frais en 1 clic. Livraison en 30 min.",
  });

  useEffect(() => {
    if (!shareId) return;
    apiClient.get(`/cart/share/${shareId}`)
      .then((res) => setCart(res.data))
      .catch((err) => {
        if (err?.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [shareId]);

  function handleAddAll() {
    if (!cart) return;
    cart.items.forEach((item) => {
      addToCart({
        name:           item.name,
        price_per_unit: item.price_per_unit,
        unit:           item.unit,
        available:      true,
        variant_label:  item.variant_label || null,
      }, item.cartQuantity || 1);
    });
    setAdded(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Chargement du panier...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">🛒</p>
          <h1 className="font-bold text-[#0c3228] text-xl mb-2">Lien expiré</h1>
          <p className="text-gray-500 text-sm mb-6">
            Ce panier partagé n'existe plus. Les paniers expirent après 7 jours.
          </p>
          <Link to="/shop" className="inline-block bg-[#0c3228] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-green-900 transition-colors">
            Voir le catalogue →
          </Link>
        </div>
      </div>
    );
  }

  if (!cart) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Header */}
        <div className="text-center">
          <p className="text-3xl mb-2">🛒</p>
          <h1 className="text-xl font-bold text-[#0c3228]">
            {cart.shared_by_name ? `Panier de ${cart.shared_by_name}` : "Panier partagé GreenGo"}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {cart.item_count} article{cart.item_count > 1 ? "s" : ""} · ~{cart.total_price.toFixed(2)} MAD
          </p>
        </div>

        {/* Items list */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {cart.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {item.name}
                    {item.variant_label && <span className="text-gray-400 ml-1 text-xs">({item.variant_label})</span>}
                  </p>
                  <p className="text-xs text-gray-400">
                    Qté : {item.cartQuantity} · {item.price_per_unit} MAD/{item.unit}
                  </p>
                </div>
                <p className="text-sm font-bold text-[#0c3228] shrink-0">
                  {(item.price_per_unit * item.cartQuantity).toFixed(2)} MAD
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 px-4 py-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-600">Total estimé</span>
            <span className="font-bold text-lg text-[#0c3228]">{cart.total_price.toFixed(2)} MAD</span>
          </div>
        </div>

        {/* Add all CTA */}
        {!added ? (
          <button onClick={handleAddAll} className="w-full py-4 rounded-xl bg-[#0c3228] text-white font-bold text-sm hover:bg-green-900 transition-colors">
            🛒 Ajouter tout à mon panier
          </button>
        ) : (
          <div className="space-y-3">
            <div className="w-full py-4 rounded-xl bg-green-500 text-white font-bold text-sm text-center">
              ✓ {cart.item_count} articles ajoutés !
            </div>
            <Link to="/cart" className="block w-full py-3 rounded-xl border-2 border-[#0c3228] text-[#0c3228] font-bold text-sm text-center hover:bg-[#0c3228] hover:text-white transition-colors">
              Voir mon panier →
            </Link>
          </div>
        )}

        {/* Expiry note */}
        <p className="text-xs text-gray-400 text-center">
          ⏱️ Ce lien expire le{" "}
          {new Date(cart.expires_at).toLocaleDateString("fr-MA", { day: "2-digit", month: "long", year: "numeric" })}
        </p>

        <div className="text-center">
          <Link to="/shop" className="text-sm text-gray-400 hover:text-[#0c3228] transition-colors">
            Voir tout le catalogue →
          </Link>
        </div>

      </div>
    </div>
  );
}
