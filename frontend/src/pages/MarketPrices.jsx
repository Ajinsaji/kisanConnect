import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import FarmerLayout from "../components/FarmerLayout";
import Footer from "../components/Footer";
import { marketPricesAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { 
  MapPinIcon, 
  CurrencyRupeeIcon, 
  ChartBarIcon,
  ArrowPathIcon 
} from "@heroicons/react/24/outline";

function MarketPrices() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";
  const isFarmer = user?.role === "farmer";
  
  const [data, setData] = useState({ prices: [], districts: [], commodities: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [district, setDistrict] = useState("");
  const [commodity, setCommodity] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadMarketPrices = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await marketPricesAPI.get(district || null, commodity || null);
      setData(res || { prices: [], districts: [], commodities: [], count: 0 });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Failed to load market prices");
      setData({ prices: [], districts: [], commodities: [], count: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketPrices();
  }, [district, commodity]);

  const handleBackClick = () => {
    if (isAdmin) navigate("/admin-dashboard");
    else if (isFarmer) navigate("/farmer-dashboard");
    else navigate("/customer-dashboard");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f3f7f4]">
        {isAdmin && <AdminNavbar />}
        {isFarmer && <div className="md:ml-64" />}
        <p className="text-center py-24 text-gray-600">Loading…</p>
      </div>
    );
  }

  // For farmers, use FarmerLayout; for admins, use AdminNavbar + Footer
  if (isFarmer) {
    return (
      <FarmerLayout activeTab="market-prices">
        <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Kerala Market Prices
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Real-time agricultural commodity prices from Government of India (Agmarknet)
              </p>
            </div>
          </div>

          {/* Filters and Refresh */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                  District
                </label>
                <select
                  id="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                >
                  <option value="">All Districts</option>
                  {(data.districts || []).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="commodity" className="block text-sm font-medium text-gray-700 mb-1">
                  Commodity
                </label>
                <select
                  id="commodity"
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                >
                  <option value="">All Commodities</option>
                  {(data.commodities || []).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadMarketPrices}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                {lastUpdated && (
                  <span className="text-xs text-gray-500">
                    {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            {data.count > 0 && (
              <div className="mt-3 text-sm text-gray-600">
                Showing <span className="font-semibold">{data.count}</span> price records
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-center py-12 text-gray-600">Loading market prices…</p>
        ) : !data.prices || data.prices.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">
            <MapPinIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="font-medium mb-1">No market data available</p>
            <p className="text-sm">Try changing the filters or refresh the data</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    District
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Market
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Commodity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Variety
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Min Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Modal Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Max Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.prices.map((row, i) => (
                  <tr key={`${row.district}-${row.commodity}-${i}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {row.district}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {row.market || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {row.commodity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {row.variety || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700">
                      <div className="flex items-center justify-end gap-1">
                        <CurrencyRupeeIcon className="w-3 h-3" />
                        {row.min_price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">{row.unit}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-green-700">
                      <div className="flex items-center justify-end gap-1">
                        <CurrencyRupeeIcon className="w-4 h-4" />
                        {row.modal_price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">{row.unit}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700">
                      <div className="flex items-center justify-end gap-1">
                        <CurrencyRupeeIcon className="w-3 h-3" />
                        {row.max_price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">{row.unit}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {row.arrival_date || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Info card about data source */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Data Source:</strong> Agricultural Market prices from Government of India 
            (Agmarknet / data.gov.in). Prices are updated daily. Modal price represents the most 
            common trading price. Prices shown are in Rupees per Quintal (100 kg) or per unit as indicated.
          </p>
        </div>

        <div className="mt-6 flex justify-start">
          <button
            type="button"
            onClick={handleBackClick}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
      </FarmerLayout>
    );
  }

  // Admin view
  return (
    <div className="min-h-screen bg-[#f3f7f4]">
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Same content as farmer view */}
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Kerala Market Prices
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Real-time agricultural commodity prices from Government of India (Agmarknet)
              </p>
            </div>
          </div>

          {/* Filters and Refresh */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                  District
                </label>
                <select
                  id="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                >
                  <option value="">All Districts</option>
                  {(data.districts || []).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="commodity" className="block text-sm font-medium text-gray-700 mb-1">
                  Commodity
                </label>
                <select
                  id="commodity"
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                >
                  <option value="">All Commodities</option>
                  {(data.commodities || []).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadMarketPrices}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                {lastUpdated && (
                  <span className="text-xs text-gray-500">
                    {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            {data.count > 0 && (
              <div className="mt-3 text-sm text-gray-600">
                Showing <span className="font-semibold">{data.count}</span> price records
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-center py-12 text-gray-600">Loading market prices…</p>
        ) : !data.prices || data.prices.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">
            <MapPinIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="font-medium mb-1">No market data available</p>
            <p className="text-sm">Try changing the filters or refresh the data</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    District
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Market
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Commodity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Variety
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Min Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Modal Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Max Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.prices.map((row, i) => (
                  <tr key={`${row.district}-${row.commodity}-${i}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {row.district}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {row.market || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {row.commodity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {row.variety || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700">
                      <div className="flex items-center justify-end gap-1">
                        <CurrencyRupeeIcon className="w-3 h-3" />
                        {row.min_price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">{row.unit}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-green-700">
                      <div className="flex items-center justify-end gap-1">
                        <CurrencyRupeeIcon className="w-4 h-4" />
                        {row.modal_price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">{row.unit}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700">
                      <div className="flex items-center justify-end gap-1">
                        <CurrencyRupeeIcon className="w-3 h-3" />
                        {row.max_price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">{row.unit}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {row.arrival_date || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Info card about data source */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Data Source:</strong> Agricultural Market prices from Government of India 
            (Agmarknet / data.gov.in). Prices are updated daily. Modal price represents the most 
            common trading price. Prices shown are in Rupees per Quintal (100 kg) or per unit as indicated.
          </p>
        </div>

        <div className="mt-6 flex justify-start">
          <button
            type="button"
            onClick={handleBackClick}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default MarketPrices;
