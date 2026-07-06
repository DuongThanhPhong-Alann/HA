"use client";

import { format, subDays } from "date-fns";
import { Activity, ChartNoAxesCombined } from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { Measurement } from "@/types/database";

export function BloodPressureChart({ records }: { records: Measurement[] }) {
  const [days, setDays] = useState("30");
  const data = useMemo(() => {
    const cutoff = days === "all" ? 0 : subDays(new Date(), Number(days)).getTime();
    return records.filter((record) => new Date(record.measured_at).getTime() >= cutoff).slice().reverse().map((record) => ({
      ...record,
      date: format(new Date(record.measured_at), "dd/MM HH:mm"),
    }));
  }, [days, records]);

  return <section className="card card-hover animate-rise p-5 md:p-6">
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="eyebrow"><ChartNoAxesCombined size={15}/> Biểu đồ biến thiên</p><h2 className="mt-2 text-xl font-extrabold">Xu hướng SYS, DIA và nhịp tim</h2><p className="mt-1 text-sm text-slate-500">Mỗi điểm là một lần đo; một ngày có thể có nhiều điểm dữ liệu.</p></div><select className="input sm:w-36" value={days} onChange={(event) => setDays(event.target.value)}><option value="7">7 ngày</option><option value="30">30 ngày</option><option value="90">90 ngày</option><option value="all">Tất cả</option></select></div>
    <div className="h-80 md:h-96">{data.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 4 }}><defs><filter id="lineGlow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><ReferenceArea y1={90} y2={120} fill="#dcfce7" fillOpacity={0.45}/><CartesianGrid stroke="#e7eef2" strokeDasharray="4 5" vertical={false}/><XAxis dataKey="date" minTickGap={35} fontSize={11} tickLine={false} axisLine={false}/><YAxis domain={[40, "auto"]} fontSize={11} tickLine={false} axisLine={false}/><Tooltip contentStyle={{borderRadius:16,border:"1px solid #dbe8ec",boxShadow:"0 12px 30px rgba(15,50,70,.12)"}}/><Legend/><Line type="monotone" dataKey="systolic" name="SYS" stroke="#e11d48" strokeWidth={3} dot={{r:3,fill:"#fff",strokeWidth:2}} activeDot={{r:6}} filter="url(#lineGlow)"/><Line type="monotone" dataKey="diastolic" name="DIA" stroke="#0891b2" strokeWidth={3} dot={{r:3,fill:"#fff",strokeWidth:2}} activeDot={{r:6}}/><Line type="monotone" dataKey="pulse" name="PULSE" stroke="#f59e0b" strokeWidth={2.5} dot={{r:2}} activeDot={{r:5}}/></LineChart></ResponsiveContainer> : <div className="grid h-full place-items-center text-center text-slate-400"><div><Activity className="mx-auto mb-3"/><p>Chưa có dữ liệu để hiển thị</p></div></div>}</div>
  </section>;
}
