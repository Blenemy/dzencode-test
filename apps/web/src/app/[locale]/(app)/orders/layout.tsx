import { setRequestLocale } from 'next-intl/server';
import type { ListResponse, OrderSummaryDto } from '@dzen/shared';
import { OrdersView } from '@/features/orders/OrdersView';
import { toAppLocale } from '@/i18n/routing';
import { serverGet } from '@/lib/server-api';

export default async function OrdersLayout({ children, params }: LayoutProps<'/[locale]/orders'>) {
  setRequestLocale(toAppLocale((await params).locale));

  const orders = await serverGet<ListResponse<OrderSummaryDto>>('/orders');

  return <OrdersView initial={orders.ok ? orders.data : null}>{children}</OrdersView>;
}
