import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import confetti from "canvas-confetti";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ============== CONTEXT ==============
const AppContext = createContext();

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

// ============== COUNTRIES DATA ==============
const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "CN", name: "China" },
  { code: "IN", name: "India" },
  { code: "TH", name: "Thailand" },
  { code: "ID", name: "Indonesia" },
  { code: "VN", name: "Vietnam" },
  { code: "PH", name: "Philippines" },
  { code: "SG", name: "Singapore" },
  { code: "MY", name: "Malaysia" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "AR", name: "Argentina" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "RU", name: "Russia" },
  { code: "NZ", name: "New Zealand" },
  { code: "ZA", name: "South Africa" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "IE", name: "Ireland" },
  { code: "PT", name: "Portugal" },
  { code: "GR", name: "Greece" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czech Republic" },
  { code: "HU", name: "Hungary" },
  { code: "TR", name: "Turkey" },
  { code: "EG", name: "Egypt" },
  { code: "IL", name: "Israel" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "CO", name: "Colombia" },
  { code: "CL", name: "Chile" },
  { code: "PE", name: "Peru" },
  { code: "HK", name: "Hong Kong" },
  { code: "TW", name: "Taiwan" },
];

const VISA_TYPES = ["Visa-Free", "Tourist Visa", "Business Visa", "eVisa", "Visa on Arrival"];

// ============== UTILITY FUNCTIONS ==============
const triggerConfetti = () => {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#0000ee", "#10b981", "#f59e0b"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#0000ee", "#10b981", "#f59e0b"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
};

const calculateDaysLeft = (exitDate) => {
  const now = new Date();
  const exit = new Date(exitDate);
  const diffTime = exit - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const calculateProgress = (entryDate, exitDate) => {
  const entry = new Date(entryDate);
  const exit = new Date(exitDate);
  const now = new Date();
  const totalDays = (exit - entry) / (1000 * 60 * 60 * 24);
  const daysUsed = (now - entry) / (1000 * 60 * 60 * 24);
  return Math.min(100, Math.max(0, (daysUsed / totalDays) * 100));
};

const getStatusColor = (daysLeft) => {
  if (daysLeft >= 14) return "#10b981"; // Green
  if (daysLeft >= 7) return "#f59e0b"; // Yellow
  if (daysLeft >= 3) return "#fb923c"; // Orange
  return "#ef4444"; // Red
};

const getStatusText = (daysLeft) => {
  if (daysLeft >= 14) return "On Track";
  if (daysLeft >= 7) return "Plan Exit Soon";
  if (daysLeft >= 3) return "Urgent: Exit Soon";
  if (daysLeft >= 1) return "CRITICAL: Exit Now";
  return "EXPIRED TODAY";
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// ============== ICONS ==============
const HomeIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#0000ee" : "#6b7280"} strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const SearchIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#0000ee" : "#6b7280"} strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const SettingsIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#0000ee" : "#6b7280"} strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const BellIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0000ee" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const PassportIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0000ee" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <circle cx="12" cy="10" r="3" />
    <path d="M7 18h10" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0000ee" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const CreditCardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0000ee" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const HelpIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0000ee" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const LogOutIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// ============== COMPONENTS ==============

// Country Flag Component
const CountryFlag = ({ code, size = 48 }) => (
  <img
    src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
    alt={code}
    style={{ width: size, height: size * 0.75, objectFit: "cover", borderRadius: 4 }}
  />
);

// Progress Ring Component
const ProgressRing = ({ progress, daysLeft, color, size = 250, strokeWidth = 16 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const isPulsing = daysLeft <= 2;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Background Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`progress-ring ${isPulsing ? "animate-pulse-ring" : ""}`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 80, fontWeight: "bold", color: "#111827", lineHeight: 1 }}>
          {daysLeft < 0 ? 0 : daysLeft}
        </div>
        <div style={{ fontSize: 16, color: "#6b7280", fontWeight: 500, marginTop: 4 }}>
          DAYS LEFT
        </div>
      </div>
    </div>
  );
};

// Country Dropdown Component
const CountryDropdown = ({ value, onChange, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCountry = COUNTRIES.find((c) => c.code === value);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: "100%",
          height: 48,
          backgroundColor: disabled ? "#e5e7eb" : "#f3f4f6",
          border: "none",
          borderRadius: 12,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: 16,
          color: value ? "#111827" : "#6b7280",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {selectedCountry && <CountryFlag code={selectedCountry.code} size={24} />}
          <span>{selectedCountry?.name || placeholder}</span>
        </div>
        <ChevronRight />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "white",
            borderRadius: 12,
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            zIndex: 100,
            maxHeight: 300,
            overflow: "hidden",
            marginTop: 4,
          }}
        >
          <div style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search countries..."
              style={{
                width: "100%",
                height: 40,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "0 12px",
                fontSize: 14,
              }}
              autoFocus
            />
          </div>
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onChange(country.code, country.name);
                  setIsOpen(false);
                  setSearch("");
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  border: "none",
                  backgroundColor: value === country.code ? "#f0f0ff" : "white",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                <CountryFlag code={country.code} size={24} />
                <span>{country.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Bottom Navigation
const BottomNav = ({ activeTab, setActiveTab }) => (
  <div
    style={{
      position: "fixed",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: 428,
      height: 70,
      backgroundColor: "white",
      borderTop: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      zIndex: 50,
    }}
  >
    {[
      { id: "tracker", label: "Tracker", Icon: HomeIcon },
      { id: "requirements", label: "Requirements", Icon: SearchIcon },
      { id: "settings", label: "Settings", Icon: SettingsIcon },
    ].map(({ id, label, Icon }) => (
      <button
        key={id}
        onClick={() => setActiveTab(id)}
        className="btn-press"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          border: "none",
          background: "none",
          cursor: "pointer",
          padding: "8px 16px",
        }}
      >
        <Icon active={activeTab === id} />
        <span
          style={{
            fontSize: 12,
            fontWeight: activeTab === id ? 600 : 400,
            color: activeTab === id ? "#0000ee" : "#6b7280",
          }}
        >
          {label}
        </span>
      </button>
    ))}
  </div>
);

// ============== ONBOARDING SCREENS ==============

const WelcomeScreen = ({ onNext }) => (
  <div
    className="fade-in"
    style={{
      minHeight: "100vh",
      background: "#0000ee",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      textAlign: "center",
    }}
  >
    <div
      style={{
        width: 120,
        height: 120,
        backgroundColor: "white",
        borderRadius: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 32,
      }}
    >
      <span style={{ fontSize: 60 }}>🛂</span>
    </div>
    <h1 style={{ fontSize: 36, fontWeight: "bold", color: "white", marginBottom: 16 }}>
      VisaFlow
    </h1>
    <p style={{ fontSize: 18, color: "rgba(255,255,255,0.8)", marginBottom: 48, maxWidth: 300 }}>
      Never overstay your visa again. Track deadlines, get alerts, stay compliant.
    </p>
    <button
      onClick={onNext}
      className="btn-press"
      style={{
        width: "100%",
        maxWidth: 300,
        height: 56,
        backgroundColor: "white",
        color: "#0000ee",
        border: "none",
        borderRadius: 16,
        fontSize: 18,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      Get Started
    </button>
  </div>
);

const NotificationScreen = ({ onNext, onEnableNotifications }) => {
  const handleEnable = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      onEnableNotifications(permission === "granted");
    }
    onNext();
  };

  return (
    <div
      className="fade-in"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          backgroundColor: "#f0f0ff",
          borderRadius: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 32,
        }}
      >
        <BellIcon />
      </div>
      <h2 style={{ fontSize: 28, fontWeight: "bold", color: "#111827", marginBottom: 16 }}>
        Stay Informed
      </h2>
      <p style={{ fontSize: 16, color: "#6b7280", marginBottom: 32, maxWidth: 300 }}>
        Enable notifications to receive critical alerts at 14, 7, 3, and 1 days before your visa expires.
      </p>
      <button
        onClick={handleEnable}
        className="btn-press"
        style={{
          width: "100%",
          maxWidth: 300,
          height: 56,
          backgroundColor: "#0000ee",
          color: "white",
          border: "none",
          borderRadius: 16,
          fontSize: 18,
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        Enable Notifications
      </button>
      <button
        onClick={onNext}
        style={{
          background: "none",
          border: "none",
          color: "#6b7280",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        Skip for now
      </button>
    </div>
  );
};

const NationalityScreen = ({ onComplete }) => {
  const [nationality, setNationality] = useState("");
  const [nationalityName, setNationalityName] = useState("");

  const handleComplete = () => {
    if (nationality) {
      onComplete(nationality, nationalityName);
      triggerConfetti();
    }
  };

  return (
    <div
      className="fade-in"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          backgroundColor: "#f0f0ff",
          borderRadius: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 32,
        }}
      >
        <PassportIcon />
      </div>
      <h2
        style={{
          fontSize: 28,
          fontWeight: "bold",
          color: "#111827",
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        Select Your Nationality
      </h2>
      <p
        style={{
          fontSize: 16,
          color: "#6b7280",
          marginBottom: 32,
          maxWidth: 300,
          textAlign: "center",
        }}
      >
        This helps us show you accurate visa requirements for your passport.
      </p>
      <div style={{ width: "100%", maxWidth: 350, marginBottom: 32 }}>
        <CountryDropdown
          value={nationality}
          onChange={(code, name) => {
            setNationality(code);
            setNationalityName(name);
          }}
          placeholder="Select your nationality"
        />
      </div>
      <button
        onClick={handleComplete}
        disabled={!nationality}
        className="btn-press"
        style={{
          width: "100%",
          maxWidth: 300,
          height: 56,
          backgroundColor: nationality ? "#0000ee" : "#d1d5db",
          color: "white",
          border: "none",
          borderRadius: 16,
          fontSize: 18,
          fontWeight: 600,
          cursor: nationality ? "pointer" : "not-allowed",
        }}
      >
        Complete Setup
      </button>
    </div>
  );
};

// ============== MAIN SCREENS ==============

// Home/Tracker Screen
const TrackerScreen = ({ trips, onDeleteTrip, onOpenAddTrip }) => {
  const [, setTick] = useState(0);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const activeTrip = trips.find((t) => t.status === "active");

  if (!activeTrip) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          paddingBottom: 100,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            backgroundColor: "#f3f4f6",
            borderRadius: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 48, opacity: 0.5 }}>✈️</span>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
          No active trips yet
        </h2>
        <p style={{ fontSize: 16, color: "#6b7280", marginBottom: 32, textAlign: "center" }}>
          Add your first trip to start tracking your visa countdown
        </p>
        <button
          onClick={onOpenAddTrip}
          className="btn-press"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 56,
            padding: "0 32px",
            backgroundColor: "#0000ee",
            color: "white",
            border: "none",
            borderRadius: 16,
            fontSize: 18,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <PlusIcon />
          Add Trip
        </button>
      </div>
    );
  }

  const daysLeft = calculateDaysLeft(activeTrip.exit_date);
  const progress = calculateProgress(activeTrip.entry_date, activeTrip.exit_date);
  const statusColor = getStatusColor(daysLeft);
  const statusText = getStatusText(daysLeft);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 24,
        paddingBottom: 100,
      }}
    >
      {/* Progress Ring */}
      <div style={{ marginBottom: 16 }}>
        <ProgressRing
          progress={progress}
          daysLeft={daysLeft}
          color={statusColor}
        />
      </div>

      {/* Status Text */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          backgroundColor: `${statusColor}20`,
          borderRadius: 20,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: statusColor,
          }}
        />
        <span style={{ fontSize: 14, fontWeight: 600, color: statusColor }}>
          {statusText}
        </span>
      </div>

      {/* Trip Card */}
      <div
        className="card-shadow glass-effect"
        style={{
          width: "100%",
          backgroundColor: "white",
          borderRadius: 16,
          padding: 24,
          position: "relative",
        }}
      >
        {/* Delete Button */}
        <button
          onClick={() => onDeleteTrip(activeTrip.id)}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: "#f3f4f6",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CloseIcon />
        </button>

        {/* Country Info */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <CountryFlag code={activeTrip.country_code} size={48} />
          <div>
            <h3 style={{ fontSize: 24, fontWeight: "bold", color: "#111827" }}>
              {activeTrip.country}
            </h3>
            <span
              style={{
                display: "inline-block",
                padding: "4px 12px",
                backgroundColor: "#e0e0ff",
                color: "#0000ee",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {activeTrip.visa_type}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              height: 8,
              backgroundColor: "#e5e7eb",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                backgroundColor: statusColor,
                borderRadius: 4,
                transition: "width 500ms ease",
              }}
            />
          </div>
          <div style={{ textAlign: "right", marginTop: 4 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              {Math.round(progress)}% used
            </span>
          </div>
        </div>

        {/* Date Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#6b7280" }}>Entry Date</span>
            <span style={{ fontWeight: 500 }}>{formatDate(activeTrip.entry_date)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#6b7280" }}>Exit By</span>
            <span
              style={{
                fontWeight: 600,
                color: daysLeft <= 7 ? "#ef4444" : "#111827",
              }}
            >
              {formatDate(activeTrip.exit_date)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#6b7280" }}>Duration</span>
            <span style={{ fontWeight: 500 }}>{activeTrip.total_days} days</span>
          </div>
        </div>
      </div>

      {/* Add Another Trip Button */}
      <button
        onClick={onOpenAddTrip}
        className="btn-press"
        style={{
          marginTop: 24,
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 48,
          padding: "0 24px",
          backgroundColor: "transparent",
          color: "#0000ee",
          border: "2px solid #0000ee",
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <PlusIcon />
        Add Another Trip
      </button>
    </div>
  );
};

// Requirements Checker Screen
const RequirementsScreen = ({ userNationality, userNationalityCode, onAddTrip }) => {
  const [nationalityCode, setNationalityCode] = useState(userNationalityCode || "");
  const [nationalityName, setNationalityName] = useState(userNationality || "");
  const [destinationCode, setDestinationCode] = useState("");
  const [destinationName, setDestinationName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [purpose, setPurpose] = useState("tourism");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkRequirements = async () => {
    if (!nationalityCode || !destinationCode) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API}/check-requirements`, {
        nationality_code: nationalityCode,
        destination_code: destinationCode,
        travel_purpose: purpose,
      });
      setResult(response.data);
    } catch (error) {
      console.error("Error checking requirements:", error);
      setResult({
        found: false,
        verdict: "error",
        message: "Failed to check requirements. Please try again.",
      });
    }
    setLoading(false);
  };

  const handleAddToTracker = () => {
    if (!startDate || !endDate) {
      alert("Please select travel dates");
      return;
    }

    const visaType = result?.verdict === "visa_free" ? "Visa-Free" :
      result?.verdict === "evisa" ? "eVisa" :
      result?.verdict === "visa_on_arrival" ? "Visa on Arrival" :
      "Tourist Visa";

    onAddTrip({
      country: destinationName,
      country_code: destinationCode,
      visa_type: visaType,
      entry_date: startDate,
      exit_date: endDate,
    });
  };

  const getVerdictDisplay = () => {
    if (!result) return null;

    const verdictMap = {
      visa_free: { icon: "✓", title: "No visa required", color: "#10b981" },
      evisa: { icon: "📱", title: "eVisa Required", color: "#0000ee" },
      visa_on_arrival: { icon: "🛬", title: "Visa on Arrival", color: "#f59e0b" },
      embassy_visa: { icon: "🏛️", title: "Embassy Visa Required", color: "#ef4444" },
      unknown: { icon: "❓", title: "Requirements Unknown", color: "#6b7280" },
      error: { icon: "⚠️", title: "Error", color: "#ef4444" },
    };

    return verdictMap[result.verdict] || verdictMap.unknown;
  };

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "#0000ee",
        padding: 16,
        paddingBottom: 100,
        overflowY: "auto",
      }}
    >
      {/* Form Card */}
      <div
        className="card-shadow"
        style={{
          backgroundColor: "white",
          borderRadius: 16,
          padding: 24,
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#6b7280", marginBottom: 16 }}>
          TRAVEL DETAILS
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Nationality */}
          <div>
            <label style={{ fontSize: 14, color: "#6b7280", marginBottom: 8, display: "block" }}>
              Your Nationality
            </label>
            <CountryDropdown
              value={nationalityCode}
              onChange={(code, name) => {
                setNationalityCode(code);
                setNationalityName(name);
              }}
              placeholder="Select nationality"
            />
          </div>

          {/* Destination */}
          <div>
            <label style={{ fontSize: 14, color: "#6b7280", marginBottom: 8, display: "block" }}>
              Destination
            </label>
            <CountryDropdown
              value={destinationCode}
              onChange={(code, name) => {
                setDestinationCode(code);
                setDestinationName(name);
                setResult(null);
              }}
              placeholder="Where are you traveling?"
            />
          </div>

          {/* Travel Dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 14, color: "#6b7280", marginBottom: 8, display: "block" }}>
                Start Date
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: "100%",
                    height: 48,
                    backgroundColor: "#f3f4f6",
                    border: "none",
                    borderRadius: 12,
                    padding: "0 16px",
                    fontSize: 14,
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 14, color: "#6b7280", marginBottom: 8, display: "block" }}>
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                style={{
                  width: "100%",
                  height: 48,
                  backgroundColor: "#f3f4f6",
                  border: "none",
                  borderRadius: 12,
                  padding: "0 16px",
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          {/* Trip Purpose */}
          <div>
            <label style={{ fontSize: 14, color: "#6b7280", marginBottom: 8, display: "block" }}>
              Trip Purpose
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              style={{
                width: "100%",
                height: 48,
                backgroundColor: "#f3f4f6",
                border: "none",
                borderRadius: 12,
                padding: "0 16px",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              <option value="tourism">Tourism</option>
              <option value="business">Business</option>
              <option value="transit">Transit</option>
            </select>
          </div>

          {/* Check Button */}
          <button
            onClick={checkRequirements}
            disabled={!nationalityCode || !destinationCode || loading}
            className="btn-press"
            style={{
              width: "100%",
              height: 48,
              backgroundColor: nationalityCode && destinationCode ? "#0000ee" : "#d1d5db",
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: nationalityCode && destinationCode ? "pointer" : "not-allowed",
              marginTop: 8,
            }}
          >
            {loading ? "Checking..." : "Check Requirements"}
          </button>
        </div>
      </div>

      {/* Results Card */}
      {result && (
        <div
          className="card-shadow modal-slide-up"
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 24,
            marginBottom: 16,
          }}
        >
          {(() => {
            const verdict = getVerdictDisplay();
            return (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: `${verdict.color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                    }}
                  >
                    {verdict.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: "bold", color: verdict.color }}>
                      {verdict.title}
                    </h3>
                    {result.permitted_days && (
                      <p style={{ fontSize: 14, color: "#6b7280" }}>
                        {result.permitted_days} days permitted
                      </p>
                    )}
                  </div>
                </div>

                {/* Details */}
                {result.cost_usd && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#6b7280" }}>Cost</span>
                    <span style={{ fontWeight: 600 }}>${result.cost_usd} USD</span>
                  </div>
                )}

                {result.processing_days && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#6b7280" }}>Processing</span>
                    <span style={{ fontWeight: 500 }}>{result.processing_days} business days</span>
                  </div>
                )}

                {result.conditions && result.conditions.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>
                      CONDITIONS
                    </p>
                    {result.conditions.map((condition, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <div style={{ color: "#10b981" }}>
                          <CheckIcon />
                        </div>
                        <span style={{ fontSize: 14 }}>{condition}</span>
                      </div>
                    ))}
                  </div>
                )}

                {result.application_link && (
                  <a
                    href={result.application_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "12px",
                      backgroundColor: "#f0f0ff",
                      color: "#0000ee",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontWeight: 600,
                      marginTop: 16,
                    }}
                  >
                    Apply Online →
                  </a>
                )}

                <p
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginTop: 16,
                    textAlign: "center",
                  }}
                >
                  Last updated: {result.last_updated}
                </p>

                <div
                  style={{
                    backgroundColor: "#fef3c7",
                    padding: 12,
                    borderRadius: 8,
                    marginTop: 12,
                  }}
                >
                  <p style={{ fontSize: 12, color: "#92400e" }}>
                    ⚠️ Always verify with the embassy before travel. Requirements may change.
                  </p>
                </div>

                {/* Add to Tracker Button */}
                {result.found && startDate && endDate && (
                  <button
                    onClick={handleAddToTracker}
                    className="btn-press"
                    style={{
                      width: "100%",
                      height: 48,
                      backgroundColor: "#0000ee",
                      color: "white",
                      border: "none",
                      borderRadius: 12,
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: "pointer",
                      marginTop: 16,
                    }}
                  >
                    Add Trip to Tracker
                  </button>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Help Card */}
      <div
        className="card-shadow"
        style={{
          backgroundColor: "white",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Need Help?</h3>
        <p style={{ fontSize: 14, color: "#6b7280" }}>
          Our visa database covers 50+ countries. For specific questions, consult the destination
          country's embassy or consulate.
        </p>
      </div>
    </div>
  );
};

// Add Trip Modal
const AddTripModal = ({ isOpen, onClose, onSave, prefillData }) => {
  const [country, setCountry] = useState(prefillData?.country || "");
  const [countryCode, setCountryCode] = useState(prefillData?.country_code || "");
  const [visaType, setVisaType] = useState(prefillData?.visa_type || "");
  const [entryDate, setEntryDate] = useState(prefillData?.entry_date || "");
  const [exitDate, setExitDate] = useState(prefillData?.exit_date || "");
  const [extensions, setExtensions] = useState(0);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (prefillData) {
      setCountry(prefillData.country || "");
      setCountryCode(prefillData.country_code || "");
      setVisaType(prefillData.visa_type || "");
      setEntryDate(prefillData.entry_date || "");
      setExitDate(prefillData.exit_date || "");
    }
  }, [prefillData]);

  const calculateDuration = () => {
    if (entryDate && exitDate) {
      const days = Math.ceil(
        (new Date(exitDate) - new Date(entryDate)) / (1000 * 60 * 60 * 24)
      );
      return days > 0 ? `${days} days` : "";
    }
    return "";
  };

  const validate = () => {
    const newErrors = {};
    if (!countryCode) newErrors.country = "Please select a country";
    if (!visaType) newErrors.visaType = "Please select a visa type";
    if (!entryDate) newErrors.entryDate = "Please select an entry date";
    if (!exitDate) newErrors.exitDate = "Please select an exit date";
    if (entryDate && exitDate && new Date(exitDate) <= new Date(entryDate)) {
      newErrors.exitDate = "Exit date must be after entry date";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave({
        country,
        country_code: countryCode,
        visa_type: visaType,
        entry_date: entryDate,
        exit_date: exitDate,
        extensions_available: extensions,
      });
      // Reset form
      setCountry("");
      setCountryCode("");
      setVisaType("");
      setEntryDate("");
      setExitDate("");
      setExtensions(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-slide-up"
        style={{
          width: "100%",
          maxWidth: 428,
          backgroundColor: "white",
          borderRadius: "24px 24px 0 0",
          padding: 24,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: "bold" }}>Add Trip</h2>
          <button
            onClick={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#f3f4f6",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Country */}
          <div>
            <label style={{ fontSize: 14, color: "#6b7280", marginBottom: 8, display: "block" }}>
              Country *
            </label>
            <CountryDropdown
              value={countryCode}
              onChange={(code, name) => {
                setCountryCode(code);
                setCountry(name);
              }}
              placeholder="Select destination"
            />
            {errors.country && (
              <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.country}</p>
            )}
          </div>

          {/* Visa Type */}
          <div>
            <label style={{ fontSize: 14, color: "#6b7280", marginBottom: 8, display: "block" }}>
              Visa Type *
            </label>
            <select
              value={visaType}
              onChange={(e) => setVisaType(e.target.value)}
              disabled={!countryCode}
              style={{
                width: "100%",
                height: 48,
                backgroundColor: countryCode ? "#f3f4f6" : "#e5e7eb",
                border: "none",
                borderRadius: 12,
                padding: "0 16px",
                fontSize: 16,
                cursor: countryCode ? "pointer" : "not-allowed",
              }}
            >
              <option value="">Select visa type</option>
              {VISA_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.visaType && (
              <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.visaType}</p>
            )}
          </div>

          {/* Entry Date */}
          <div>
            <label style={{ fontSize: 14, color: "#6b7280", marginBottom: 8, display: "block" }}>
              Entry Date *
            </label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              style={{
                width: "100%",
                height: 48,
                backgroundColor: "#f3f4f6",
                border: "none",
                borderRadius: 12,
                padding: "0 16px",
                fontSize: 16,
              }}
            />
            {errors.entryDate && (
              <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.entryDate}</p>
            )}
          </div>

          {/* Exit Date */}
          <div>
            <label style={{ fontSize: 14, color: "#6b7280", marginBottom: 8, display: "block" }}>
              Exit Date *
            </label>
            <input
              type="date"
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
              min={entryDate}
              style={{
                width: "100%",
                height: 48,
                backgroundColor: "#f3f4f6",
                border: "none",
                borderRadius: 12,
                padding: "0 16px",
                fontSize: 16,
              }}
            />
            {errors.exitDate && (
              <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.exitDate}</p>
            )}
          </div>

          {/* Duration (Auto-calculated) */}
          <div>
            <label style={{ fontSize: 14, color: "#6b7280", marginBottom: 8, display: "block" }}>
              Duration
            </label>
            <input
              type="text"
              value={calculateDuration()}
              readOnly
              style={{
                width: "100%",
                height: 48,
                backgroundColor: "#e5e7eb",
                border: "none",
                borderRadius: 12,
                padding: "0 16px",
                fontSize: 16,
                color: "#6b7280",
              }}
            />
          </div>

          {/* Extensions Available */}
          <div>
            <label style={{ fontSize: 14, color: "#6b7280", marginBottom: 8, display: "block" }}>
              Extensions Available
            </label>
            <input
              type="number"
              value={extensions}
              onChange={(e) => setExtensions(Math.min(9, Math.max(0, parseInt(e.target.value) || 0)))}
              min="0"
              max="9"
              style={{
                width: "100%",
                height: 48,
                backgroundColor: "#f3f4f6",
                border: "none",
                borderRadius: 12,
                padding: "0 16px",
                fontSize: 16,
              }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button
            onClick={onClose}
            className="btn-press"
            style={{
              flex: 1,
              height: 48,
              backgroundColor: "white",
              color: "#0000ee",
              border: "2px solid #0000ee",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-press"
            style={{
              flex: 1,
              height: 48,
              backgroundColor: "#0000ee",
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save Trip
          </button>
        </div>
      </div>
    </div>
  );
};

// Settings Screen
const SettingsScreen = ({ user, onUpdateUser, onLogout }) => {
  const [showSubscription, setShowSubscription] = useState(false);
  const [showNationality, setShowNationality] = useState(false);

  const getTrialDaysLeft = () => {
    if (!user.trial_start) return 7;
    const trialStart = new Date(user.trial_start);
    const trialEnd = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + 7);
    const daysLeft = Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  if (showSubscription) {
    return (
      <SubscriptionScreen
        trialDaysLeft={getTrialDaysLeft()}
        onBack={() => setShowSubscription(false)}
      />
    );
  }

  if (showNationality) {
    return (
      <NationalitySettingsScreen
        currentNationality={user.nationality_code}
        onSave={(code, name) => {
          onUpdateUser({ nationality_code: code, nationality: name });
          setShowNationality(false);
        }}
        onBack={() => setShowNationality(false)}
      />
    );
  }

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "#0000ee",
        padding: 16,
        paddingBottom: 100,
      }}
    >
      <h1
        style={{
          fontSize: 32,
          fontWeight: "bold",
          color: "white",
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        Settings
      </h1>

      {/* Main Settings Card */}
      <div
        className="card-shadow"
        style={{
          backgroundColor: "white",
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        {/* Notifications */}
        <button
          onClick={() => onUpdateUser({ notifications_enabled: !user.notifications_enabled })}
          style={{
            width: "100%",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "none",
            backgroundColor: "white",
            cursor: "pointer",
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <BellIcon />
            <span style={{ fontSize: 16 }}>Push Notifications</span>
          </div>
          <div
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              backgroundColor: user.notifications_enabled ? "#10b981" : "#d1d5db",
              padding: 2,
              transition: "background-color 200ms",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: "white",
                transform: user.notifications_enabled ? "translateX(20px)" : "translateX(0)",
                transition: "transform 200ms",
              }}
            />
          </div>
        </button>

        {/* Passport Info */}
        <button
          onClick={() => setShowNationality(true)}
          style={{
            width: "100%",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "none",
            backgroundColor: "white",
            cursor: "pointer",
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <PassportIcon />
            <span style={{ fontSize: 16 }}>Passport Information</span>
          </div>
          <ChevronRight />
        </button>

        {/* Privacy */}
        <button
          style={{
            width: "100%",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "none",
            backgroundColor: "white",
            cursor: "pointer",
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <ShieldIcon />
            <span style={{ fontSize: 16 }}>Privacy & Security</span>
          </div>
          <ChevronRight />
        </button>

        {/* Subscription */}
        <button
          onClick={() => setShowSubscription(true)}
          style={{
            width: "100%",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "none",
            backgroundColor: "white",
            cursor: "pointer",
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <CreditCardIcon />
            <div>
              <span style={{ fontSize: 16, display: "block" }}>Subscription</span>
              <span style={{ fontSize: 12, color: "#10b981" }}>
                {user.subscription_status === "trial"
                  ? `${getTrialDaysLeft()} days left in trial`
                  : user.subscription_status === "active"
                  ? "Active"
                  : "Expired"}
              </span>
            </div>
          </div>
          <ChevronRight />
        </button>

        {/* Help */}
        <button
          style={{
            width: "100%",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "none",
            backgroundColor: "white",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <HelpIcon />
            <span style={{ fontSize: 16 }}>Help & Support</span>
          </div>
          <ChevronRight />
        </button>
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="btn-press"
        style={{
          width: "100%",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          backgroundColor: "white",
          border: "none",
          borderRadius: 16,
          cursor: "pointer",
        }}
      >
        <LogOutIcon />
        <span style={{ fontSize: 16, color: "#ef4444", fontWeight: 600 }}>Log Out</span>
      </button>
    </div>
  );
};

// Subscription Screen
const SubscriptionScreen = ({ trialDaysLeft, onBack }) => (
  <div
    style={{
      flex: 1,
      backgroundColor: "#0000ee",
      padding: 16,
      paddingBottom: 100,
    }}
  >
    {/* Header */}
    <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
      <button
        onClick={onBack}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "rgba(255,255,255,0.2)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 16,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <h1 style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>Subscription</h1>
    </div>

    {/* Trial Status */}
    {trialDaysLeft > 0 && (
      <div
        style={{
          backgroundColor: "rgba(255,255,255,0.2)",
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        <p style={{ color: "white", fontSize: 16 }}>
          <span style={{ fontWeight: "bold" }}>{trialDaysLeft} days</span> left in free trial
        </p>
      </div>
    )}

    {/* Pricing Cards */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
      {/* Monthly */}
      <div
        className="card-shadow"
        style={{
          backgroundColor: "white",
          borderRadius: 16,
          padding: 20,
          textAlign: "center",
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Monthly</h3>
        <p style={{ fontSize: 28, fontWeight: "bold", color: "#0000ee", marginBottom: 4 }}>
          $9.99
        </p>
        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>per month</p>
        <button
          className="btn-press"
          style={{
            width: "100%",
            height: 40,
            backgroundColor: "#f3f4f6",
            color: "#0000ee",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Subscribe
        </button>
      </div>

      {/* Annual */}
      <div
        className="card-shadow"
        style={{
          backgroundColor: "white",
          borderRadius: 16,
          padding: 20,
          textAlign: "center",
          border: "2px solid #0000ee",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#10b981",
            color: "white",
            padding: "4px 12px",
            borderRadius: 12,
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          SAVE $60!
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Annual</h3>
        <p style={{ fontSize: 28, fontWeight: "bold", color: "#0000ee", marginBottom: 4 }}>
          $59
        </p>
        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>per year</p>
        <button
          className="btn-press"
          style={{
            width: "100%",
            height: 40,
            backgroundColor: "#0000ee",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Subscribe
        </button>
      </div>
    </div>

    {/* Restore Purchases */}
    <button
      style={{
        width: "100%",
        backgroundColor: "transparent",
        border: "none",
        color: "rgba(255,255,255,0.8)",
        fontSize: 14,
        cursor: "pointer",
        padding: 16,
      }}
    >
      Restore Purchases
    </button>
  </div>
);

// Nationality Settings Screen
const NationalitySettingsScreen = ({ currentNationality, onSave, onBack }) => {
  const [nationality, setNationality] = useState(currentNationality || "");
  const [nationalityName, setNationalityName] = useState("");

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "#0000ee",
        padding: 16,
        paddingBottom: 100,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.2)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>Passport Info</h1>
      </div>

      {/* Content */}
      <div
        className="card-shadow"
        style={{
          backgroundColor: "white",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <label style={{ fontSize: 14, color: "#6b7280", marginBottom: 8, display: "block" }}>
          Nationality
        </label>
        <CountryDropdown
          value={nationality}
          onChange={(code, name) => {
            setNationality(code);
            setNationalityName(name);
          }}
          placeholder="Select your nationality"
        />

        <button
          onClick={() => nationality && onSave(nationality, nationalityName)}
          disabled={!nationality}
          className="btn-press"
          style={{
            width: "100%",
            height: 48,
            backgroundColor: nationality ? "#0000ee" : "#d1d5db",
            color: "white",
            border: "none",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            cursor: nationality ? "pointer" : "not-allowed",
            marginTop: 24,
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

// ============== MAIN APP ==============

const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tracker");
  const [addTripModal, setAddTripModal] = useState({ isOpen: false, prefillData: null });

  // Initialize user
  useEffect(() => {
    const initUser = async () => {
      try {
        // Try to get existing user from localStorage
        const storedUserId = localStorage.getItem("visaflow_user_id");
        
        if (storedUserId) {
          const response = await axios.get(`${API}/users/${storedUserId}`);
          setUser(response.data);
          
          // Load trips
          const tripsResponse = await axios.get(`${API}/trips/${storedUserId}`);
          setTrips(tripsResponse.data);
          
          if (response.data.onboarding_completed) {
            setOnboardingStep(4); // Skip onboarding
          }
        }
      } catch (error) {
        console.log("No existing user found");
      }
      setLoading(false);
    };

    initUser();
  }, []);

  // Create user after onboarding
  const completeOnboarding = async (nationalityCode, nationalityName, notificationsEnabled) => {
    try {
      const response = await axios.post(`${API}/users`);
      const newUser = response.data;
      
      // Update user with nationality
      const updateResponse = await axios.patch(`${API}/users/${newUser.id}`, {
        nationality_code: nationalityCode,
        nationality: nationalityName,
        notifications_enabled: notificationsEnabled,
        onboarding_completed: true,
      });
      
      setUser(updateResponse.data);
      localStorage.setItem("visaflow_user_id", newUser.id);
      setOnboardingStep(4);
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  // Update user settings
  const updateUser = async (updates) => {
    if (!user) return;
    
    try {
      const response = await axios.patch(`${API}/users/${user.id}`, updates);
      setUser(response.data);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  // Add trip
  const addTrip = async (tripData) => {
    if (!user) return;
    
    const isFirstTrip = trips.length === 0;
    
    try {
      const response = await axios.post(`${API}/trips`, {
        ...tripData,
        user_id: user.id,
      });
      
      setTrips([...trips, response.data]);
      setAddTripModal({ isOpen: false, prefillData: null });
      setActiveTab("tracker");
      
      if (isFirstTrip) {
        triggerConfetti();
      }
      
      // Schedule notifications
      scheduleNotifications(response.data);
    } catch (error) {
      console.error("Error adding trip:", error);
    }
  };

  // Delete trip
  const deleteTrip = async (tripId) => {
    try {
      await axios.delete(`${API}/trips/${tripId}`);
      setTrips(trips.filter((t) => t.id !== tripId));
    } catch (error) {
      console.error("Error deleting trip:", error);
    }
  };

  // Schedule notifications
  const scheduleNotifications = (trip) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const exitDate = new Date(trip.exit_date);
    const now = new Date();
    
    const alerts = [
      { days: 14, message: `Visa Expires in 14 Days - ${trip.country}` },
      { days: 7, message: `⚠️ Visa Expires in 1 Week - ${trip.country}` },
      { days: 3, message: `🚨 URGENT: Visa Expires in 3 Days - ${trip.country}` },
      { days: 1, message: `🚨 CRITICAL: Visa Expires Tomorrow - ${trip.country}` },
      { days: 0, message: `🚨 YOUR VISA EXPIRES TODAY - ${trip.country}` },
    ];

    alerts.forEach(({ days, message }) => {
      const alertDate = new Date(exitDate);
      alertDate.setDate(alertDate.getDate() - days);
      alertDate.setHours(9, 0, 0, 0);

      const delay = alertDate - now;
      if (delay > 0) {
        setTimeout(() => {
          new Notification("VisaFlow Alert", { body: message, icon: "🛂" });
        }, delay);
      }
    });
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("visaflow_user_id");
    setUser(null);
    setTrips([]);
    setOnboardingStep(0);
  };

  const value = {
    user,
    trips,
    onboardingStep,
    setOnboardingStep,
    activeTab,
    setActiveTab,
    addTripModal,
    setAddTripModal,
    completeOnboarding,
    updateUser,
    addTrip,
    deleteTrip,
    logout,
    loading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const MainApp = () => {
  const {
    user,
    trips,
    onboardingStep,
    setOnboardingStep,
    activeTab,
    setActiveTab,
    addTripModal,
    setAddTripModal,
    completeOnboarding,
    updateUser,
    addTrip,
    deleteTrip,
    logout,
    loading,
  } = useApp();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0000ee",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <span style={{ fontSize: 30 }}>🛂</span>
          </div>
          <p style={{ color: "white", fontSize: 18 }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Onboarding flow
  if (onboardingStep < 4) {
    if (onboardingStep === 0) {
      return <WelcomeScreen onNext={() => setOnboardingStep(1)} />;
    }
    if (onboardingStep === 1) {
      return (
        <NotificationScreen
          onNext={() => setOnboardingStep(2)}
          onEnableNotifications={setNotificationsEnabled}
        />
      );
    }
    if (onboardingStep === 2 || onboardingStep === 3) {
      return (
        <NationalityScreen
          onComplete={(code, name) => completeOnboarding(code, name, notificationsEnabled)}
        />
      );
    }
  }

  // Main app
  return (
    <div className="app-container">
      {/* Header */}
      {activeTab !== "settings" && (
        <div
          style={{
            padding: "16px 16px 0",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: "bold", color: "#111827" }}>
            {activeTab === "tracker" ? "VisaFlow" : "Check Requirements"}
          </h1>
        </div>
      )}

      {/* Content */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 70px)" }}>
        {activeTab === "tracker" && (
          <TrackerScreen
            trips={trips}
            onDeleteTrip={deleteTrip}
            onOpenAddTrip={() => setAddTripModal({ isOpen: true, prefillData: null })}
          />
        )}
        {activeTab === "requirements" && (
          <RequirementsScreen
            userNationality={user?.nationality}
            userNationalityCode={user?.nationality_code}
            onAddTrip={(data) => {
              setAddTripModal({ isOpen: true, prefillData: data });
            }}
          />
        )}
        {activeTab === "settings" && (
          <SettingsScreen user={user} onUpdateUser={updateUser} onLogout={logout} />
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Add Trip Modal */}
      <AddTripModal
        isOpen={addTripModal.isOpen}
        onClose={() => setAddTripModal({ isOpen: false, prefillData: null })}
        onSave={addTrip}
        prefillData={addTripModal.prefillData}
      />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

export default App;
