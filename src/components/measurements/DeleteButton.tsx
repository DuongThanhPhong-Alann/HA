"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog";
import { text, type AppLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

export function DeleteButton({ id, path, locale = "vi" }: { id: string; path: string | null; locale?: AppLocale }) {
  const router = useRouter();

  const remove = async () => {
    const supabase = createClient();
    const { error } = await supabase.from("blood_pressure_records").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    if (path) await supabase.storage.from("bp-images").remove([path]);
    toast.success(text(locale,"Đã xóa lần đo","Reading deleted"));
    router.push("/measurements");
    router.refresh();
    return true;
  };

  return <DeleteConfirmationDialog
    locale={locale}
    ariaLabel={text(locale,"Xóa lần đo","Delete reading")}
    triggerClassName="btn border border-red-200 text-red-700"
    triggerLabel={<><Trash2 size={18}/>{text(locale,"Xóa","Delete")}</>}
    onConfirm={remove}
  />;
}
