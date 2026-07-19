"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
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

interface StandardFieldSettings {
  askCompany: boolean;
  requireCompany: boolean;
  askJobTitle: boolean;
  requireJobTitle: boolean;
}

/**
 * 申込フォームの主催者カスタム質問を管理する。氏名・メールアドレス・会社名・役職の
 * 固定項目に加えて、イベントごとに自由な質問(短文/長文/選択式/チェックボックス)を追加できる。
 * 氏名・メールアドレスはチケット配送に必須のため常時表示・必須固定。会社名・役職は
 * イベントごとに表示有無・必須有無を切り替えられる。
 */
export function RegistrationFieldsManager({
  eventId,
  fields,
  standardFields,
}: {
  eventId: string;
  fields: RegistrationFieldDef[];
  standardFields: StandardFieldSettings;
}) {
  const [adding, setAdding] = useState(false);
  const [labelText, setLabelText] = useState("");
  const [type, setType] = useState<RegistrationFieldType>("text");
  const [required, setRequired] = useState(false);
  const [optionsText, setOptionsText] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(next: RegistrationFieldDef[]) {
    setBusy(true);
    try {
      await updateDoc(doc(db, "events", eventId), { registrationFields: next });
    } finally {
      setBusy(false);
    }
  }

  async function updateStandard(patch: Partial<StandardFieldSettings>) {
    await updateDoc(doc(db, "events", eventId), patch);
  }

  async function addField() {
    const l = labelText.trim();
    if (!l) return;
    const newField: RegistrationFieldDef = {
      id: randomId(),
      label: l,
      type,
      required,
      options:
        type === "select"
          ? optionsText
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
    };
    await save([...fields, newField]);
    setLabelText("");
    setType("text");
    setRequired(false);
    setOptionsText("");
    setAdding(false);
  }

  async function removeField(id: string) {
    await save(fields.filter((f) => f.id !== id));
  }

  return (
    <div className={`mt-6 p-4 ${ui.card}`}>
      <p className={ui.label}>申込フォームの質問項目</p>
      <p className="mt-1 text-xs text-zinc-500">
        イベントごとに参加者へ入力してもらう項目を設定できます。氏名・メールアドレスは
        QRチケットの送付に必要なため常に必須です。
      </p>

      <div className="mt-4 divide-y divide-zinc-100 rounded border border-zinc-200">
        <div className="flex items-center justify-between px-3 py-2 text-sm">
          <span className="font-bold text-zinc-400">氏名・メールアドレス</span>
          <span className="text-xs text-zinc-400">常時表示・必須</span>
        </div>
        <div className="flex items-center justify-between px-3 py-2 text-sm">
          <span className="font-bold">会社名</span>
          <span className="flex items-center gap-4">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={standardFields.askCompany}
                onChange={(e) => updateStandard({ askCompany: e.target.checked })}
                className="h-4 w-4"
              />
              表示する
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={standardFields.requireCompany}
                disabled={!standardFields.askCompany}
                onChange={(e) => updateStandard({ requireCompany: e.target.checked })}
                className="h-4 w-4 disabled:opacity-40"
              />
              必須にする
            </label>
          </span>
        </div>
        <div className="flex items-center justify-between px-3 py-2 text-sm">
          <span className="font-bold">役職</span>
          <span className="flex items-center gap-4">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={standardFields.askJobTitle}
                onChange={(e) => updateStandard({ askJobTitle: e.target.checked })}
                className="h-4 w-4"
              />
              表示する
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={standardFields.requireJobTitle}
                disabled={!standardFields.askJobTitle}
                onChange={(e) => updateStandard({ requireJobTitle: e.target.checked })}
                className="h-4 w-4 disabled:opacity-40"
              />
              必須にする
            </label>
          </span>
        </div>
      </div>

      <p className="mt-4 text-xs font-black uppercase tracking-[0.15em] text-zinc-400">
        追加のカスタム質問
      </p>
      {fields.length > 0 && (
        <ul className="mt-3 space-y-2">
          {fields.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between rounded border border-zinc-200 px-3 py-2 text-sm"
            >
              <span>
                <span className="font-bold">{f.label}</span>
                <span className="ml-2 text-xs text-zinc-400">
                  [{TYPE_LABELS[f.type]}]
                  {f.required && " 必須"}
                </span>
                {f.type === "select" && f.options.length > 0 && (
                  <span className="ml-2 text-xs text-zinc-400">({f.options.join(" / ")})</span>
                )}
              </span>
              <button
                onClick={() => removeField(f.id)}
                disabled={busy}
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
            placeholder="質問文(例: Tシャツサイズ)"
            maxLength={60}
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
              placeholder="選択肢をカンマ区切りで入力(例: S,M,L,XL)"
            />
          )}
          <div className="flex gap-3">
            <button onClick={addField} disabled={busy || !labelText.trim()} className={ui.btn}>
              追加する
            </button>
            <button onClick={() => setAdding(false)} className={ui.btnGhost}>
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className={`mt-3 ${ui.btnText}`}>
          + 質問を追加
        </button>
      )}
    </div>
  );
}
