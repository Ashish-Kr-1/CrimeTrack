import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";
import { motion } from "framer-motion";
import { Search, Bell, Crosshair, User, Menu } from "lucide-react";

function Navbar({ onToggleSidebar }) {
  const { diagnosticReport } = useContext(CDRContext);

  return (
    <div
      className="glass-card mb-6 flex h-[68px] items-center justify-between px-4 md:px-6 gap-4"
      style={{ borderRadius: "14px" }}
    >
      {/* Left section: Hamburger Menu and Search */}
      <div className="flex items-center gap-3 flex-1 lg:flex-none">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg border border-border p-2 text-text-muted hover:text-accent hover:border-border-hover lg:hidden"
        >
          <Menu size={15} />
        </button>

        <div className="relative flex items-center w-full max-w-[360px]">
          <Search
            size={15}
            className="absolute left-3.5 text-text-subtle"
            strokeWidth={2.5}
          />
          <input
            id="nav-search"
            type="text"
            placeholder="Search phone numbers, cells, IMEIs..."
            className="w-full rounded-xl border border-border bg-dark/60 px-4 py-2.5 pl-10 text-[13px] font-medium text-text outline-none transition-colors duration-200 placeholder:text-text-subtle focus:border-accent"
          />
          <span className="hidden md:inline absolute right-3 rounded border border-border bg-dark-elevated px-1.5 py-0.5 text-[10px] font-semibold text-text-subtle">
            ⌘K
          </span>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {/* Notification bell */}
        <button
          id="nav-notifications"
          className="relative rounded-lg border border-border p-2 text-text-muted transition-colors hover:border-border-hover hover:text-accent"
        >
          <Bell size={16} strokeWidth={2} />
          {diagnosticReport && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ backgroundColor: "#c18833" }}
            >
              {diagnosticReport.risk_summary.red_flags_count}
            </span>
          )}
        </button>

        {/* Active Target Badge */}
        {diagnosticReport && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold"
            style={{
              backgroundColor: "rgba(193, 136, 51, 0.1)",
              borderColor: "rgba(193, 136, 51, 0.25)",
              color: "#c18833",
            }}
          >
            <Crosshair size={13} strokeWidth={2.5} className="hidden sm:inline" />
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{
                  backgroundColor: "#c18833",
                  animation: "pulse-glow 2s ease-in-out infinite",
                }}
              />
              <span
                className="relative inline-flex h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "#c18833" }}
              />
            </span>
            <span className="font-mono">
              <span className="hidden md:inline">TARGET: </span>
              {diagnosticReport.target_phone}
            </span>
          </motion.div>
        )}

        {/* User badge */}
        <div
          id="nav-user"
          className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border px-3 py-1.5 transition-all hover:border-border-hover"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-navy text-[11px] font-bold text-white">
            <User size={13} />
          </div>
          <span className="hidden sm:inline text-[13px] font-semibold text-text">
            Analyst
          </span>
        </div>
      </div>
    </div>
  );
}

export default Navbar;