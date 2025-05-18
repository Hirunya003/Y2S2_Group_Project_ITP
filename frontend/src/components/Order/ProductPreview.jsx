import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiShoppingCart } from "react-icons/fi";
import { useSnackbar } from "notistack";
import "./ProductPreview.css";
import Spinner from "../Spinner";
import { AuthContext } from "../../context/AuthContext";

// API base URL - default to localhost if not specified
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5555";

const ProductPreview = () => {
  const { id } = useParams(); // Get the product ID from the URL
  const navigate = useNavigate(); //For redirecting to the cart page
  const { enqueueSnackbar } = useSnackbar(); // For showing notifications
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1); // To handle the quantity of items to add to cart
  const { user } = useContext(AuthContext);

  console.log(id);

  //Fetch product details based on the ID
  useEffect(() => {
    const fetchProduct = async () => {

      setLoading(true);
      try {
        if (!user || !user.token) {
          enqueueSnackbar("User is not authenticated", { variant: "error" });
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        const { data } = await axios.get(
          `${API_BASE_URL}/api/inventory/products/${id}`,
          config
        );

        console.log(data); // For debugging
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
        enqueueSnackbar("Failed to load product details", { variant: "error" });
      } finally {
        setLoading(false); // Set loading to false after the fetch is completed
      }
    };

    fetchProduct();
  }, [id, user, enqueueSnackbar]);

  //Handle adding to cart and redirecting to the cart page
  const addToCart = () => {
    enqueueSnackbar(`${product.name} added to cart`, { variant: "success" });
    navigate("/cart"); // Redirect to the cart page
  };

  // Handle quantity change
  const increaseQuantity = () => {
    if (quantity < product.currentStock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Product not found</p>
      </div>
    );
  }

  return (
    <div className="product-preview-container">
      <div className="product-preview-card">
        <div className="product-preview-content">
          {/* Product Image */}
          <div className="product-image-container">
            <img
              src={product.image || "/placeholder.png"}
              alt={product.name}
              className="product-image"
            />
          </div>

          {/* Product Details */}
          <div className="product-details">
            <div>
              <h2 className="product-title">{product.name}</h2>
              <div className="product-stock-container">
                {product.currentStock > 0 ? (
                  <span className="product-stock">In Stock</span>
                ) : (
                  <span className="product-stock-out">Out of Stock</span>
                )}
              </div>
              <div className="product-price-container">
                <span className="product-price">
                  Rs. {product.price.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Quantity Selector */}
            {product.currentStock > 0 && (
              <div className="quantity-selector">
                <div className="quantity-controls">
                  <button
                    onClick={decreaseQuantity}
                    className="quantity-button"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="quantity-value">{quantity}</span>
                  <button
                    onClick={increaseQuantity}
                    className="quantity-button"
                    disabled={quantity >= product.currentStock}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={addToCart}
              disabled={product.currentStock <= 0}
              className="add-to-cart-button"
            >
              <FiShoppingCart className="add-to-cart-icon" /> Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPreview;
