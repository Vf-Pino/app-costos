export enum RubroPrincipal {
  Mercancia = 'Mercancia',
  NominaOperativa = 'Nomina Operativa',
  NominaAdministrativa = 'Nomina Administrativa',
  Arriendo = 'Arriendo',
  Servicios = 'Servicios',
  Publicidad = 'Publicidad',
  Mantenimiento = 'Mantenimiento',
  Otros = 'Otros'
}

export enum SubcategoriaMercancia {
  Carnes = 'Carnes',
  Quesos = 'Quesos',
  Legumbres = 'Legumbres',
  Bebidas = 'Bebidas',
  Aseo = 'Aseo',
  Desechables = 'Desechables'
}

// Added to allow dynamic subcategories created by the user
export type SubcategoriaValor = SubcategoriaMercancia | string;

export enum MetodoPago {
  Efectivo = 'Efectivo',
  Transferencia = 'Transferencia'
}

export type UserRole = 'admin' | 'empleado' | null;
