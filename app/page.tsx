"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Transaction = {
  id: string;
  type: "income" | "expense";
  title: string;
  amount: number;
  date: string;
  account: string;
  category: string;
};

export default function Home() {
  const today = new Date().toISOString().slice(0, 10);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [type, setType] = useState<"income" | "expense">("income");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [account, setAccount] = useState("ส่วนตัว");
  const [accounts, setAccounts] = useState<string[]>([]);
  const [category, setCategory] = useState("รายรับทั่วไป");
  const [categories, setCategories] = useState<{ name: string; type: string }[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  useEffect(() => {async function loadAccounts() {
  const { data, error } = await supabase
    .from("accounts")
    .select("name");

  if (error) {
    console.error(error);
    return;
  }

  if (data) {
    setAccounts(data.map((item) => item.name));
  }
}
async function loadCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("name, type");

  if (error) {
    console.error(error);
    return;
  }

  if (data) {
    setCategories(data);
  }
}           
  async function loadTransactions() {
    const { data, error } = await supabase
  .from("transactions")
  .select("*, accounts(name), categories(name)")
  .order("date", { ascending: false });
    if (error) {
  console.error(error);
  return;
}
 if (data) {
  setTransactions(
    data.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      amount: Number(item.amount),
      date: item.date,
     account: item.accounts?.name ?? "",
     category: item.categories?.name ?? "",
    }))
  );
} 
}

loadAccounts();
loadCategories();
loadTransactions();
}, []);

  const income = useMemo(
    () =>
      transactions
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0),
    [transactions]
  );

  const expense = useMemo(
    () =>
      transactions
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0),
    [transactions]
  );

  const balance = income - expense;

  async function addTransaction(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const numberAmount = Number(amount);

    if (!title.trim() || !numberAmount || numberAmount <= 0) {
      alert("กรุณากรอกรายการและจำนวนเงินให้ถูกต้อง");
      return;
    }
const { data: accountData, error: accountError } = await supabase
  .from("accounts")
  .select("id")
  .eq("name", account)
  .single();

if (accountError || !accountData) {
  alert("ไม่พบบัญชีในฐานข้อมูล");
  return;
}
const { data: categoryData, error: categoryError } = await supabase
  .from("categories")
  .select("id")
  .eq("name", category)
  .eq("type", type)
  .single();

if (categoryError || !categoryData) {
  alert("ไม่พบหมวดหมู่ในฐานข้อมูล");
  return;
}
  if (editingId) {
  const { error: updateError } = await supabase
    .from("transactions")
    .update({
      date,
      account_id: accountData.id,
      category_id: categoryData.id,
      title: title.trim(),
      amount: numberAmount,
      type,
    })
    .eq("id", editingId);

  if (updateError) {
    alert("แก้ไขข้อมูลไม่สำเร็จ: " + updateError.message);
    return;
  }
setTransactions((current) =>
  current.map((item) =>
    item.id === editingId
      ? {
          ...item,
          type,
          title: title.trim(),
          amount: numberAmount,
          date,
          account,
          category,
        }
      : item
  )
);
setEditingId(null);
setTitle("");
setAmount("");
return;
}
    const { data: insertedData, error: insertError } = await supabase
  .from("transactions")
  .insert({
    date,
    account_id: accountData.id,
    category_id: categoryData.id,
    title: title.trim(),
    amount: numberAmount,
    type,
  })
    .select("id")
    .single();

if (insertError) {
  alert("บันทึกข้อมูลไม่สำเร็จ: " + insertError.message);
  return;
}
    const newTransaction: Transaction = {
      id: insertedData.id,
      type,
      title: title.trim(),
      amount: numberAmount,
      date,
      account,
      category,
    };

    setTransactions((current) => [newTransaction, ...current]);
    setTitle("");
    setAmount("");
  }

 async function deleteTransaction(id: string) {
    const { error } = await supabase
  .from("transactions")
  .delete()
  .eq("id", id);

if (error) {
  alert("ลบข้อมูลไม่สำเร็จ: " + error.message);
  return;
}
    setTransactions((current) =>
  current.filter((item) => item.id !== id)
); 
  }
  function startEdit(item: Transaction) {
  setEditingId(item.id);
  setType(item.type);
  setTitle(item.title);
  setAmount(String(item.amount));
  setDate(item.date);
  setAccount(item.account);
  setCategory(item.category);
}

  const money = (value: number) =>
    new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 2,
    }).format(value);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">บัญชีรายรับ–รายจ่าย</h1>
          <p className="mt-2 text-slate-500">
            บันทึกและตรวจสอบเงินเข้า–ออกได้ง่าย ๆ
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">รายรับทั้งหมด</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {money(income)}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">รายจ่ายทั้งหมด</p>
            <p className="mt-2 text-2xl font-bold text-red-500">
              {money(expense)}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">ยอดคงเหลือ</p>
            <p
              className={`mt-2 text-2xl font-bold ${
                balance >= 0 ? "text-blue-600" : "text-red-600"
              }`}
            >
              {money(balance)}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">เพิ่มรายการ</h2>

          <form
            onSubmit={addTransaction}
            className="grid gap-4 md:grid-cols-2"
          >
            <div>
  <label className="mb-2 block text-sm font-medium">
    บัญชี
  </label>

  <select
    value={account}
    onChange={(e) => setAccount(e.target.value)}
    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
  >
  {accounts.map((name) => (
  <option key={name} value={name}>
    {name}
  </option>
))}
    
  </select>
</div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                ประเภทรายการ
              </label>

              <select
                value={type}
              onChange={(e) => {
  const newType = e.target.value as "income" | "expense";
  setType(newType);
  setCategory(newType === "income" ? "รายรับทั่วไป" : "อาหาร");
}}
                
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              >
                <option value="income">รายรับ</option>
                <option value="expense">รายจ่าย</option>
              </select>
            </div>
<div>
  <label className="mb-2 block text-sm font-medium">
    หมวดหมู่
  </label>

  <select
    value={category}
    onChange={(e) => setCategory(e.target.value)}
    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
  >
    {type === "income" ? (
    <>
  {categories
    .filter((item) => item.type === "income")
    .map((item) => (
      <option key={item.name} value={item.name}>
        {item.name}
      </option>
    ))}
</>
    ) : (
    <>
  {categories
    .filter((item) => item.type === "expense")
    .map((item) => (
      <option key={item.name} value={item.name}>
        {item.name}
      </option>
    ))}
</>
    )}
  </select>
</div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                วันที่
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                รายการ
              </label>

              <input
                type="text"
                placeholder="เช่น ค่าอาหาร, เงินเดือน"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                จำนวนเงิน (บาท)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white md:col-span-2"
            >
             {editingId ? "✓ บันทึกการแก้ไข" : "+ บันทึกรายการ"}
            </button>
          </form>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">รายการล่าสุด</h2>

          {transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              ยังไม่มีรายการ
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                >
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {item.date}
                    </p>
                    <p className="mt-1 text-sm text-blue-600">บัญชี: {item.account}</p>
                    <p className="mt-1 text-sm text-purple-600">หมวดหมู่: {item.category}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <p
                      className={`font-bold ${
                        item.type === "income"
                          ? "text-emerald-600"
                          : "text-red-500"
                      }`}
                    >
                      {item.type === "income" ? "+" : "-"}
                      {money(item.amount)}
                    </p>

                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-600"
                  >
                    แก้ไข
                  </button>
                    <button
                      type="button"
                      onClick={() => deleteTransaction(item.id)}
                      className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-xs text-slate-400">
          Financial App
        </p>
      </div>
    </main>
  );
}
