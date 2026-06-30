import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createDistributor } from "../actions";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function NuevoProveedorPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button asChild size="icon" variant="ghost">
          <Link href="/dashboard/proveedores" title="Volver">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Nuevo proveedor</h1>
          <p className="text-sm text-foreground/60">
            Registrá un nuevo distribuidor o imprenta.
          </p>
        </div>
      </div>

      <form action={createDistributor} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="nickname">Nombre</Label>
          <Input id="nickname" name="nickname" placeholder="Distribuidor 1" required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="address">Dirección</Label>
          <Input id="address" name="address" placeholder="Calle 1" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" name="city" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="state">Departamento</Label>
            <Input id="state" name="state" placeholder="Comayagua" />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="postcode">Código postal</Label>
            <Input id="postcode" name="postcode" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone_number">Teléfono</Label>
            <Input id="phone_number" name="phone_number" placeholder="555-1234" />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="country">País</Label>
            <Input id="country" name="country" defaultValue="Honduras" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="status">Estado</Label>
            <select id="status" name="status" defaultValue="activo" className={selectClass}>
              <option value="activo">activo</option>
              <option value="inactivo">inactivo</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit">Guardar</Button>
          <Button asChild variant="outline" type="button">
            <Link href="/dashboard/proveedores">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
