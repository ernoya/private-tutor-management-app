"use client";

import { useState, useEffect, useCallback } from "react";
import Dashboard from "@/components/Dashboard";
import StudentsPage from "@/components/StudentsPage";
import GroupsPage from "@/components/GroupsPage";
import SchedulePage from "@/components/SchedulePage";
import PaymentsPage from "@/components/PaymentsPage";

type Tab = "dashboard" | "students" | "groups" | "schedule" | "payments";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const tabs = [
    { id: "dashboard" as Tab, label: "الرئيسية", icon: "🏠" },
    { id: "students" as Tab, label: "الطلاب", icon: "👨‍🎓" },
    { id: "groups" as Tab, label: "المجموعات", icon: "👥" },
    { id: "schedule" as Tab, label: "الجدول", icon: "📅" },
    { id: "payments" as Tab, label: "المدفوعات", icon: "💰" },
  ];

  return (
    <div className="app-container">
      {/* Header */}
      <header
        style={{
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        }}
        className="sticky top-0 z-50 shadow-lg"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">
                مدرستي
              </h1>
              <p className="text-indigo-200 text-xs">إدارة الدروس الخصوصية</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">
              {new Date().toLocaleDateString("ar-EG", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="page-content">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "students" && <StudentsPage />}
        {activeTab === "groups" && <GroupsPage />}
        {activeTab === "schedule" && <SchedulePage />}
        {activeTab === "payments" && <PaymentsPage />}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-2 px-1 transition-all ${
                activeTab === tab.id
                  ? "text-indigo-600"
                  : "text-slate-400"
              }`}
            >
              <span className="text-xl mb-0.5">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="w-1 h-1 bg-indigo-600 rounded-full mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
