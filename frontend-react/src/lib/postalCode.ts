import { api } from './api';

export type PostalAddress = {
  postalCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  source: 'ViaCEP' | 'BrasilAPI';
};

export const formatPostalCode = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};

export async function lookupPostalCode(value: string) {
  const postalCode = value.replace(/\D/g, '');
  if (postalCode.length !== 8) throw new Error('Informe os 8 números do CEP.');
  return api<{ data: PostalAddress }>(`/api/public-data/postal-code/${postalCode}`);
}

export const addressLine = (address: PostalAddress) =>
  [address.street, address.neighborhood].filter(Boolean).join(' - ');
