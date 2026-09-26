import { Suspense, lazy } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import { ConfirmProvider, Skeleton } from "./components/Common.jsx";
import { AdminProvider, RequireAdmin, AdminLogin } from "./admin/auth.jsx";
import AdminLayout from "./admin/AdminLayout.jsx";
import Crud, { CONFIGS } from "./admin/Crud.jsx";

const lz = (fn, name) =>
  lazy(() => fn().then((m) => ({ default: name ? m[name] : m.default })));
const Products = lz(() => import("./pages/Products.jsx"));
const ProductDetail = lz(() => import("./pages/ProductDetail.jsx"));
const Cart = lz(() => import("./pages/Cart.jsx"));
const Checkout = lz(() => import("./pages/Checkout.jsx"));
const OrderConfirmation = lz(() => import("./pages/OrderConfirmation.jsx"));
const AccountLayout = lz(() => import("./pages/Account.jsx"), "AccountLayout");
const Profile = lz(() => import("./pages/Account.jsx"), "Profile");
const Orders = lz(() => import("./pages/Account.jsx"), "Orders");
const OrderDetail = lz(() => import("./pages/Account.jsx"), "OrderDetail");
const Wishlist = lz(() => import("./pages/Account.jsx"), "Wishlist");
const Login = lz(() => import("./pages/Login.jsx"));
const Register = lz(() => import("./pages/Register.jsx"));
const ForgotPassword = lz(() => import("./pages/ForgotPassword.jsx"));

const ResetPassword = lz(() => import("./pages/ResetPassword.jsx"));
const About = lz(() => import("./pages/Content.jsx"), "About");
const Contact = lz(() => import("./pages/Content.jsx"), "Contact");
const Blog = lz(() => import("./pages/Content.jsx"), "Blog");
const BlogPost = lz(() => import("./pages/Content.jsx"), "BlogPost");
const Policy = lz(() => import("./pages/Content.jsx"), "Policy");
const NotFound = lz(() => import("./pages/Content.jsx"), "NotFound");

const Dashboard = lz(() => import("./admin/Dashboard.jsx"));
const AdminProducts = lz(() => import("./admin/Products.jsx"), "AdminProducts");
const ProductForm = lz(() => import("./admin/Products.jsx"), "ProductForm");
const AdminOrders = lz(() => import("./admin/Orders.jsx"), "AdminOrders");
const AdminOrderDetail = lz(
  () => import("./admin/Orders.jsx"),
  "AdminOrderDetail",
);
const AdminCustomers = lz(() => import("./admin/Misc.jsx"), "AdminCustomers");
const AdminCustomer = lz(() => import("./admin/Misc.jsx"), "AdminCustomer");
const AdminReviews = lz(() => import("./admin/Misc.jsx"), "AdminReviews");
const AdminMessages = lz(() => import("./admin/Misc.jsx"), "AdminMessages");
const AdminNewsletter = lz(() => import("./admin/Misc.jsx"), "AdminNewsletter");
const Settings = lz(() => import("./admin/Settings.jsx"));

const Fallback = (
  <div className="container section">
    <Skeleton h={260} />
  </div>
);

export default function App() {
  return (
    <ConfirmProvider>
      <Suspense fallback={Fallback}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:slug" element={<ProductDetail />} />
            <Route
              path="category/:slug"
              element={<Products mode="category" />}
            />
            <Route path="search" element={<Products mode="search" />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route
              path="order-confirmation/:orderNumber"
              element={<OrderConfirmation />}
            />
            <Route path="account" element={<AccountLayout />}>
              <Route index element={<Profile />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:orderNumber" element={<OrderDetail />} />
              <Route path="wishlist" element={<Wishlist />} />
            </Route>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password/:token" element={<ResetPassword />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="blog" element={<Blog />} />
            <Route path="blog/:slug" element={<BlogPost />} />
            <Route path="policy/:slug" element={<Policy />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route
            path="/admin/login"
            element={
              <AdminProvider>
                <AdminLogin />
              </AdminProvider>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminProvider>
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              </AdminProvider>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            {Object.entries(CONFIGS).map(([k, cfg]) => (
              <Route key={k} path={k} element={<Crud cfg={cfg} />} />
            ))}
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="customers/:id" element={<AdminCustomer />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="newsletter" element={<AdminNewsletter />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ConfirmProvider>
  );
}
