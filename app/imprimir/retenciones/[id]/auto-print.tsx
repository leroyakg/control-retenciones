"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function AutoPrint() {
  useEffect(() => {
    const id = setTimeout(() => window.print(), 200);
    return () => clearTimeout(id);
  }, []);

  return null;
}

export function PrintButton() {
  return (
    <Button onClick={() => window.print()} type="button">
      <Printer className="size-4" />
      Imprimir
    </Button>
  );
}
