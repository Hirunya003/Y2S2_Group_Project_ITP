import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import Spinner from "../Spinner";
import { useNavigate } from "react-router-dom"; // NEW: Added useNavigate
import { Link } from "react-router-dom";
import { AiOutlineEdit } from "react-icons/ai";
import { BsInfoCircle } from "react-icons/bs";
import { MdOutlineAddBox, MdOutlineDelete } from "react-icons/md";
import { FiSearch, FiShoppingCart } from "react-icons/fi";
import Header from "../home/Header";
import { CartContext } from "../../context/CartContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5555"; // Ensure API base URL is defined

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([
    "Fruits",
    "Vegetables",
    "Dairy",
    "Bakery",
    "Meat",
    "Frozen Foods",
  ]);
  const [loading, setLoading] = useState(false);
  const [showType, setShowType] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const { cart, addToCart } = useContext(CartContext); // Using cart context directly
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);

    // Fetch products from the API instead of using dummy data
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/api/inventory/products`
        );
        // Filter out inactive products
        const activeProducts = data.filter(
          (product) => product.isActive !== false
        );
        setProducts(activeProducts);

        // Extract unique categories from actual products
        const uniqueCategories = [
          ...new Set(activeProducts.map((product) => product.category)),
        ];
        if (uniqueCategories.length > 0) {
          setCategories(uniqueCategories);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Add to cart function
  const cartAdd = (product) => {
    addToCart(product); // Directly use the addToCart function from context
  };

  // Filter products based on search term
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductClick = (productId) => {
    console.log("Product clicked:", productId);
    navigate(`/product-preview/${productId}`);
  };

  // Featured products (those with a discount)
  const featuredProducts = products.filter((product) => product.discount);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Use the new Header component */}
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        cartCount={cart.items.length} // Directly using cart.items.length from context
      />

      {/* Categories */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Shop by Category</h2>
        <div className="flex overflow-x-auto gap-4 pb-2">
          {categories.map((category, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-4 min-w-[140px] cursor-pointer hover:shadow-lg transition-all text-center"
              onClick={() => setSearchTerm(category)}
            >
              <div className="font-medium">{category}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Special Offers */}
      {featuredProducts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Special Offers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-red-500 relative"
                onClick={() => handleProductClick(product._id)}
              >
                <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-bold">
                  SALE
                </span>
                <div className="h-40 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    onClick={() => handleProductClick(product._id)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {product.category}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-red-500">
                      Rs.{product.discountPrice.toFixed(2)}
                    </span>
                    <span className="text-gray-500 line-through text-sm">
                      Rs.{product.price.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => cartAdd(product)}
                    className="mt-2 w-full bg-green-600 text-white py-1 rounded hover:bg-green-700"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">All Products</h2>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded ${
                showType === "grid" ? "bg-green-600 text-white" : "bg-gray-200"
              }`}
              onClick={() => setShowType("grid")}
            >
              Grid
            </button>
            <button
              className={`px-3 py-1 rounded ${
                showType === "table" ? "bg-green-600 text-white" : "bg-gray-200"
              }`}
              onClick={() => setShowType("table")}
            >
              Table
            </button>
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">
              No products found matching "{searchTerm}"
            </p>
          </div>
        ) : showType === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                onClick={() => handleProductClick(product._id)}
              >
                <div className="h-40 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {product.category}
                  </p>
                  <div className="flex justify-between items-center">
                    {product.discount ? (
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-red-500">
                          Rs.{product.discountPrice.toFixed(2)}
                        </span>
                        <span className="text-gray-500 line-through text-sm">
                          Rs.{product.price.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="font-bold text-green-600">
                        Rs.{product.price.toFixed(2)}
                      </span>
                    )}
                    <button
                      onClick={() => cartAdd(product)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-green-600 text-white">
                  <th className="border p-2 text-left">Product</th>
                  <th className="border p-2 text-left">Category</th>
                  <th className="border p-2 text-left">Price</th>
                  <th className="border p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="border-b hover:bg-gray-50">
                    <td className="p-2 flex items-center gap-2">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      {product.name}
                    </td>
                    <td className="p-2">{product.category}</td>
                    <td className="p-2">
                      {product.discount ? (
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-red-500">
                            Rs.{product.discountPrice.toFixed(2)}
                          </span>
                          <span className="text-gray-500 line-through text-sm">
                            Rs.{product.price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold">
                          Rs.{product.price.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Link to={`/products/${product._id}`}>
                          <BsInfoCircle className="text-blue-600 text-xl" />
                        </Link>
                        <button onClick={() => cartAdd(product)}>
                          <MdOutlineAddBox className="text-green-600 text-xl" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
