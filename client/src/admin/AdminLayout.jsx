import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  Layers,
  Image,
  ShoppingBag,
  Users,
  TicketPercent,
  Star,
  MessageSquare,
  Mail,
  Settings,
  FileText,
  LogOut,
  Menu,
  ExternalLink,
} from "lucide-react";
import { useAdmin } from "./auth.jsx";

const LINKS = [
  ["/admin", "Dashboard", LayoutDashboard, true],
  ["/admin/orders", "Orders", ShoppingBag],
  ["/admin/products", "Products", Package],
  ["/admin/categories", "Categories", Tags],
  ["/admin/collections", "Collections", Layers],
  ["/admin/banners", "Banners", Image],
  ["/admin/coupons", "Coupons", TicketPercent],
  ["/admin/customers", "Customers", Users],
  ["/admin/reviews", "Reviews", Star],
  ["/admin/messages", "Messages", MessageSquare],
  ["/admin/newsletter", "Newsletter", Mail],
  ["/admin/blog", "Blog & News", FileText],
  ["/admin/settings", "Settings", Settings],
];

export default function AdminLayout() {
  const { admin, logout } = useAdmin();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Close sidebar on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleLogout = (e) => {
    e.preventDefault();
    if (typeof logout === "function") {
      logout();
    }
    navigate("/admin/login");
  };

  return (
    <div className="adm">
      {/* Sidebar Backdrop Overlay */}
      <aside
        className={`adm-side ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
        role="navigation"
        aria-label="Admin navigation"
      >
        <div className="adm-side-content" onClick={(e) => e.stopPropagation()}>
          <div className="brand">
            <img src="/img/logo.jpg" alt="MS Store Logo" />
            <span>MS Admin</span>
          </div>

          <nav aria-label="Main Admin Navigation">
            {LINKS.map(([to, label, Icon, end]) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setOpen(false)}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div
            style={{
              marginTop: 18,
              borderTop: "1px solid rgba(255,255,255,.15)",
              paddingTop: 12,
            }}
          >
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View storefront (opens in a new tab)"
            >
              <ExternalLink size={16} aria-hidden="true" />
              <span>View store</span>
            </a>

            <button
              type="button"
              className="btn-link"
              onClick={handleLogout}
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                width: "100%",
                fontSize: "inherit",
              }}
            >
              <LogOut size={16} aria-hidden="true" />
              <span>Sign out</span>
            </button>

            <div style={{ fontSize: 11, opacity: 0.7, padding: "8px 12px" }}>
              {admin?.name || "Admin"} · {admin?.role || "Staff"}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="adm-main">
        <button
          type="button"
          className="icon-btn mob-toggle"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          style={{ marginBottom: 10 }}
        >
          <Menu size={22} aria-hidden="true" />
        </button>

        <Outlet />
      </div>
    </div>
  );
}
