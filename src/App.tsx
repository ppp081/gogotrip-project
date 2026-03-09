import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import Summary from "./pages/Summary";
import MainLayout from "@/layout";
import EmployeeLayout from "@/employee_layout";
import Customers from "./pages/Customers";

import Blog_Detail from "@/pages/Blog_Detail";
import Signin from "@/pages/Signin";
import AboutUs from "@/pages/AboutUs";
import TripCategoryPage from "@/pages/TripCategory";
import Trips from "@/pages/Trips";
import "./App.css";
import Bookings from "./pages/Bookings";
import TripDetail from "./pages/Trip_Detail";
import BookingDetail from "@/pages/BookingDetail";
import CustomerDetail from "@/pages/CustomerDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<EmployeeLayout />}>
          <Route path="/dashboard" element={<EmployeeDashboard />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/trips/:tripId" element={<TripDetail />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:customerId" element={<CustomerDetail />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/bookings/:bookingId" element={<BookingDetail />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/category/:activeCategory" element={<TripCategoryPage />} />
          <Route path="/blog">
            <Route path=":blogId" element={<Blog_Detail />} />
          </Route>
        </Route>

        <Route path="/signin" element={<Signin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
