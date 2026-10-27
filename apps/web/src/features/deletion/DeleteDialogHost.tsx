'use client';

import dynamic from 'next/dynamic';
import { useAppSelector } from '@/store/hooks';
import { selectDeleteTarget } from './deletion.slice';

const DeleteDialog = dynamic(() => import('./DeleteDialog').then((module) => module.DeleteDialog), {
  ssr: false,
});

export function DeleteDialogHost() {
  const target = useAppSelector(selectDeleteTarget);
  return target ? <DeleteDialog target={target} /> : null;
}
