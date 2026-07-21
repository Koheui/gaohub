"use client";

import { useState } from "react";
import type { RegistrationFieldDef, RegistrationFieldType } from "@/lib/types";
import { ui } from "@/lib/ui";

const TYPE_LABELS: Record<RegistrationFieldType, string> = {
  text: "短文",
  textarea: "長文",
  select: "選択式",
  checkbox: "チェックボックス",
};

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * 質問項目(RegistrationFieldDef[])を編集する汎用コンポーネント(controlled)。
 * 申込フォームのカスタム質問・アンケートの設問の両方で使える。
 */
export function QuestionsEditor({
  value,
  onChange,
}: {
  value: RegistrationFieldDef[];
  onChange: (next: RegistrationFieldDef[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [labelText, setLabelText] = useState("");
  const [type, setType] = useState<RegistrationFieldType>("text");
  const [required, setRequired] = useState(false);
  const [optionsText, setOptionsText] = useState("");

  function addField() {
    const l = labelText.trim();
    if (!l) return;
    const newField: RegistrationFieldDef = {
      id: randomId(),
      label: l,
      type,
      required,
      options:
        type === "select"
          ? optionsText.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
    };
    onChange([...value, newField]);
    setLabelText("");
    setType("text");
    setRequired(false);
    setOptionsText("");
    setAdding(false);
  }

  return (
    <div>
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between rounded border border-zinc-200 px-3 py-2 text-sm"
            >
              <span>
                <span className="font-bold">{f.label}</span>
                <span className="ml-2 text-xs text-zinc-400">
                  [{TYPE_LABELS[f.type]}]{f.required && " 必須"}
                </span>
                {f.type === "select" && f.options.length > 0 && (
                  <span className="ml-2 text-xs text-zinc-400">({f.options.join(" / ")})</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x.id !== f.id))}
                className="text-xs text-zinc-400 hover:text-red-600"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
      {adding ? (
        <div className="mt-3 space-y-3 border-2 border-dashed border-zinc-300 p-3">
          <input
            value={labelText}
            onChange={(e) => setLabelText(e.target.value)}
            className={ui.input}
            placeholder="質問文(例: 満足度を教えてください)"
            maxLength={120}
          />
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as RegistrationFieldType)}
              className={`${ui.input} mt-0 max-w-[10rem]`}
            >
              {(Object.keys(TYPE_LABELS) as RegistrationFieldType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="h-4 w-4"
              />
              必須にする
            </label>
          </div>
          {type === "select" && (
            <input
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              className={ui.input}
              placeholder="選択肢をカンマ区切りで入力(例: 非常に満足,満足,普通,不満)"
            />
          )}
          <div className="flex gap-3">
            <button type="button" onClick={addField} disabled={!labelText.trim()} className={ui.btn}>
              追加する
            </button>
            <button type="button" onClick={() => setAdding(false)} className={ui.btnGhost}>
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className={`mt-3 ${ui.btnText}`}>
          + 質問を追加
        </button>
      )}
    </div>
  );
}
