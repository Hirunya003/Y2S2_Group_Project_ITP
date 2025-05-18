import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSnackbar } from "notistack";
import { AuthContext } from "../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5555";

const PaymentPage = () => {
  const { user } = useContext(AuthContext);
  const { orderId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    nameOnCard: "",
  });

  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const config = {
          headers: { Authorization: `Bearer ${user.token}` },
        };
        const res = await axios.get(
          `${API_BASE_URL}/api/orders/order/${orderId}`,
          config
        );
        console.log(res.data);
        setAmount(res.data.totalPrice);
      } catch {
        enqueueSnackbar("Unable to fetch order details", { variant: "error" });
        navigate("/");
      }
    };
    fetchOrder();
  }, [orderId, enqueueSnackbar, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isCardValid = () => {
    const { cardNumber, expiry, cvv, nameOnCard } = form;
    return (
      /^\d{16}$/.test(cardNumber) &&
      /^\d{2}\/\d{2}$/.test(expiry) &&
      /^\d{3}$/.test(cvv) &&
      nameOnCard.trim().length > 3
    );
  };

const handlePayment = async () => {
  if (!isCardValid()) {
    enqueueSnackbar("Invalid card details", { variant: "error" });
    return;
  }

  const cardLast4 = form.cardNumber.slice(-4);
  try {
    await axios.post(`${API_BASE_URL}/api/transactions`, {
      orderId,
      amount,
      status: "Success",
      cardLast4,
    });

    enqueueSnackbar("Payment Successful!", { variant: "success" });
    navigate(`/`);
  } catch (err) {
    enqueueSnackbar("Payment failed. Try again later.", { variant: "error" });
  }
};


  return (
    <div className="mx-auto max-w-lg mt-20">
      {/* Credit Card Preview */}
      <div className="bg-white rounded-xl overflow-hidden shadow-xl border transition-all duration-300">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <img
              className="h-8"
              src="https://www.svgrepo.com/show/499847/company.svg"
              alt="Workflow logo"
            />
            <span className="font-medium text-gray-600">
              {form.expiry || "MM/YY"}
            </span>
          </div>
          <div className="mt-6">
            <div className="font-bold text-gray-800 text-xl tracking-widest">
              {form.cardNumber
                ? form.cardNumber
                    .replace(/\s?/g, "")
                    .replace(/(\d{4})/g, "$1 ")
                    .trim()
                : "**** **** **** 1234"}
            </div>
            <div className="flex justify-between items-center mt-3">
              <div className="text-sm text-gray-600 uppercase">
                {form.nameOnCard || "Cardholder Name"}
              </div>
              <img
                className="h-10 w-10"
                src="https://www.svgrepo.com/show/362011/mastercard.svg"
                alt="Mastercard logo"
              />
            </div>
          </div>
        </div>
        <div className="bg-gray-100 px-6 py-4">
          <div className="font-medium text-gray-600">CVV</div>
          <div className="text-lg font-bold text-gray-800 mt-1">
            {form.cvv ? "*".repeat(form.cvv.length) : "***"}
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="mt-8 space-y-4">
        <input
          name="nameOnCard"
          placeholder="Name on Card"
          onChange={handleChange}
          value={form.nameOnCard}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="cardNumber"
          placeholder="Card Number"
          onChange={handleChange}
          value={form.cardNumber}
          maxLength={16}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex space-x-4">
          <input
            name="expiry"
            placeholder="MM/YY"
            onChange={handleChange}
            value={form.expiry}
            maxLength={5}
            className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="cvv"
            placeholder="CVV"
            onChange={handleChange}
            value={form.cvv}
            maxLength={3}
            className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handlePayment}
          disabled={!isCardValid()}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Pay Rs.{amount}
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;
