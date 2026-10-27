import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { OrderDetailsDto } from '@dzen/shared';
import { OrderDetailsPanel } from '@/features/orders/OrderDetailsPanel';
import { toAppLocale } from '@/i18n/routing';
import { serverGet } from '@/lib/server-api';

const loadOrder = cache((id: number) => serverGet<OrderDetailsDto>(`/orders/${id}`));

function parseOrderId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return id;
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/orders/[id]'>): Promise<Metadata> {
  const order = await loadOrder(parseOrderId((await params).id));
  return order.ok ? { title: order.data.title } : {};
}

export default async function Page({ params }: PageProps<'/[locale]/orders/[id]'>) {
  const { locale, id } = await params;
  setRequestLocale(toAppLocale(locale));

  const orderId = parseOrderId(id);
  const order = await loadOrder(orderId);
  if (!order.ok && order.status === 404) notFound();

  return <OrderDetailsPanel key={orderId} id={orderId} initial={order.ok ? order.data : null} />;
}
