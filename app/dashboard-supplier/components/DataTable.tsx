export default function DataTable({ data, getStatus }: { data: any[], getStatus: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "bg-red-100 text-red-700";
      case "warning": return "bg-yellow-100 text-yellow-700";
      case "blocked": return "bg-orange-100 text-orange-700";
      default: return "bg-green-100 text-green-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "critical": return "CRITICAL";
      case "warning": return "WARNING";
      case "blocked": return "BLOCKED";
      default: return "SAFE";
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border overflow-y-auto max-h-[400px]">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-white border-b z-10">
          <tr>
            <th className="p-2">Material Code</th>
            <th className="p-2">Description</th>
            <th className="p-2">Vendor</th>
            <th className="p-2">Vendor Stock</th>
            <th className="p-2">AMU QTY</th>
            <th className="p-2">FMRS</th>
            <th className="p-2">Vendor SS Qty</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((m, i) => {
            const status = getStatus(m);
            return (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-2 font-medium">{m.material}</td>
                <td className="p-2">{m.materialDescription || "-"}</td>
                <td className="p-2">{m.vendorCode}</td>
                <td className="p-2">{m.vendorStock}</td>
                <td className="p-2">{m.amu || 0}</td>
                <td className="p-2">{m.fmrs || "-"}</td>
                <td className="p-2">{m.ss || 0}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(status)}`}>
                    {getStatusLabel(status)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}