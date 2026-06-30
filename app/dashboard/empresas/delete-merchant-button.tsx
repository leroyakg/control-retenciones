"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteMerchant } from "./actions";

export function DeleteMerchantButton({
  id,
  nickname,
}: {
  id: string;
  nickname: string;
}) {
  return (
    <form
      action={deleteMerchant}
      onSubmit={(e) => {
        if (!confirm(`¿Eliminar "${nickname}"?`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        size="icon"
        variant="ghost"
        type="submit"
        title="Eliminar"
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>
    </form>
  );
}
