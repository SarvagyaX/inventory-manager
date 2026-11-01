
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Boxes,
  Check,
  ChevronDown,
  CircleDollarSign,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Tag,
  TrendingUp,
  Truck,
  X,
  Pencil,
  Trash2,
  Warehouse,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./style.css";

type Item = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  category: string;
};

const API = "http://127.0.0.1:8000/products";

const EMPTY_FORM = {
  name: "",
  sku: "",
  quantity: "",
  price: "",
  category: "",
};

const COLORS = ["#9b7bff", "#39d8f2", "#c4f56a", "#ff79bd", "#ffb86b"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  async function load(q = query) {
    try {
      const response = await fetch(
        `${API}${q ? `?q=${encodeURIComponent(q)}` : ""}`
      );

      if (!response.ok) {
        throw new Error("Could not load inventory.");
      }

      setItems(await response.json());
      setError("");
    } catch {
      setError("API unavailable. Start the FastAPI backend on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load("");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load(query);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  const stats = useMemo(() => {
    const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
    const inventoryValue = items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const lowStock = items.filter(
      (item) => item.quantity > 0 && item.quantity <= 10
    ).length;
    const outOfStock = items.filter((item) => item.quantity === 0).length;

    return {
      totalProducts: items.length,
      totalUnits,
      inventoryValue,
      lowStock,
      outOfStock,
    };
  }, [items]);

  const categoryData = useMemo(() => {
    const categories = new Map<string, number>();

    items.forEach((item) => {
      categories.set(
        item.category,
        (categories.get(item.category) ?? 0) + item.quantity
      );
    });

    return Array.from(categories, ([name, value]) => ({ name, value }));
  }, [items]);

  const chartData = useMemo(() => {
    const grouped = new Map<string, number>();

    items.forEach((item) => {
      grouped.set(
        item.category,
        (grouped.get(item.category) ?? 0) + item.quantity * item.price
      );
    });

    return Array.from(grouped, ([name, value]) => ({
      name,
      value,
    })).slice(0, 7);
  }, [items]);

  const visibleItems = useMemo(() => {
    if (activeFilter === "Low stock") {
      return items.filter(
        (item) => item.quantity > 0 && item.quantity <= 10
      );
    }

    if (activeFilter === "Out of stock") {
      return items.filter((item) => item.quantity === 0);
    }

    return items;
  }, [items, activeFilter]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditing(null);
    setModalOpen(false);
  }

  function openCreateModal() {
    setForm(EMPTY_FORM);
    setEditing(null);
    setModalOpen(true);
  }

  function editItem(item: Item) {
    setEditing(item.id);
    setForm({
      name: item.name,
      sku: item.sku,
      quantity: String(item.quantity),
      price: String(item.price),
      category: item.category,
    });
    setModalOpen(true);
  }

  async function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      quantity: Number(form.quantity),
      price: Number(form.price),
      category: form.category.trim(),
    };

    if (
      !body.name ||
      !body.sku ||
      !body.category ||
      body.quantity < 0 ||
      body.price < 0
    ) {
      setError("Please enter valid product details.");
      return;
    }

    try {
      const response = await fetch(
        editing === null ? API : `${API}/${editing}`,
        {
          method: editing === null ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(
          result?.detail ?? "Could not save product. Please try again."
        );
      }

      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  }

  async function deleteItem(id: number) {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const response = await fetch(`${API}/${id}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Could not delete product.");
      }

      await load();
    } catch {
      setError("Delete failed. Please try again.");
    }
  }

  return (
    <div className="app-layout">
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Boxes size={23} />
          </div>
          <div>
            <h2>Stockify</h2>
            <span>INVENTORY SUITE</span>
          </div>
          <button
            className="mobile-close icon-button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="nav-menu">
          <a className="nav-link active" href="#overview">
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </a>
          <a className="nav-link" href="#inventory">
            <Package size={18} />
            <span>Inventory</span>
            <span className="nav-count">{items.length}</span>
          </a>
          <a className="nav-link" href="#analytics">
            <BarChart3 size={18} />
            <span>Analytics</span>
          </a>
          <a className="nav-link" href="#inventory">
            <Truck size={18} />
            <span>Stock alerts</span>
            {stats.lowStock + stats.outOfStock > 0 && (
              <span className="nav-dot" />
            )}
          </a>
        </nav>

        <div className="sidebar-label tools-label">PREFERENCES</div>

        <nav className="nav-menu">
          <a className="nav-link" href="#settings">
            <Settings size={18} />
            <span>Settings</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">
              <Sparkles size={18} />
            </div>
            <h3>Stay organized</h3>
            <p>Keep your inventory accurate and up to date.</p>
            <a href="#inventory">Manage inventory <ArrowUpRight size={14} /></a>
          </div>

          <div className="profile">
            <div className="avatar">S</div>
            <div className="profile-info">
              <strong>Workspace Admin</strong>
              <span>Inventory Manager</span>
            </div>
            <ChevronDown size={16} />
          </div>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button menu-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={21} />
            </button>
            <div className="breadcrumb">
              Workspace <span>/</span> <strong>Overview</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="system-status">
              <span className="status-indicator" />
              System operational
            </div>
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
              title="Stock notifications"
            >
              <Bell size={19} />
              {stats.lowStock + stats.outOfStock > 0 && (
                <span className="notification-dot" />
              )}
            </button>
            <div className="top-avatar">S</div>
          </div>
        </header>

        <div className="page-content">
          <motion.section
            className="welcome-section"
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={{ duration: 0.5 }}
          >
            <div>
              <div className="eyebrow">
                <Sparkles size={13} /> YOUR INVENTORY AT A GLANCE
              </div>
              <h1>Dashboard <span className="heading-accent">overview.</span></h1>
              <p>
                Track your products, monitor stock levels, and stay in control.
              </p>
            </div>

            <button className="primary-button" onClick={openCreateModal}>
              <Plus size={18} /> Add new product
            </button>
          </motion.section>

          <AnimatePresence>
            {error && (
              <motion.div
                className="error-banner"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AlertTriangle size={17} />
                <span>{error}</span>
                <button onClick={() => setError("")} aria-label="Dismiss">
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <section className="stats-grid">
            {[
              {
                title: "Total products",
                value: stats.totalProducts.toLocaleString("en-IN"),
                note: `${stats.totalUnits.toLocaleString("en-IN")} units in stock`,
                icon: Package,
                color: "purple",
                change: <ArrowUpRight size={15} />,
              },
              {
                title: "Inventory value",
                value: formatCurrency(stats.inventoryValue),
                note: "Based on current stock",
                icon: CircleDollarSign,
                color: "cyan",
                change: <TrendingUp size={15} />,
              },
              {
                title: "Low stock items",
                value: stats.lowStock.toLocaleString("en-IN"),
                note: "10 units or fewer",
                icon: AlertTriangle,
                color: "lime",
                change: <ArrowDownRight size={15} />,
              },
              {
                title: "Out of stock",
                value: stats.outOfStock.toLocaleString("en-IN"),
                note: "Products needing restock",
                icon: ShoppingBag,
                color: "pink",
                change: <Activity size={15} />,
              },
            ].map((stat, index) => {
              const Icon = stat.icon;

              return (
                <motion.article
                  className={`stat-card stat-${stat.color}`}
                  key={stat.title}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                  transition={{ delay: index * 0.09, duration: 0.45 }}
                >
                  <div className="stat-top">
                    <div className="stat-icon"><Icon size={20} /></div>
                    <span className="stat-trend">{stat.change}</span>
                  </div>
                  <span className="stat-title">{stat.title}</span>
                  <strong className="stat-value">{stat.value}</strong>
                  <span className="stat-note">{stat.note}</span>
                </motion.article>
              );
            })}
          </section>

          <section className="charts-grid" id="analytics">
            <motion.article
              className="dashboard-card chart-card"
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              transition={{ delay: 0.25 }}
            >
              <div className="card-heading">
                <div>
                  <span className="section-kicker">VALUATION</span>
                  <h2>Inventory by category</h2>
                  <p>Estimated value of your current stock</p>
                </div>
                <div className="chart-icon"><BarChart3 size={19} /></div>
              </div>

              {chartData.length > 0 ? (
                <div className="area-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#9b7bff" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#9b7bff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#293044" strokeDasharray="4 5" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#8791a8", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#8791a8", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value: number) => `₹${value}`}
                        width={55}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#171c2b",
                          border: "1px solid #343b52",
                          borderRadius: 10,
                          color: "#fff",
                        }}
                        formatter={(value) => [
                          formatCurrency(Number(value)),
                          "Stock value",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#a78bfa"
                        strokeWidth={3}
                        fill="url(#valueGradient)"
                        activeDot={{ r: 5, fill: "#c4f56a" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="chart-empty">
                  <BarChart3 size={30} />
                  <span>Add products to see your inventory valuation.</span>
                </div>
              )}
            </motion.article>

            <motion.article
              className="dashboard-card category-card"
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              transition={{ delay: 0.35 }}
            >
              <div className="card-heading">
                <div>
                  <span className="section-kicker">DISTRIBUTION</span>
                  <h2>Stock breakdown</h2>
                  <p>Units across product categories</p>
                </div>
                <div className="chart-icon cyan-icon"><Tag size={19} /></div>
              </div>

              {categoryData.length > 0 ? (
                <>
                  <div className="donut-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="66%"
                          outerRadius="88%"
                          paddingAngle={4}
                          stroke="none"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#171c2b",
                            border: "1px solid #343b52",
                            borderRadius: 10,
                            color: "#fff",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-center">
                      <strong>{stats.totalUnits.toLocaleString("en-IN")}</strong>
                      <span>TOTAL UNITS</span>
                    </div>
                  </div>
                  <div className="category-legend">
                    {categoryData.slice(0, 5).map((category, index) => (
                      <div className="legend-item" key={category.name}>
                        <span
                          className="legend-dot"
                          style={{ background: COLORS[index % COLORS.length] }}
                        />
                        <span className="legend-name">{category.name}</span>
                        <strong>{category.value}</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="chart-empty">
                  <Tag size={30} />
                  <span>Category data will appear here.</span>
                </div>
              )}
            </motion.article>
          </section>

          <section className="dashboard-card inventory-card" id="inventory">
            <div className="inventory-heading">
              <div>
                <span className="section-kicker">PRODUCT DATABASE</span>
                <h2>Inventory management</h2>
                <p>View and manage all your products in one place.</p>
              </div>
              <button className="secondary-button" onClick={openCreateModal}>
                <Plus size={16} /> Add product
              </button>
            </div>

            <div className="table-toolbar">
              <div className="filter-tabs">
                {["All", "Low stock", "Out of stock"].map((filter) => (
                  <button
                    key={filter}
                    className={`filter-tab ${activeFilter === filter ? "selected" : ""}`}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                    {filter === "All" && <span>{items.length}</span>}
                  </button>
                ))}
              </div>

              <div className="search-box">
                <Search size={17} />
                <input
                  placeholder="Search products..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                {query && (
                  <button onClick={() => setQuery("")} aria-label="Clear search">
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            <div className="table-container">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>PRODUCT</th>
                    <th>SKU</th>
                    <th>CATEGORY</th>
                    <th>QUANTITY</th>
                    <th>UNIT PRICE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="table-message">
                        Loading inventory...
                      </td>
                    </tr>
                  ) : visibleItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-message">
                        <div className="empty-state">
                          <Warehouse size={30} />
                          <strong>No products found</strong>
                          <span>
                            {query
                              ? "Try a different search term."
                              : "Add your first product to get started."}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visibleItems.map((item) => (
                      <motion.tr
                        key={item.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <td>
                          <div className="product-cell">
                            <div className="product-symbol">
                              <Package size={18} />
                            </div>
                            <div>
                              <strong>{item.name}</strong>
                              <span>Product #{item.id}</span>
                            </div>
                          </div>
                        </td>
                        <td><span className="sku-text">{item.sku}</span></td>
                        <td><span className="category-pill">{item.category}</span></td>
                        <td><strong className="quantity-text">{item.quantity}</strong></td>
                        <td>{formatCurrency(item.price)}</td>
                        <td>
                          {item.quantity === 0 ? (
                            <span className="status-pill status-out">Out of stock</span>
                          ) : item.quantity <= 10 ? (
                            <span className="status-pill status-low">Low stock</span>
                          ) : (
                            <span className="status-pill status-good">
                              <Check size={12} /> In stock
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="table-action edit-action"
                              onClick={() => editItem(item)}
                              aria-label={`Edit ${item.name}`}
                              title="Edit product"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              className="table-action delete-action"
                              onClick={() => void deleteItem(item.id)}
                              aria-label={`Delete ${item.name}`}
                              title="Delete product"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>
                Showing <strong>{visibleItems.length}</strong> of{" "}
                <strong>{items.length}</strong> products
              </span>
              <span className="live-indicator">
                <span /> Live inventory data
              </span>
            </div>
          </section>

          <footer className="app-footer">
            <span>STOCKIFY <span className="footer-dot">●</span> INVENTORY MANAGEMENT</span>
            <span>Built with React, TypeScript & FastAPI</span>
          </footer>
        </div>
      </main>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) resetForm();
            }}
          >
            <motion.div
              className="product-modal"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.2 }}
            >
              <div className="modal-heading">
                <div>
                  <span className="section-kicker">
                    {editing === null ? "NEW INVENTORY ITEM" : "UPDATE INVENTORY"}
                  </span>
                  <h2>{editing === null ? "Add a product" : "Edit product"}</h2>
                  <p>Enter the product details below.</p>
                </div>
                <button
                  className="icon-button"
                  onClick={resetForm}
                  aria-label="Close form"
                >
                  <X size={20} />
                </button>
              </div>

              <form className="product-form" onSubmit={saveItem}>
                <label>
                  Product name
                  <input
                    required
                    maxLength={100}
                    placeholder="e.g. Wireless Keyboard"
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                  />
                </label>

                <label>
                  SKU
                  <input
                    required
                    maxLength={50}
                    placeholder="e.g. KEY-001"
                    value={form.sku}
                    onChange={(event) =>
                      setForm({ ...form, sku: event.target.value })
                    }
                  />
                </label>

                <div className="form-row">
                  <label>
                    Quantity
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={form.quantity}
                      onChange={(event) =>
                        setForm({ ...form, quantity: event.target.value })
                      }
                    />
                  </label>

                  <label>
                    Unit price (₹)
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={form.price}
                      onChange={(event) =>
                        setForm({ ...form, price: event.target.value })
                      }
                    />
                  </label>
                </div>

                <label>
                  Category
                  <input
                    required
                    maxLength={50}
                    placeholder="e.g. Electronics"
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                  />
                </label>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-button">
                    <Check size={17} />
                    {editing === null ? "Create product" : "Save changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
