const LogosStrip = () => {
  const brands = ["DealerTrack", "RouteOne", "vAuto", "AutoTrader", "Cars.com"];

  return (
    <div className="border-t border-b border-border bg-surface py-[26px] px-[clamp(24px,5%,80px)]">
      <div className="max-w-[1120px] mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-subtle text-center mb-4">
          Integrates with your existing tools
        </p>
        <div className="flex items-center justify-center gap-10 flex-wrap">
          {brands.map((brand) => (
            <span key={brand} className="text-sm font-semibold text-subtle/60 tracking-[-0.01em]">
              {brand}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogosStrip;
