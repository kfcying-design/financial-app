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
  created_at: string;
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
  const [newAccount, setNewAccount] = useState("");
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [editAccountName, setEditAccountName] = useState("");
  const [category, setCategory] = useState("รายรับทั่วไป");
  const [categories, setCategories] = useState<{ name: string; type: string }[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
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
async function addCategory() {
  const name = newCategory.trim();

  if (!name) {
    alert("กรุณากรอกชื่อหมวดหมู่");
    return;
  }
  const { error } = await supabase
  .from("categories")
  .insert({ name, type });

if (error) {
  alert("เพิ่มหมวดหมู่ไม่สำเร็จ: " + error.message);
  return;
}
setCategories((current) => [...current, { name, type }]);
setCategory(name);
setNewCategory("");
setShowAddCategory(false);
}
  async function loadTransactions() {
    const { data, error } = await supabase
  .from("transactions")
  .select("*, accounts(name), categories(name)")
  .order("date", { ascending: false })
  .order("created_at", { ascending: false });
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
      created_at: item.created_at,
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
async function addAccount() {
  const name = newAccount.trim();

  if (!name) {
    alert("กรุณากรอกชื่อบัญชี");
    return;
  }

  const { error } = await supabase
    .from("accounts")
    .insert({ name, type: "personal" });

  if (error) {
    alert("เพิ่มบัญชีไม่สำเร็จ: " + error.message);
    return;
  }

  setAccounts((current) => [...current, name]);
  setAccount(name);
  setNewAccount("");
  setShowAddAccount(false);
}
async function deleteAccount(name: string) {
  const hasTransactions = transactions.some(
    (item) => item.account === name
  );

  if (hasTransactions) {
    alert("ไม่สามารถลบบัญชีนี้ได้ เพราะยังมีรายการรายรับ–รายจ่ายอยู่");
    return;
  }
const confirmed = confirm(`ต้องการลบบัญชี "${name}" ใช่หรือไม่?`);

if (!confirmed) {
  return;
}
const { error } = await supabase
  .from("accounts")
  .delete()
  .eq("name", name);

if (error) {
  alert("ลบบัญชีไม่สำเร็จ: " + error.message);
  return;
}
setAccounts((current) => current.filter((item) => item !== name));
}
async function updateAccount() {
  const newName = editAccountName.trim();

  if (!newName) {
    alert("กรุณากรอกชื่อบัญชีใหม่");
    return;
  }
const oldName = account;

const { error } = await supabase
  .from("accounts")
  .update({ name: newName })
  .eq("name", oldName);

if (error) {
  alert("แก้ชื่อบัญชีไม่สำเร็จ: " + error.message);
  return;
}
setAccounts((current) =>
  current.map((item) => (item === oldName ? newName : item))
);

setAccount(newName);
setEditAccountName("");
setShowEditAccount(false);
}
const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
const [filterAccount, setFilterAccount] = useState("all");
const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
const filteredTransactions = useMemo(() => transactions.filter((item) =>
  (filterType === "all" || item.type === filterType) &&
  (filterAccount === "all" || item.account === filterAccount) &&
  (filterMonth === "all" || item.date.startsWith(filterMonth))
), [transactions, filterType, filterAccount, filterMonth]);
  const income = useMemo(
    () =>
      filteredTransactions
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0),
    [filteredTransactions]
  );

  const expense = useMemo(
    () =>
      filteredTransactions
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0),
    [filteredTransactions]
  );

  const balance = income - expense;
const filterMonthLabel =
  filterMonth === "all"
    ? "ทุกเดือน"
    : new Intl.DateTimeFormat("th-TH", {
        month: "long",
        year: "numeric",
      }).format(new Date(`${filterMonth}-01T00:00:00`));
  const expenseByCategory = Object.entries(
  filteredTransactions
    .filter((item) => item.type === "expense")
    .reduce<Record<string, number>>((result, item) => {
      result[item.category] = (result[item.category] || 0) + item.amount;
      return result;
    }, {})
).sort((a, b) => b[1] - a[1]);
  const incomeByCategory = Object.entries(
  filteredTransactions
    .filter((item) => item.type === "income")
    .reduce<Record<string, number>>((result, item) => {
      result[item.category] = (result[item.category] || 0) + item.amount;
      return result;
    }, {})
).sort((a, b) => b[1] - a[1]);

  const summaryByAccount = Object.entries(
  filteredTransactions.reduce<
    Record<string, { income: number; expense: number }>
  >((result, item) => {
    if (!result[item.account]) {
      result[item.account] = { income: 0, expense: 0 };
    }

    result[item.account][item.type] += item.amount;
    return result;
  }, {})
);
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
    .select("id, created_at")
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
      created_at: insertedData.created_at,
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
        
        <p className="mb-4 text-sm text-slate-500">
          สรุปยอด • {filterMonthLabel}
        </p>

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
<button
  type="button"
  onClick={() => setShowAddAccount(!showAddAccount)}
  className="mt-2 text-sm text-blue-600"
>
  + เพิ่มบัญชี
</button>
<button
  type="button"
  onClick={() => {
    setEditAccountName(account);
    setShowEditAccount(!showEditAccount);
  }}
  className="ml-3 mt-2 text-sm text-amber-600"
>
  แก้ชื่อบัญชี
</button>
<button
  type="button"
  onClick={() => deleteAccount(account)}
  className="ml-3 mt-2 text-sm text-red-600"
>
  ลบบัญชีนี้
</button>
{showEditAccount && (
  <div className="mt-2 flex gap-2">
    <input
      type="text"
      value={editAccountName}
      onChange={(e) => setEditAccountName(e.target.value)}
      placeholder="ชื่อบัญชีใหม่"
      className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3"
    />
    <button
      type="button"
      onClick={updateAccount}
      className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-medium text-white"
    >
      บันทึกชื่อใหม่
    </button>
  </div>
)}
{showAddAccount && (
  <div className="mt-2 flex gap-2">
    <input
      type="text"
      value={newAccount}
      onChange={(e) => setNewAccount(e.target.value)}
      placeholder="ชื่อบัญชีใหม่"
      className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3"
    />
  <button
  type="button"
  onClick={addAccount}
  className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white"
>
  บันทึก
</button>
  </div>
)}
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
  {editingId && (
    <button
    type="button"
    onClick={() => {
      setEditingId(null);
      setTitle("");
      setAmount("");
    }}
    className="mt-2 w-full rounded-xl bg-slate-100 px-6 py-3 font-semibold text-slate-600"
    >
    ยกเลิกการแก้ไข
  </button>
)}
          </form>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">รายการล่าสุด</h2>
          <div className="mb-4 flex gap-2">
  <button
    type="button"
    onClick={() => setFilterType("all")}
    className={`rounded-lg px-4 py-2 ${
  filterType === "all"
    ? "bg-slate-800 text-white"
    : "bg-slate-100 text-slate-700"
  }`}
  >
    ทั้งหมด
  </button>

  <button
    type="button"
    onClick={() => setFilterType("income")}
   className={`rounded-lg px-4 py-2 ${
  filterType === "income"
    ? "bg-emerald-600 text-white"
    : "bg-emerald-50 text-emerald-600"
}`}
  >
    รายรับ
  </button>

  <button
    type="button"
    onClick={() => setFilterType("expense")}
   className={`rounded-lg px-4 py-2 ${
  filterType === "expense"
    ? "bg-red-500 text-white"
    : "bg-red-50 text-red-500"
}`}
  >
    รายจ่าย
  </button>
</div>
<button
  type="button"
  onClick={() => {
    setFilterType("all");
    setFilterAccount("all");
    setFilterMonth("all");
  }}
  className="mb-4 rounded-lg bg-slate-200 px-4 py-2 text-slate-700"
>
  ล้างตัวกรอง
</button>
<div className="mb-4">
  <label className="mb-2 block text-sm font-medium">
    กรองตามบัญชี
  </label>

  <select
    value={filterAccount}
    onChange={(e) => setFilterAccount(e.target.value)}
    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
  >
    <option value="all">ทุกบัญชี</option>
    {accounts.map((name) => (
      <option key={name} value={name}>
        {name}
      </option>
    ))}
  </select>
</div>
<div className="mb-4">
  <label className="mb-2 block text-sm font-medium">
    กรองตามเดือน
  </label>

  <input
    type="month"
    value={filterMonth === "all" ? "" : filterMonth}
    onChange={(e) => setFilterMonth(e.target.value || "all")}
    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
  />
<button
  type="button"
  onClick={() => setFilterMonth(new Date().toISOString().slice(0, 7))}
  className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-600"
>
  เดือนนี้
</button>
</div>

       {transactions.filter((item) =>
          (filterType === "all" || item.type === filterType) &&
          (filterAccount === "all" || item.account === filterAccount) &&
          (filterMonth === "all" || item.date.startsWith(filterMonth))
      ).length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              ไม่พบรายการตามตัวกรอง
            </div>
          ) : (
            <div className="space-y-3">
              
             {transactions
            .filter((item) => filterType === "all" || item.type === filterType)
            .filter((item) => filterAccount === "all" || item.account === filterAccount)
            .filter((item) => filterMonth === "all" || item.date.startsWith(filterMonth))
            .map((item) => (
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
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">รายจ่ายตามหมวดหมู่</h2>
        {expenseByCategory.length === 0 ? (
          <p className="text-sm text-slate-400">ยังไม่มีข้อมูลรายจ่าย</p>
        ) : (
        <div className="space-y-3">
          {expenseByCategory.map(([categoryName, total]) => (
  <div
    key={categoryName}
    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
  >
    <span>{categoryName}</span>
    <span className="font-semibold text-red-500">
      {money(total)} ({expense > 0 ? ((total / expense) * 100).toFixed(1) : "0.0"}%)
    </span>
  </div>
))}
        </div>
            )}
        </section>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
  <h2 className="mb-5 text-xl font-bold">รายรับตามหมวดหมู่</h2>

  {incomeByCategory.length === 0 ? (
    <p className="text-sm text-slate-400">ยังไม่มีข้อมูลรายรับ</p>
  ) : (
    <div className="space-y-3">
      {incomeByCategory.map(([categoryName, total]) => (
        <div
          key={categoryName}
          className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
        >
          <span>{categoryName}</span>

          <span className="font-semibold text-emerald-600">
            {money(total)} ({income > 0 ? ((total / income) * 100).toFixed(1) : "0.0"}%)
          </span>
        </div>
      ))}
    </div>
  )}
</section>

<section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
  <h2 className="mb-5 text-xl font-bold">สรุปตามบัญชี</h2>

  {summaryByAccount.length === 0 ? (
    <p className="text-sm text-slate-400">ยังไม่มีข้อมูลบัญชี</p>
  ) : (
    <div className="space-y-3">
      {summaryByAccount.map(([accountName, summary]) => {
        const accountBalance = summary.income - summary.expense;

        return (
          <div
            key={accountName}
            className="rounded-xl bg-slate-50 px-4 py-4"
          >
            <p className="mb-2 font-semibold">{accountName}</p>

            <div className="grid gap-2 sm:grid-cols-3">
              <p className="text-emerald-600">
                รายรับ {money(summary.income)}
              </p>

              <p className="text-red-500">
                รายจ่าย {money(summary.expense)}
              </p>

              <p
                className={
                  accountBalance >= 0 ? "text-blue-600" : "text-red-600"
                }
              >
                คงเหลือ {money(accountBalance)}
              </p>
            </div>
          </div>
        );
      })}
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
