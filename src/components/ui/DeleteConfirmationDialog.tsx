"use client";

import { AlertTriangle, HeartPulse, ShieldCheck, X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { text, type AppLocale } from "@/lib/i18n";

const confirmationPhrases = ["xoalannay", "chapnhan", "duyet"] as const;

function randomPhrase() {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return confirmationPhrases[value[0] % confirmationPhrases.length];
}

export function DeleteConfirmationDialog({
  locale = "vi",
  onConfirm,
  triggerClassName,
  triggerLabel,
  ariaLabel,
}: {
  locale?: AppLocale;
  onConfirm: () => Promise<boolean | void>;
  triggerClassName: string;
  triggerLabel: ReactNode;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [phrase, setPhrase] = useState<(typeof confirmationPhrases)[number]>("xoalannay");
  const [entered, setEntered] = useState("");
  const [busy, setBusy] = useState(false);
  const matches = entered.trim() === phrase;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [busy, open]);

  const show = () => {
    setPhrase(randomPhrase());
    setEntered("");
    setOpen(true);
  };

  const confirmDelete = async () => {
    if (!matches || busy) return;
    setBusy(true);
    const result = await onConfirm();
    setBusy(false);
    if (result !== false) setOpen(false);
  };

  return <>
    <button type="button" aria-label={ariaLabel} className={triggerClassName} onClick={show}>{triggerLabel}</button>
    {open && createPortal(<div className="confirm-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setOpen(false); }}>
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
        <div className="confirm-dialog__ecg" aria-hidden="true"><HeartPulse/><svg viewBox="0 0 420 38" preserveAspectRatio="none"><path d="M0 22 H95 L106 22 L114 13 L123 31 L136 3 L150 35 L162 22 H260 L271 22 L279 13 L288 31 L301 3 L315 35 L327 22 H420"/></svg></div>
        <button type="button" className="confirm-dialog__close" aria-label={text(locale,"Đóng","Close")} disabled={busy} onClick={() => setOpen(false)}><X size={18}/></button>
        <span className="confirm-dialog__warning"><AlertTriangle size={26}/></span>
        <p className="eyebrow">{text(locale,"XÁC NHẬN BẢO MẬT","SECURE CONFIRMATION")}</p>
        <h2 id="delete-dialog-title">{text(locale,"Xóa vĩnh viễn lần đo?","Permanently delete this reading?")}</h2>
        <p className="confirm-dialog__description">{text(locale,"Dữ liệu và ảnh đính kèm sẽ bị xóa, không thể khôi phục. Nhập chính xác mã bên dưới để xác nhận bạn chủ động thực hiện thao tác này.","The reading and its attached image will be permanently removed. Enter the exact code below to confirm this action.")}</p>
        <div className="confirm-dialog__code"><ShieldCheck size={16}/><code>{phrase}</code></div>
        <label className="confirm-dialog__field">{text(locale,"Nhập mã xác nhận","Enter confirmation code")}<input autoFocus value={entered} disabled={busy} spellCheck={false} autoComplete="off" placeholder={phrase} onChange={(event) => setEntered(event.target.value)}/></label>
        <div className="confirm-dialog__actions">
          <button type="button" className="btn btn-outline" disabled={busy} onClick={() => setOpen(false)}>{text(locale,"Hủy bỏ","Cancel")}</button>
          <button type="button" className="btn confirm-dialog__delete" disabled={!matches || busy} onClick={() => void confirmDelete()}>{busy ? text(locale,"Đang xóa...","Deleting...") : text(locale,"Xác nhận xóa","Confirm deletion")}</button>
        </div>
      </section>
    </div>, document.body)}
  </>;
}
