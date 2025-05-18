import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import Spinner from "../components/Spinner";
import Header from "../components/home/Header";
import { CartContext } from "../context/CartContext";
import { useNavigate } from "react-router-dom"; // NEW: Added useNavigate

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5555";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { cart, addToCart } = useContext(CartContext);
  const navigate = useNavigate(); // NEW: For navigation to Product Preview

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/api/inventory/products`
        );
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // NEW: Handler to navigate to Product Preview
  const handleProductClick = (productId) => {
    navigate(`/product-preview/${productId}`);
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        cartCount={cart.items.length}
      />

      <h2 className="text-2xl font-semibold mb-4">Products</h2>

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-gray-500 text-center text-lg py-8">
          No products found
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer"
              onClick={() => handleProductClick(product._id)} // NEW: Navigate to Product Preview on click
            >
              <div className="h-40 overflow-hidden">
                <img
                  src={product.image || "/placeholder.png"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{product.category}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-green-600">
                    ${product.price.toFixed(2)}
                  </span>
                  {/* Modified: Button now navigates to Product Preview instead of adding directly */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click from triggering
                      handleProductClick(product._id);
                    }}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    disabled={product.currentStock <= 0}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
