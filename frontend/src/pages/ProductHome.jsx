import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import LoginCard from "../components/LoginCard";
import { productsAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

function ProductHome() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLoginCard, setShowLoginCard] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productsAPI.list(
        selectedCategory,
        searchQuery || null
      );
      setProducts(data);
      setError("");
    } catch {
      setError("Unable to load products");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return (
    <div style={styles.page}>
      <Navbar title="Farm Products" />

      {/* FILTER SECTION */}
      <div style={styles.filterSection}>
        <div style={styles.categoryWrap}>
          <button
            style={{
              ...styles.categoryBtn,
              background: selectedCategory === "Vegetables"
                ? "#38a169"
                : "#e6f4ea",
              color: selectedCategory === "Vegetables" ? "#fff" : "#22543d",
            }}
            onClick={() =>
              setSelectedCategory(
                selectedCategory === "Vegetables" ? null : "Vegetables"
              )
            }
          >
            🥬 Vegetables
          </button>

          <button
            style={{
              ...styles.categoryBtn,
              background: selectedCategory === "Fruits"
                ? "#ed8936"
                : "#fff7ed",
              color: selectedCategory === "Fruits" ? "#fff" : "#9c4221",
            }}
            onClick={() =>
              setSelectedCategory(
                selectedCategory === "Fruits" ? null : "Fruits"
              )
            }
          >
            🍎 Fruits
          </button>
        </div>

        <div style={styles.searchWrap}>
          <MagnifyingGlassIcon style={styles.searchIcon} />
          <input
            placeholder="Search farm products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* PRODUCT SECTION */}
      <div style={styles.content}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {searchQuery
              ? `Search: "${searchQuery}"`
              : selectedCategory || "All Farm Products"}
          </h2>
          <span style={styles.count}>{products.length}</span>
        </div>

        {loading && <p style={styles.info}>Loading products…</p>}
        {!loading && products.length === 0 && (
          <p style={styles.info}>No products available</p>
        )}

        <div style={styles.grid}>
          {products.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{
                y: -6,
                borderColor: "#38a169",
              }}
              transition={{ duration: 0.2 }}
              onClick={() => navigate(`/products/${product.id}`)}
              style={styles.card}
            >
              <ProductCard 
                product={product}
                onLoginRequired={() => setShowLoginCard(true)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {!isAuthenticated && showLoginCard && <LoginCard />}

      <Footer />
    </div>
  );
}

export default ProductHome;

/* ===== COLORFUL FARMER UI ===== */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f7f4",
    display: "flex",
    flexDirection: "column",
  },

  filterSection: {
    width: "92%",
    margin: "20px auto",
    padding: "16px",
    background:
      "linear-gradient(90deg, #e6f4ea, #fff7ed)",
    borderRadius: "16px",
    border: "1px solid #c6f6d5",
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    justifyContent: "space-between",
    alignItems: "center",
  },

  categoryWrap: {
    display: "flex",
    gap: "12px",
  },

  categoryBtn: {
    padding: "8px 18px",
    borderRadius: "999px",
    border: "none",
    fontWeight: "600",
    cursor: "pointer",
  },

  searchWrap: {
    display: "flex",
    alignItems: "center",
    background: "#ffffff",
    border: "1px solid #c6f6d5",
    borderRadius: "999px",
    padding: "8px 14px",
    width: "260px",
  },

  searchIcon: {
    width: "18px",
    height: "18px",
    color: "#2f855a",
    marginRight: "8px",
  },

  searchInput: {
    border: "none",
    outline: "none",
    width: "100%",
    fontSize: "14px",
  },

  content: {
    width: "92%",
    margin: "10px auto 30px",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 14px 34px rgba(0,0,0,0.07)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },

  title: {
    color: "#22543d",
    fontSize: "20px",
    fontWeight: "700",
  },

  count: {
    background: "#38a169",
    color: "#fff",
    padding: "4px 12px",
    borderRadius: "999px",
    fontWeight: "600",
  },

  info: {
    textAlign: "center",
    padding: "30px",
    color: "#4a5568",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "20px",
  },

  card: {
    cursor: "pointer",
    borderRadius: "14px",
    border: "2px solid transparent",
    background: "#ffffff",
  },

  error: {
    width: "92%",
    margin: "10px auto",
    padding: "10px",
    background: "#fed7d7",
    color: "#742a2a",
    borderRadius: "8px",
    textAlign: "center",
  },
};
