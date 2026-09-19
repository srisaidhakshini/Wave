"use client";
import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { CATEGORY_COLORS } from "@/lib/utils";

export default function Categories() {
  const { categories, tasks, addCategory, updateCategory, deleteCategory } = useStore();
  const [name, setName] = useState(""); const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const uncategorised = tasks.filter((t) => !t.categoryId && !t.isCompleted).length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <p className="mt-1 text-sm text-muted">Deleting a category keeps its tasks. They become uncategorised.</p>
      </header>

      <ul>
        {categories.map((c) => {
          const open = tasks.filter((t) => t.categoryId === c.id && !t.isCompleted).length;
          return (
            <li key={c.id} className="row-hover flex items-center gap-3 border-t border-line px-2 py-3 last:border-b">
              <input type="color" value={c.color} onChange={(e) => updateCategory(c.id, { color: e.target.value })} aria-label={`Colour for ${c.name}`} className="h-8 w-8 cursor-pointer rounded border border-line bg-transparent p-0.5" />
              <input key={c.name} className="min-w-0 flex-1 bg-transparent text-sm font-medium focus:outline-none" defaultValue={c.name} maxLength={40} aria-label="Category name"
                onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== c.name) updateCategory(c.id, { name: v }); else e.target.value = c.name; }} />
              <Link href={`/app/tasks?category=${c.id}`} className="text-xs text-muted hover:text-accent">{open} open</Link>
              <button className="btn-icon hover:!text-coral" onClick={() => deleteCategory(c.id)} aria-label={`Delete ${c.name}`}><Trash2 size={16} /></button>
            </li>
          );
        })}
        {uncategorised > 0 && (
          <li className="flex items-center gap-3 border-b border-line px-2 py-3 text-sm text-muted">
            <span className="h-8 w-8 rounded border border-dashed border-line" /><span className="flex-1">Uncategorised</span>
            <Link href="/app/tasks?category=none" className="text-xs hover:text-accent">{uncategorised} open</Link>
          </li>
        )}
      </ul>

      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addCategory(name, color); setName(""); }}>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="New category colour" className="h-11 w-11 shrink-0 cursor-pointer rounded-lg border border-line bg-transparent p-0.5" />
        <input className="input" placeholder="New category name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary" disabled={!name.trim()}>Add</button>
      </form>
    </div>
  );
}
