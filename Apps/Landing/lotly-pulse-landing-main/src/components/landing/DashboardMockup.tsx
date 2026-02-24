const DashboardMockup = () => {
  return (
    <div className="relative z-[2] mt-16 max-w-[920px] mx-auto">
      <div className="bg-background border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Browser bar */}
        <div className="h-11 bg-surface border-b border-border flex items-center px-4 gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          <div className="flex-1 flex justify-center">
            <div className="bg-background border border-border rounded-md px-4 py-1 text-xs font-mono text-muted-foreground max-w-[240px] w-full text-center">
              app.lotlypulse.com
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="grid grid-cols-1 md:grid-cols-[196px_1fr] min-h-[320px]">
          {/* Sidebar */}
          <div className="hidden md:block bg-surface border-r border-border py-4">
            <div className="px-3.5 pb-3.5 border-b border-border mb-2.5">
              <span className="text-sm font-bold text-ink opacity-75">Pulse</span>
            </div>
            {[
              { label: "Dashboard", active: true, icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
              { label: "Inventory", active: false, icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
              { label: "Leads", active: false, icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" },
              { label: "Analytics", active: false, icon: "M18 20V10M12 20V4M6 20v-6" },
              { label: "Settings", active: false, icon: "M12 15a3 3 0 100-6 3 3 0 000 6z" },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 py-[7px] px-3.5 text-[13px] font-medium rounded-md mx-1.5 mb-0.5 ${
                  item.active
                    ? "bg-blue-pale text-blue"
                    : "text-muted-foreground"
                }`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <path d={item.icon} />
                </svg>
                {item.label}
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="p-[22px] bg-background">
            <h3 className="text-[15px] font-bold mb-[18px] tracking-[-0.02em] text-ink">
              Overview
            </h3>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2.5 mb-[18px]">
              {[
                { label: "Active Listings", value: "2,847", change: "+12.4%", up: true },
                { label: "Leads This Month", value: "394", change: "+8.1%", up: true },
                { label: "Avg. Days on Lot", value: "23", change: "-3.2 days", up: true },
              ].map((stat) => (
                <div key={stat.label} className="bg-surface border border-border rounded-lg p-3">
                  <div className="text-[10.5px] font-semibold text-subtle uppercase tracking-[0.07em] mb-1">
                    {stat.label}
                  </div>
                  <div className="text-[22px] font-bold tracking-[-0.03em] text-ink">
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-[#16A34A] mt-0.5">{stat.change}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-4 bg-surface border-b border-border py-[7px] px-3 text-[10.5px] font-semibold text-subtle uppercase tracking-[0.06em]">
                <span>Vehicle</span>
                <span>Status</span>
                <span>Price</span>
                <span>Leads</span>
              </div>
              {[
                { vehicle: "2024 BMW X5 xDrive40i", status: "Active", statusClass: "bg-[#DCFCE7] text-[#15803D]", price: "$62,495", leads: "12" },
                { vehicle: "2024 Mercedes GLE 350", status: "Pending", statusClass: "bg-blue-pale text-blue", price: "$58,900", leads: "8" },
                { vehicle: "2023 Audi Q7 Premium", status: "Sold", statusClass: "bg-border-2 text-muted-foreground", price: "$54,200", leads: "—" },
              ].map((row) => (
                <div key={row.vehicle} className="grid grid-cols-4 py-[9px] px-3 text-[12.5px] border-b border-border-2 last:border-b-0 items-center text-ink-3">
                  <span className="font-semibold text-ink">{row.vehicle}</span>
                  <span>
                    <span className={`inline-flex items-center px-2 py-[2px] rounded-full text-[11px] font-semibold ${row.statusClass}`}>
                      {row.status}
                    </span>
                  </span>
                  <span>{row.price}</span>
                  <span>{row.leads}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMockup;
