import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Factory, 
  Plus, 
  Edit2,
  History, 
  TrendingUp, 
  Box,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Search,
  ArrowRightLeft,
  Users,
  Phone,
  Mail,
  MapPin,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface Unit {
  id: number;
  unit_name: string;
  conversion_factor: number;
  price: number;
}

interface Product {
  id: number;
  name: string;
  type: 'trading' | 'manufactured';
  base_unit: string;
  base_price: number;
  description: string;
  stock: number;
  units: Unit[];
}

interface Sale {
  id: number;
  product_name: string;
  customer_name?: string;
  quantity: number;
  total_price: number;
  vat_rate: number;
  vat_amount: number;
  shipping_fee: number;
  date: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  debt: number;
}

const COMMON_UNITS = ['kg', 'Tấn', 'Bó', 'Cái', 'Chiếc', 'Bộ', 'Mét', 'Cuộn', 'Cây', 'Thùng', 'Hộp', 'Tấm', 'Thanh', 'Ống'];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'inventory' | 'production' | 'sales' | 'customers' | 'reports'>('dashboard');
  const [productionSubTab, setProductionSubTab] = useState<'order' | 'bom'>('order');
  const [bomViewMode, setBomViewMode] = useState<'list' | 'manage'>('list');
  const [products, setProducts] = useState<Product[]>([]);
  const [bomProducts, setBomProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<{ totalSales: number; recentSales: Sale[] }>({ totalSales: 0, recentSales: [] });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isProduceModalOpen, setIsProduceModalOpen] = useState(false);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [bomItems, setBOMItems] = useState<any[]>([]);
  const [productionLogs, setProductionLogs] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    fetchData();
    if (activeTab === 'production') {
      fetchProductionLogs();
      fetchBOMProducts();
    }
    if (activeTab === 'customers') {
      fetchCustomers();
    }
    if (activeTab === 'reports') {
      fetchReportData();
    }
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, statsRes, custRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/stats'),
        fetch('/api/customers')
      ]);
      const prodData = await prodRes.json();
      const statsData = await statsRes.json();
      const custData = await custRes.json();
      setProducts(prodData);
      setStats(statsData);
      setCustomers(custData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProductionLogs = async () => {
    try {
      const res = await fetch('/api/production-logs');
      const data = await res.json();
      setProductionLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const fetchBOMProducts = async () => {
    try {
      const res = await fetch('/api/bom-list');
      const data = await res.json();
      setBomProducts(data);
    } catch (error) {
      console.error('Error fetching BOM list:', error);
    }
  };

  const fetchBOM = async (productId: number) => {
    try {
      const res = await fetch(`/api/bom/${productId}`);
      const data = await res.json();
      setBOMItems(data);
    } catch (error) {
      console.error('Error fetching BOM:', error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      setReportData(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const updateSalesTotal = (form: HTMLFormElement) => {
    const productId = (form.elements.namedItem('productId') as HTMLSelectElement).value;
    const unitId = (form.elements.namedItem('unitId') as HTMLSelectElement).value;
    const qtyInput = form.elements.namedItem('quantity') as HTMLInputElement;
    const vatRateInput = form.elements.namedItem('vatRate') as HTMLInputElement;
    const vatAmountInput = form.elements.namedItem('vatAmount') as HTMLInputElement;
    const shippingFeeInput = form.elements.namedItem('shippingFee') as HTMLInputElement;
    const priceInput = form.elements.namedItem('totalPrice') as HTMLInputElement;

    const p = products.find(prod => prod.id === Number(productId));
    if (p && priceInput && qtyInput) {
      const qty = Number(qtyInput.value);
      let unitPrice = p.base_price;
      if (unitId) {
        const unit = p.units.find(u => u.id === Number(unitId));
        if (unit) unitPrice = unit.price;
      }
      
      const subtotal = unitPrice * qty;
      const vatRate = Number(vatRateInput?.value || 0);
      const vatAmount = subtotal * (vatRate / 100);
      const shippingFee = Number(shippingFeeInput?.value || 0);
      
      if (vatAmountInput) vatAmountInput.value = vatAmount.toFixed(0);
      priceInput.value = (subtotal + vatAmount + shippingFee).toFixed(0);
    }
  };

  const handleSale = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productId = Number(formData.get('productId'));
    const customerId = formData.get('customerId') ? Number(formData.get('customerId')) : null;
    const quantity = Number(formData.get('quantity'));
    const unitId = formData.get('unitId') ? Number(formData.get('unitId')) : null;
    const totalPrice = Number(formData.get('totalPrice'));
    const vatRate = Number(formData.get('vatRate'));
    const vatAmount = Number(formData.get('vatAmount'));
    const shippingFee = Number(formData.get('shippingFee'));

    if (!productId || !quantity || isNaN(totalPrice)) {
      showNotification('error', 'Vui lòng điền đầy đủ thông tin đơn hàng');
      return;
    }

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, customerId, quantity, unitId, totalPrice, vatRate, vatAmount, shippingFee })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Đã ghi nhận đơn hàng thành công!');
        setIsSalesModalOpen(false);
        fetchData();
        fetchReportData();
        if (e.target instanceof HTMLFormElement) e.target.reset();
        setSelectedProduct(null);
      } else {
        showNotification('error', data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      showNotification('error', 'Lỗi kết nối server');
    }
  };

  const handleProduce = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productId = Number(formData.get('productId'));
    const quantity = Number(formData.get('quantity'));

    try {
      const res = await fetch('/api/produce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Sản xuất thành công, kho đã được cập nhật!');
        setIsProduceModalOpen(false);
        fetchData();
        fetchProductionLogs();
        fetchReportData();
        if (e.target instanceof HTMLFormElement) e.target.reset();
      } else {
        showNotification('error', data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      showNotification('error', 'Lỗi kết nối server');
    }
  };

  const [newUnits, setNewUnits] = useState<{ unit_name: string; conversion_factor: number; price: number }[]>([]);

  const handleCustomerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const customerData = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      address: formData.get('address'),
    };

    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });

      if (res.ok) {
        showNotification('success', editingCustomer ? 'Cập nhật khách hàng thành công' : 'Thêm khách hàng thành công');
        setIsCustomerModalOpen(false);
        setEditingCustomer(null);
        fetchCustomers();
      }
    } catch (error) {
      showNotification('error', 'Có lỗi xảy ra');
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('success', 'Xóa khách hàng thành công');
        fetchCustomers();
      }
    } catch (error) {
      showNotification('error', 'Có lỗi xảy ra');
    }
  };

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      name: formData.get('name'),
      type: formData.get('type'),
      base_unit: formData.get('base_unit'),
      base_price: Number(formData.get('base_price')),
      description: formData.get('description'),
      units: newUnits
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showNotification('success', 'Đã thêm sản phẩm mới!');
        setIsAddModalOpen(false);
        setNewUnits([]);
        fetchData();
      }
    } catch (error) {
      showNotification('error', 'Lỗi khi thêm sản phẩm');
    }
  };

  const handleEditProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      name: formData.get('name'),
      type: formData.get('type'),
      base_unit: formData.get('base_unit'),
      base_price: Number(formData.get('base_price')),
      description: formData.get('description'),
      units: newUnits
    };

    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showNotification('success', 'Đã cập nhật sản phẩm!');
        setIsEditModalOpen(false);
        setEditingProduct(null);
        setNewUnits([]);
        fetchData();
      }
    } catch (error) {
      showNotification('error', 'Lỗi khi cập nhật sản phẩm');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      showNotification('success', 'Đã xóa sản phẩm');
      fetchData();
    } catch (error) {
      showNotification('error', 'Lỗi khi xóa sản phẩm');
    }
  };

  const handleAddBOMItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const formData = new FormData(e.currentTarget);
    const payload = {
      parent_product_id: selectedProduct.id,
      component_product_id: Number(formData.get('componentId')),
      quantity: Number(formData.get('quantity'))
    };

    try {
      await fetch('/api/bom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showNotification('success', 'Đã cập nhật định mức');
      fetchBOM(selectedProduct.id);
      fetchBOMProducts();
      if (e.target instanceof HTMLFormElement) e.target.reset();
    } catch (error) {
      showNotification('error', 'Lỗi khi cập nhật định mức');
    }
  };

  const handleDeleteBOMItem = async (id: number) => {
    try {
      await fetch(`/api/bom/${id}`, { method: 'DELETE' });
      showNotification('success', 'Đã xóa định mức');
      if (selectedProduct) fetchBOM(selectedProduct.id);
      fetchBOMProducts();
    } catch (error) {
      showNotification('error', 'Lỗi khi xóa định mức');
    }
  };

  const SidebarItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        activeTab === id 
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
      {activeTab === id && <motion.div layoutId="active-pill" className="ml-auto"><ChevronRight size={16} /></motion.div>}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-emerald-600 p-2 rounded-lg text-white">
            <Box size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">SteelERP</h1>
        </div>

        <nav className="flex flex-col gap-2">
          <SidebarItem id="dashboard" icon={LayoutDashboard} label="Tổng quan" />
          <SidebarItem id="products" icon={Package} label="Sản phẩm" />
          <SidebarItem id="inventory" icon={Box} label="Kho hàng" />
          <SidebarItem id="production" icon={Factory} label="Sản xuất" />
          <SidebarItem id="sales" icon={ShoppingCart} label="Bán hàng" />
          <SidebarItem id="customers" icon={Users} label="Khách hàng" />
          <SidebarItem id="reports" icon={BarChart3} label="Báo cáo" />
        </nav>

        <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Hệ thống quản lý</p>
          <p className="text-sm font-semibold text-slate-700">V1.0.0 Stable</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 capitalize">
              {activeTab === 'dashboard' ? 'Bảng điều khiển' : 
               activeTab === 'products' ? 'Danh mục sản phẩm' :
               activeTab === 'inventory' ? 'Quản lý tồn kho' :
               activeTab === 'production' ? 'Lệnh sản xuất' : 
               activeTab === 'sales' ? 'Giao dịch bán hàng' :
               activeTab === 'customers' ? 'Quản lý khách hàng' : 'Báo cáo & Phân tích'}
            </h2>
            <p className="text-slate-500 mt-1">Chào mừng trở lại, quản trị viên.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all w-64"
              />
            </div>
            <button className="bg-white border border-slate-200 p-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
              <History size={20} />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <TrendingUp size={24} />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+12.5%</span>
                </div>
                <p className="text-slate-500 font-medium">Tổng doanh thu</p>
                <h3 className="text-3xl font-bold mt-1">{(stats?.totalSales ?? 0).toLocaleString()} VNĐ</h3>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Box size={24} />
                  </div>
                </div>
                <p className="text-slate-500 font-medium">Sản phẩm trong kho</p>
                <h3 className="text-3xl font-bold mt-1">{products.length} mặt hàng</h3>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                    <Factory size={24} />
                  </div>
                </div>
                <p className="text-slate-500 font-medium">Hàng sản xuất</p>
                <h3 className="text-3xl font-bold mt-1">{products.filter(p => p.type === 'manufactured').length} loại</h3>
              </div>

              <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-bottom border-slate-100 flex justify-between items-center">
                  <h4 className="font-bold text-lg">Giao dịch gần đây</h4>
                  <button className="text-emerald-600 font-semibold text-sm hover:underline">Xem tất cả</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Sản phẩm</th>
                        <th className="px-6 py-4 font-semibold">Số lượng</th>
                        <th className="px-6 py-4 font-semibold">Thành tiền</th>
                        <th className="px-6 py-4 font-semibold">Ngày</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.recentSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium">{sale.product_name}</td>
                          <td className="px-6 py-4">{sale.quantity}</td>
                          <td className="px-6 py-4 font-bold text-emerald-600">{(sale.total_price ?? 0).toLocaleString()} VNĐ</td>
                          <td className="px-6 py-4 text-slate-500 text-sm">{new Date(sale.date).toLocaleDateString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-lg mb-4">Tình trạng kho</h4>
                <div className="flex flex-col gap-4">
                  {products.slice(0, 4).map(p => (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${p.stock < 10 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium">{p.name}</p>
                          <span className="text-[10px] text-emerald-600 font-bold">{(p.base_price ?? 0).toLocaleString()} VNĐ</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1">
                          <div 
                            className={`h-full rounded-full ${p.stock < 10 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${Math.min((p.stock / 100) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-500">{p.stock} {p.base_unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div 
              key="products"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h4 className="font-bold text-lg">Danh sách sản phẩm</h4>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-colors font-medium"
                  >
                    <Plus size={18} /> Thêm sản phẩm
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Tên sản phẩm</th>
                        <th className="px-6 py-4 font-semibold">Loại</th>
                        <th className="px-6 py-4 font-semibold">Đơn vị gốc & Giá</th>
                        <th className="px-6 py-4 font-semibold">Đơn vị quy đổi & Giá</th>
                        <th className="px-6 py-4 font-semibold">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold">{p.name}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${
                              p.type === 'trading' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                            }`}>
                              {p.type === 'trading' ? 'Thương mại' : 'Sản xuất'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium">{p.base_unit}</span>
                              <span className="text-xs text-emerald-600 font-bold">{(p.base_price ?? 0).toLocaleString()} VNĐ</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {p.units.map(u => (
                                <div key={u.id} className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                  <span className="text-xs font-bold text-slate-700">{u.unit_name}</span>
                                  <span className="text-[10px] text-slate-400">x{u.conversion_factor}</span>
                                  <span className="text-xs text-emerald-600 font-bold ml-auto">{(u.price ?? 0).toLocaleString()} VNĐ</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setEditingProduct(p);
                                  setNewUnits(p.units.map(u => ({ unit_name: u.unit_name, conversion_factor: u.conversion_factor, price: u.price })));
                                  setIsEditModalOpen(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Chỉnh sửa sản phẩm"
                              >
                                <Edit2 size={18} />
                              </button>
                              {p.type === 'manufactured' && (
                                <button 
                                  onClick={() => {
                                    setSelectedProduct(p);
                                    fetchBOM(p.id);
                                    setActiveTab('production');
                                    setProductionSubTab('bom');
                                    setBomViewMode('manage');
                                  }}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Quản lý định mức (BOM)"
                                >
                                  <Factory size={18} />
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa sản phẩm"
                              >
                                <History size={18} className="rotate-45" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'inventory' && (
            <motion.div 
              key="inventory"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 gap-6"
            >
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h4 className="font-bold text-lg">Tồn kho hiện tại</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Sản phẩm</th>
                        <th className="px-6 py-4 font-semibold">Số lượng tồn</th>
                        <th className="px-6 py-4 font-semibold">Giá bán</th>
                        <th className="px-6 py-4 font-semibold">Đơn vị gốc</th>
                        <th className="px-6 py-4 font-semibold">Quy đổi đơn vị khác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold">{p.name}</td>
                          <td className="px-6 py-4">
                            <span className={`font-bold ${p.stock < 10 ? 'text-red-600' : 'text-slate-900'}`}>
                              {p.stock}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-emerald-600 font-bold">
                            {(p.base_price ?? 0).toLocaleString()} VNĐ
                          </td>
                          <td className="px-6 py-4 text-slate-500">{p.base_unit}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {p.units.map(u => (
                                <span key={u.id} className="text-xs text-slate-500">
                                  ≈ {(p.stock / u.conversion_factor).toFixed(2)} {u.unit_name}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'production' && (
            <motion.div 
              key="production"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Sub-tabs for Production */}
              <div className="flex gap-4 border-b border-slate-200 pb-px">
                <button 
                  onClick={() => setProductionSubTab('order')}
                  className={`px-6 py-3 font-bold text-sm transition-all relative ${
                    productionSubTab === 'order' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Lệnh sản xuất
                  {productionSubTab === 'order' && <motion.div layoutId="prod-sub-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />}
                </button>
                <button 
                  onClick={() => setProductionSubTab('bom')}
                  className={`px-6 py-3 font-bold text-sm transition-all relative ${
                    productionSubTab === 'bom' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Định mức (BOM)
                  {productionSubTab === 'bom' && <motion.div layoutId="prod-sub-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />}
                </button>
              </div>

              {productionSubTab === 'order' ? (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-xl">Lịch sử sản xuất</h4>
                    <button 
                      onClick={() => setIsProduceModalOpen(true)}
                      className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
                    >
                      <Factory size={20} /> Tạo lệnh sản xuất
                    </button>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-4 font-semibold">Sản phẩm</th>
                            <th className="px-6 py-4 font-semibold">Số lượng</th>
                            <th className="px-6 py-4 font-semibold">Thời gian</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {productionLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="px-6 py-4 font-bold">{log.product_name}</td>
                              <td className="px-6 py-4">{log.quantity}</td>
                              <td className="px-6 py-4 text-slate-500 text-sm">{(new Date(log.date)).toLocaleString('vi-VN')}</td>
                            </tr>
                          ))}
                          {productionLogs.length === 0 && <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic">Chưa có lịch sử sản xuất</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {bomViewMode === 'list' ? (
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h4 className="font-bold text-xl">Danh sách định mức (BOM)</h4>
                          <p className="text-sm text-slate-500">Các sản phẩm đã được thiết lập công thức sản xuất</p>
                        </div>
                        <button 
                          onClick={() => {
                            setBomViewMode('manage');
                            setSelectedProduct(null);
                            setBOMItems([]);
                          }}
                          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                        >
                          <Plus size={20} /> Thiết lập BOM mới
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                            <tr>
                              <th className="px-6 py-4 font-semibold">Sản phẩm thành phẩm</th>
                              <th className="px-6 py-4 font-semibold">Đơn vị gốc</th>
                              <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {bomProducts.map(p => (
                              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-900">{p.name}</td>
                                <td className="px-6 py-4 text-slate-500">{p.base_unit}</td>
                                <td className="px-6 py-4 text-right">
                                  <button 
                                    onClick={() => {
                                      setSelectedProduct(p);
                                      fetchBOM(p.id);
                                      setBomViewMode('manage');
                                    }}
                                    className="text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-lg font-bold text-sm transition-all"
                                  >
                                    Chỉnh sửa BOM
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {bomProducts.length === 0 && (
                              <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">
                                  Chưa có sản phẩm nào được thiết lập định mức
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-8">
                        <button 
                          onClick={() => setBomViewMode('list')}
                          className="text-slate-500 hover:text-slate-700 flex items-center gap-2 font-bold text-sm"
                        >
                          <ChevronRight size={20} className="rotate-180" /> Quay lại danh sách
                        </button>
                        <h4 className="font-bold text-xl">Thiết lập định mức sản xuất</h4>
                      </div>

                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="w-full md:w-1/3 space-y-6">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">Chọn sản phẩm sản xuất</label>
                              <select 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                value={selectedProduct?.id || ''}
                                onChange={(e) => {
                                  const p = products.find(prod => prod.id === Number(e.target.value));
                                  setSelectedProduct(p || null);
                                  if (p) fetchBOM(p.id);
                                }}
                              >
                                <option value="">Chọn sản phẩm...</option>
                                {products.filter(p => p.type === 'manufactured').map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </div>

                            {selectedProduct && (
                              <form onSubmit={handleAddBOMItem} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thêm nguyên liệu cho: {selectedProduct.name}</p>
                                <div>
                                  <label className="block text-sm font-semibold mb-1">Nguyên liệu</label>
                                  <select name="componentId" required className="w-full px-4 py-2 border rounded-xl bg-white">
                                    <option value="">Chọn nguyên liệu...</option>
                                    {products.filter(p => p.id !== selectedProduct.id).map(p => (
                                      <option key={p.id} value={p.id}>{p.name} ({p.base_unit})</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold mb-1">Số lượng (trên 1 {selectedProduct.base_unit})</label>
                                  <input type="number" name="quantity" step="0.01" required className="w-full px-4 py-2 border rounded-xl bg-white" placeholder="0.00" />
                                </div>
                                <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-xl font-bold hover:bg-slate-800 transition-all">
                                  Thêm vào định mức
                                </button>
                              </form>
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <h4 className="font-bold text-xl mb-6">Danh sách định mức hiện tại</h4>
                          {!selectedProduct ? (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                              <Package size={48} className="mb-2 opacity-20" />
                              <p>Vui lòng chọn sản phẩm để xem định mức</p>
                            </div>
                          ) : (
                            <div className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden">
                              <table className="w-full text-left">
                                <thead className="bg-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                                  <tr>
                                    <th className="px-6 py-4 font-semibold">Nguyên liệu</th>
                                    <th className="px-6 py-4 font-semibold">Định mức</th>
                                    <th className="px-6 py-4 font-semibold">Tồn kho</th>
                                    <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                  {bomItems.map(item => {
                                    const component = products.find(p => p.id === item.component_product_id);
                                    return (
                                      <tr key={item.id} className="hover:bg-slate-100 transition-colors">
                                        <td className="px-6 py-4 font-bold">{item.component_name}</td>
                                        <td className="px-6 py-4">
                                          <span className="font-medium text-emerald-600">{item.quantity}</span> {item.base_unit}
                                        </td>
                                        <td className="px-6 py-4">
                                          <span className={`text-sm ${component && component.stock < 10 ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                                            {component?.stock || 0} {item.base_unit}
                                          </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                          <button 
                                            onClick={() => handleDeleteBOMItem(item.id)}
                                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                                          >
                                            <Plus size={18} className="rotate-45" />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {bomItems.length === 0 && (
                                    <tr>
                                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                                        Chưa có định mức cho sản phẩm này
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'sales' && (
            <motion.div 
              key="sales"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xl">Lịch sử bán hàng</h4>
                <button 
                  onClick={() => {
                    setIsSalesModalOpen(true);
                    setSelectedProduct(null);
                  }}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
                >
                  <ShoppingCart size={20} /> Tạo đơn hàng mới
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Sản phẩm</th>
                        <th className="px-6 py-4 font-semibold">Khách hàng</th>
                        <th className="px-6 py-4 font-semibold">Số lượng</th>
                        <th className="px-6 py-4 font-semibold text-right">Tổng tiền</th>
                        <th className="px-6 py-4 font-semibold text-right">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.recentSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{sale.product_name}</td>
                          <td className="px-6 py-4 text-slate-600">{sale.customer_name || 'Khách lẻ'}</td>
                          <td className="px-6 py-4 text-slate-600 font-medium">{sale.quantity.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-bold text-emerald-600">{(sale.total_price ?? 0).toLocaleString()} VNĐ</td>
                          <td className="px-6 py-4 text-right text-slate-400 text-xs">
                            {new Date(sale.date).toLocaleString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                      {stats.recentSales.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                            Chưa có đơn hàng nào được ghi nhận
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'customers' && (
            <motion.div 
              key="customers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xl">Danh sách khách hàng</h4>
                <button 
                  onClick={() => {
                    setEditingCustomer(null);
                    setIsCustomerModalOpen(true);
                  }}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
                >
                  <Plus size={20} /> Thêm khách hàng
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customers.map(customer => (
                  <div key={customer.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <Users size={24} />
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingCustomer(customer);
                            setIsCustomerModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <AlertCircle size={18} />
                        </button>
                      </div>
                    </div>
                    <h5 className="font-bold text-lg text-slate-900 mb-4">{customer.name}</h5>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Phone size={16} className="text-slate-400" />
                        {customer.phone || 'Chưa cập nhật'}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Mail size={16} className="text-slate-400" />
                        {customer.email || 'Chưa cập nhật'}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <MapPin size={16} className="text-slate-400" />
                        {customer.address || 'Chưa cập nhật'}
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-sm text-slate-500">Công nợ:</span>
                      <span className={`font-bold ${customer.debt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {(customer.debt ?? 0).toLocaleString()} VNĐ
                      </span>
                    </div>
                  </div>
                ))}
                {customers.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <Users size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">Chưa có khách hàng nào trong danh sách</p>
                    <button 
                      onClick={() => setIsCustomerModalOpen(true)}
                      className="mt-4 text-emerald-600 font-bold hover:underline"
                    >
                      Thêm khách hàng ngay
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div 
              key="reports"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xl">Báo cáo & Phân tích</h4>
                <button 
                  onClick={fetchReportData}
                  className="bg-white text-slate-600 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 text-sm font-bold"
                >
                  <ArrowRightLeft size={16} className="rotate-90" /> Làm mới dữ liệu
                </button>
              </div>

              {reportData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Doanh thu theo ngày */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h5 className="font-bold text-slate-800 mb-6">Doanh thu 30 ngày gần nhất</h5>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.dailySales}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="day" 
                            tick={{ fontSize: 10, fill: '#64748b' }} 
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => value.split('-').slice(1).reverse().join('/')}
                          />
                          <YAxis 
                            tick={{ fontSize: 10, fill: '#64748b' }} 
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any) => [new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ', 'Doanh thu']}
                          />
                          <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Doanh thu theo sản phẩm */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h5 className="font-bold text-slate-800 mb-6">Top sản phẩm bán chạy (Doanh thu)</h5>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={reportData.salesByProduct}
                            dataKey="total_revenue"
                            nameKey="product_name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ product_name, percent }) => `${product_name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {reportData.salesByProduct.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ'} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Doanh thu theo khách hàng */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h5 className="font-bold text-slate-800 mb-6">Phân bổ doanh thu theo khách hàng</h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                            <th className="pb-4">Khách hàng</th>
                            <th className="pb-4">Số đơn</th>
                            <th className="pb-4 text-right">Tổng doanh thu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {reportData.salesByCustomer.map((c: any, i: number) => (
                            <tr key={i} className="text-sm">
                              <td className="py-4 font-medium text-slate-900">{c.customer_name}</td>
                              <td className="py-4 text-slate-600">{c.order_count}</td>
                              <td className="py-4 text-right font-bold text-emerald-600">{c.total_revenue.toLocaleString()} VNĐ</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Giá trị tồn kho */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h5 className="font-bold text-slate-800 mb-6">Ước tính giá trị tồn kho</h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                            <th className="pb-4">Sản phẩm</th>
                            <th className="pb-4">Tồn kho</th>
                            <th className="pb-4 text-right">Giá trị ước tính</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {reportData.inventoryStatus.map((item: any, i: number) => (
                            <tr key={i} className="text-sm">
                              <td className="py-4 font-medium text-slate-900">{item.name}</td>
                              <td className="py-4 text-slate-600">{item.quantity} {item.base_unit}</td>
                              <td className="py-4 text-right font-bold text-blue-600">{item.estimated_value.toLocaleString()} VNĐ</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">Thêm sản phẩm mới</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 space-y-4 max-h-[80vh] overflow-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">Tên sản phẩm</label>
                  <input name="name" required className="w-full px-4 py-2 border rounded-xl" placeholder="Ví dụ: Sắt Phi 12" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Loại</label>
                  <select name="type" className="w-full px-4 py-2 border rounded-xl">
                    <option value="trading">Thương mại</option>
                    <option value="manufactured">Sản xuất</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Đơn vị gốc</label>
                  <select name="base_unit" required className="w-full px-4 py-2 border rounded-xl">
                    <option value="">Chọn đơn vị...</option>
                    {COMMON_UNITS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">Giá bán đơn vị gốc (VNĐ)</label>
                  <input type="number" name="base_price" required className="w-full px-4 py-2 border rounded-xl" placeholder="0" />
                </div>
                
                <div className="col-span-2 border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-slate-700">Đơn vị quy đổi</label>
                    <button 
                      type="button"
                      onClick={() => setNewUnits([...newUnits, { unit_name: '', conversion_factor: 1, price: 0 }])}
                      className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg flex items-center gap-1"
                    >
                      <Plus size={14} /> Thêm đơn vị
                    </button>
                  </div>
                  <div className="space-y-3">
                    {newUnits.map((u, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 relative">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">Tên ĐV</label>
                          <select 
                            value={u.unit_name}
                            onChange={(e) => {
                              const updated = [...newUnits];
                              updated[idx].unit_name = e.target.value;
                              setNewUnits(updated);
                            }}
                            className="w-full px-2 py-1 text-sm border rounded-lg"
                          >
                            <option value="">Chọn...</option>
                            {COMMON_UNITS.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">Quy đổi</label>
                          <input 
                            type="number"
                            value={u.conversion_factor}
                            onChange={(e) => {
                              const updated = [...newUnits];
                              updated[idx].conversion_factor = Number(e.target.value);
                              setNewUnits(updated);
                            }}
                            className="w-full px-2 py-1 text-sm border rounded-lg" placeholder="1000" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">Giá bán</label>
                          <input 
                            type="number"
                            value={u.price}
                            onChange={(e) => {
                              const updated = [...newUnits];
                              updated[idx].price = Number(e.target.value);
                              setNewUnits(updated);
                            }}
                            className="w-full px-2 py-1 text-sm border rounded-lg" placeholder="0" 
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => setNewUnits(newUnits.filter((_, i) => i !== idx))}
                          className="absolute -top-2 -right-2 bg-white border border-slate-200 text-red-500 rounded-full p-1 shadow-sm"
                        >
                          <Plus size={12} className="rotate-45" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">Mô tả</label>
                  <textarea name="description" className="w-full px-4 py-2 border rounded-xl" rows={2}></textarea>
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700">
                Lưu sản phẩm
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">Chỉnh sửa sản phẩm</h3>
              <button onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); }} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleEditProduct} className="p-6 space-y-4 max-h-[80vh] overflow-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">Tên sản phẩm</label>
                  <input name="name" defaultValue={editingProduct.name} required className="w-full px-4 py-2 border rounded-xl" placeholder="Ví dụ: Sắt Phi 12" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Loại</label>
                  <select name="type" defaultValue={editingProduct.type} className="w-full px-4 py-2 border rounded-xl">
                    <option value="trading">Thương mại</option>
                    <option value="manufactured">Sản xuất</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Đơn vị gốc</label>
                  <select name="base_unit" defaultValue={editingProduct.base_unit} required className="w-full px-4 py-2 border rounded-xl">
                    <option value="">Chọn đơn vị...</option>
                    {COMMON_UNITS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">Giá bán đơn vị gốc (VNĐ)</label>
                  <input type="number" name="base_price" defaultValue={editingProduct.base_price} required className="w-full px-4 py-2 border rounded-xl" placeholder="0" />
                </div>
                
                <div className="col-span-2 border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-slate-700">Đơn vị quy đổi</label>
                    <button 
                      type="button"
                      onClick={() => setNewUnits([...newUnits, { unit_name: '', conversion_factor: 1, price: 0 }])}
                      className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg flex items-center gap-1"
                    >
                      <Plus size={14} /> Thêm đơn vị
                    </button>
                  </div>
                  <div className="space-y-3">
                    {newUnits.map((u, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 relative">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">Tên ĐV</label>
                          <select 
                            value={u.unit_name}
                            onChange={(e) => {
                              const updated = [...newUnits];
                              updated[idx].unit_name = e.target.value;
                              setNewUnits(updated);
                            }}
                            className="w-full px-2 py-1 text-sm border rounded-lg"
                          >
                            <option value="">Chọn...</option>
                            {COMMON_UNITS.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">Quy đổi</label>
                          <input 
                            type="number" 
                            value={u.conversion_factor}
                            onChange={(e) => {
                              const updated = [...newUnits];
                              updated[idx].conversion_factor = Number(e.target.value);
                              setNewUnits(updated);
                            }}
                            className="w-full px-2 py-1 text-sm border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">Giá bán</label>
                          <input 
                            type="number" 
                            value={u.price}
                            onChange={(e) => {
                              const updated = [...newUnits];
                              updated[idx].price = Number(e.target.value);
                              setNewUnits(updated);
                            }}
                            className="w-full px-2 py-1 text-sm border rounded-lg"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => setNewUnits(newUnits.filter((_, i) => i !== idx))}
                          className="absolute -top-2 -right-2 bg-white border shadow-sm rounded-full p-1 text-red-500 hover:bg-red-50"
                        >
                          <Plus size={12} className="rotate-45" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">Mô tả</label>
                  <textarea name="description" defaultValue={editingProduct.description} className="w-full px-4 py-2 border rounded-xl" rows={2} />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); }} className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all">Hủy</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">Lưu thay đổi</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Produce Modal */}
      {isProduceModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">Tạo lệnh sản xuất</h3>
              <button onClick={() => setIsProduceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleProduce} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Sản phẩm cần sản xuất</label>
                <select 
                  name="productId" 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="">Chọn sản phẩm...</option>
                  {products.filter(p => p.type === 'manufactured').map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Số lượng sản xuất (Đơn vị gốc)</label>
                <input 
                  type="number" 
                  name="quantity" 
                  required 
                  min="1"
                  placeholder="Nhập số lượng..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                <AlertCircle className="text-amber-600 shrink-0" size={20} />
                <p className="text-sm text-amber-800">
                  Hệ thống sẽ tự động trừ nguyên liệu trong kho dựa trên định mức (BOM) đã thiết lập.
                </p>
              </div>
              <button 
                type="submit" 
                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-[0.98]"
              >
                Xác nhận sản xuất
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Sales Modal */}
      {isSalesModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">Tạo đơn hàng mới</h3>
              <button onClick={() => setIsSalesModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSale} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Chọn khách hàng</label>
                <select 
                  name="customerId" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="">Khách lẻ (Không lưu tên)</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.phone ? `- ${c.phone}` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Chọn sản phẩm</label>
                <select 
                  name="productId" 
                  required
                  onChange={(e) => {
                    const p = products.find(prod => prod.id === Number(e.target.value));
                    setSelectedProduct(p || null);
                    const form = e.target.form as HTMLFormElement;
                    updateSalesTotal(form);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="">Chọn sản phẩm...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Tồn: {p.stock} {p.base_unit})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Số lượng</label>
                <input 
                  type="number" 
                  name="quantity" 
                  required 
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  onChange={(e) => {
                    const form = e.target.form as HTMLFormElement;
                    updateSalesTotal(form);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Đơn vị tính</label>
                <select 
                  name="unitId"
                  onChange={(e) => {
                    const form = e.target.form as HTMLFormElement;
                    updateSalesTotal(form);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="">Đơn vị gốc ({selectedProduct?.base_unit})</option>
                  {selectedProduct?.units.map(u => (
                    <option key={u.id} value={u.id}>{u.unit_name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tổng giá trị đơn hàng (VNĐ)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">VAT (%)</label>
                    <input 
                      type="number" 
                      name="vatRate" 
                      defaultValue="0"
                      min="0"
                      max="100"
                      onChange={(e) => {
                        const form = e.target.form as HTMLFormElement;
                        updateSalesTotal(form);
                      }}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tiền VAT</label>
                    <input 
                      type="number" 
                      name="vatAmount" 
                      readOnly
                      className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl outline-none text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phí vận chuyển</label>
                    <input 
                      type="number" 
                      name="shippingFee" 
                      defaultValue="0"
                      min="0"
                      onChange={(e) => {
                        const form = e.target.form as HTMLFormElement;
                        updateSalesTotal(form);
                      }}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <input 
                  type="number" 
                  name="totalPrice" 
                  required 
                  placeholder="Nhập giá trị..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-emerald-600 text-lg"
                />
              </div>

              <button 
                type="submit" 
                className="md:col-span-2 bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} /> Hoàn tất đơn hàng
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingCustomer ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới'}</h3>
              <button onClick={() => { setIsCustomerModalOpen(false); setEditingCustomer(null); }} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleCustomerSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên khách hàng *</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  defaultValue={editingCustomer?.name}
                  placeholder="Nhập tên khách hàng..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    defaultValue={editingCustomer?.phone}
                    placeholder="090..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    name="email" 
                    defaultValue={editingCustomer?.email}
                    placeholder="example@mail.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Địa chỉ</label>
                <textarea 
                  name="address" 
                  defaultValue={editingCustomer?.address}
                  placeholder="Nhập địa chỉ..."
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setIsCustomerModalOpen(false); setEditingCustomer(null); }} 
                  className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  {editingCustomer ? 'Lưu thay đổi' : 'Thêm khách hàng'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`fixed bottom-8 right-8 p-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 border ${
              notification.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <p className="font-medium">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
